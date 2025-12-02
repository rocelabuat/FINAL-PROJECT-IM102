import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "paid"
  | "cancelled"
  | "unverified";

export interface CartItem {
  product_id: number | string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem extends CartItem {}

export interface Order {
  id: number | string;
  orderDate?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  postal: string;
  payment_method: string;
  paymentStatus: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  gcash_ref?: string | null;
  items: OrderItem[];
  amount_received?: number;
  change_amount?: number;
  notified?: boolean;
  staff_id?: number | null; // ✅ added
}

interface StaffOrderContextType {
  orders: Order[];
  newOrderCount: number;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string | number, status: OrderStatus) => Promise<void>;
  verifyPayment: (orderId: string | number, amount_received?: number) => Promise<void>;
  markOrderNotified: (orderId: string | number) => Promise<void>;
  resetNewOrderCount: () => void;
  loading: boolean;
}

const StaffOrderContext = createContext<StaffOrderContextType | undefined>(undefined);

export const useStaffOrder = (): StaffOrderContextType => {
  const context = useContext(StaffOrderContext);
  if (!context) throw new Error("useStaffOrder must be used within StaffOrderProvider");
  return context;
};

export const StaffOrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const normalizeOrder = (o: any): Order => ({
    id: o.id,
    orderDate: o.created_at || o.order_date || o.timestamp || null,
    firstName: o.firstName || "",
    lastName: o.lastName || "",
    phone: o.phone || "",
    address: o.address || "",
    barangay: o.barangay || "",
    city: o.city || "",
    province: o.province || "",
    postal: o.postal || "8000",
    payment_method: o.payment_method || "cash",
    paymentStatus: o.payment_status ?? "unverified",
    status: o.status ?? "unverified",
    subtotal: Number(o.subtotal || 0),
    delivery_fee: Number(o.delivery_fee || 0),
    tax: Number(o.tax || 0),
    total: Number(o.total || 0),
    gcash_ref: o.gcash_ref ?? null,
    items: Array.isArray(o.items) ? o.items : [],
    amount_received: o.amount_received ? Number(o.amount_received) : undefined,
    change_amount: o.change_amount ? Number(o.change_amount) : undefined,
    notified: !!o.notified,
    staff_id: o.staff_id ? Number(o.staff_id) : null, // ✅ map staff
  });

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid orders data from API");

      const normalized = data.map(normalizeOrder);
      setOrders(normalized);

      const count = normalized.filter(o => !o.notified && o.status !== "cancelled").length;
      setNewOrderCount(count);

    } catch (err: any) {
      console.error("FETCH ORDERS ERROR:", err);
      toast.error("Failed to load orders");
      setOrders([]);

    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  const claimOrderIfNeeded = async (orderId: string | number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");

    if (!order.staff_id || order.staff_id === 0) {
      const res = await fetch(`${API_URL}/api/orders/assign/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        }
      });

      if (!res.ok) throw new Error("Failed to claim order");
      // ✅ update state locally
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, staff_id: user?.id } : o));
    }
  };

  const updateOrderStatus = async (orderId: string | number, status: OrderStatus) => {
    try {
      await claimOrderIfNeeded(orderId); // ✅ auto-claim

      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error(`Failed to update status: ${res.status}`);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, staff_id: user?.id } : o));
      toast.success(`Order marked as ${status}`);

    } catch (err: any) {
      console.error("UPDATE STATUS ERROR:", err);
      toast.error(err.message || "Failed to update order status");
    }
  };

  const verifyPayment = async (orderId: string | number, amount_received?: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");
      if (order.status === "cancelled") throw new Error("Cannot verify payment. Order cancelled.");

      await claimOrderIfNeeded(orderId); // ✅ auto-claim first

      const payload = { amount_received };

      const res = await fetch(`${API_URL}/api/orders/verify-payment/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed to verify payment: ${res.status}`);

      setOrders(prev =>
        prev.map(o => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            paymentStatus: "paid",
            status: o.payment_method === "cod" ? "delivered" : "pending",
            amount_received,
            change_amount: amount_received !== undefined ? amount_received - o.total : o.change_amount,
            staff_id: user?.id
          };
        })
      );

      toast.success("Payment verified successfully");

    } catch (err: any) {
      console.error("VERIFY PAYMENT ERROR:", err);
      toast.error(err.message || "Failed to verify payment");
    }
  };

  const markOrderNotified = async (orderId: string | number) => {
    try {
      await claimOrderIfNeeded(orderId); // ✅ auto-claim as well

      const res = await fetch(`${API_URL}/api/orders/${orderId}/notified`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
      });

      if (!res.ok) throw new Error(`Failed to mark notified: ${res.status}`);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notified: true, staff_id: user?.id } : o));
      setNewOrderCount(prev => Math.max(prev - 1, 0));

      toast.success("Order marked as notified");

    } catch (err: any) {
      console.error("MARK NOTIFIED ERROR:", err);
      toast.error(err.message || "Failed to mark order as notified");
    }
  };

  const resetNewOrderCount = () => setNewOrderCount(0);

  // ⏰ Midnight reset
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const mid = new Date();
      mid.setHours(24, 0, 0, 0);
      return mid.getTime() - now.getTime();
    };

    const scheduleReset = () => {
      const timeout = setTimeout(() => {
        resetNewOrderCount();
        fetchOrders();
        scheduleReset();
      }, msUntilMidnight());
      return () => clearTimeout(timeout);
    };

    return scheduleReset();
  }, [fetchOrders]);

  return (
    <StaffOrderContext.Provider
      value={{
        orders,
        newOrderCount,
        fetchOrders,
        updateOrderStatus,
        verifyPayment,
        markOrderNotified,
        resetNewOrderCount,
        loading
      }}
    >
      {children}
    </StaffOrderContext.Provider>
  );
};
