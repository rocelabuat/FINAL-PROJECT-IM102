import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  firstName: string;
  lastName: string;
  payment_method: string;
  paymentStatus: string;
  status: OrderStatus;
  total: number;
  subtotal?: number;
  items: OrderItem[];
  referenceNumber?: string;
  amount_received?: number;
  change_amount?: number;
  notified?: boolean;
}

interface StaffOrderContextType {
  orders: Order[];
  fetchOrders: () => Promise<void>;
  addWalkInOrder: (order: Partial<Order> & { items: OrderItem[] }) => Promise<void>;
  updateOrderStatus: (orderId: string | number, status: OrderStatus) => Promise<void>;
  verifyPayment: (orderId: string | number, amount_received?: number) => Promise<void>;
  markOrderNotified: (orderId: string | number) => Promise<void>;
  loading: boolean;
}

const StaffOrderContext = createContext<StaffOrderContextType | undefined>(undefined);

export const useStaffOrder = () => {
  const context = useContext(StaffOrderContext);
  if (!context) throw new Error("useStaffOrder must be used within StaffOrderProvider");
  return context;
};

export const StaffOrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const normalizeOrder = (o: any): Order => ({
    id: o.id,
    firstName: o.firstName || "",
    lastName: o.lastName || "",
    payment_method: o.payment_method || "cash",
    paymentStatus: o.payment_status || "unverified",
    status: o.status || "unverified",
    total: Number(o.total || 0),
    subtotal: Number(o.subtotal || 0),
    items: Array.isArray(o.items) ? o.items : [],
    referenceNumber: o.gcash_ref || undefined,
    amount_received: o.amount_received ? Number(o.amount_received) : undefined,
    change_amount: o.change_amount ? Number(o.change_amount) : undefined,
    notified: !!o.notified,
  });

  const fetchOrders = async () => {
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
      setOrders(data.map(normalizeOrder));
    } catch (err: any) {
      console.error("FETCH ORDERS ERROR:", err);
      toast.error("Failed to load orders");
      setOrders([]); // ensure fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const addWalkInOrder = async (order: Partial<Order> & { items: OrderItem[] }) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error(`Failed to create order: ${res.status}`);
      const newOrder = normalizeOrder(await res.json());
      setOrders((prev) => [...prev, newOrder]);
    } catch (err: any) {
      console.error("ADD ORDER ERROR:", err);
      toast.error(err.message || "Failed to add order");
    }
  };

  const updateOrderStatus = async (orderId: string | number, status: OrderStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Failed to update status: ${res.status}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err: any) {
      console.error("UPDATE STATUS ERROR:", err);
      toast.error(err.message || "Failed to update order status");
    }
  };

  const verifyPayment = async (orderId: string | number, amount_received?: number) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/verify-payment/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(amount_received !== undefined ? { amount_received } : {}),
      });
      if (!res.ok) throw new Error(`Failed to verify payment: ${res.status}`);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: "paid",
                status: "pending",
                amount_received,
                change_amount: amount_received !== undefined ? amount_received - o.total : o.change_amount,
              }
            : o
        )
      );
      toast.success("Payment verified successfully");
    } catch (err: any) {
      console.error("VERIFY PAYMENT ERROR:", err);
      toast.error(err.message || "Failed to verify payment");
    }
  };

  const markOrderNotified = async (orderId: string | number) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/notified`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      if (!res.ok) throw new Error(`Failed to mark notified: ${res.status}`);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, notified: true } : o))
      );
      toast.success("Customer notified");
    } catch (err: any) {
      console.error("MARK NOTIFIED ERROR:", err);
      toast.error(err.message || "Failed to mark order as notified");
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  return (
    <StaffOrderContext.Provider
      value={{
        orders,
        fetchOrders,
        addWalkInOrder,
        updateOrderStatus,
        verifyPayment,
        markOrderNotified,
        loading,
      }}
    >
      {children}
    </StaffOrderContext.Provider>
  );
};
