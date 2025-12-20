import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

// Type Definitions (with optional orderDate)
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "paid" | "cancelled" | "unverified";
export interface CartItem { product_id: number | string; name: string; price: number; quantity: number; }
export interface OrderItem extends CartItem {}
export interface Order { 
  id: number | string;
  orderDate?: string | null; // Optional property
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
  staff_id?: number | null;
}
interface InventoryItem { id: number; name: string; stock: number; threshold: number; low_stock: boolean; }
interface BackendResponse { inventory?: InventoryItem[]; [key: string]: any; }
interface StaffOrderContextType {
  orders: Order[];
  inventory: InventoryItem[];
  newOrderCount: number;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string | number, status: OrderStatus) => Promise<BackendResponse>;
  verifyPayment: (orderId: string | number, amount_received?: number) => Promise<BackendResponse>;
  markOrderNotified: (orderId: string | number) => Promise<void>;
  resetNewOrderCount: () => void;
  loading: boolean;
}

const StaffOrderContext = createContext<StaffOrderContextType | undefined>(undefined);

// Hook to use StaffOrderContext
export const useStaffOrder = (): StaffOrderContextType => {
  const context = useContext(StaffOrderContext);
  if (!context) throw new Error("useStaffOrder must be used within StaffOrderProvider");
  return context;
};

// StaffOrderProvider Component
export const StaffOrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Normalize orders fetched from the backend
  const normalizeOrder = (o: any): Order => ({
    id: o.id,
    // Handle missing or undefined `created_at` and `order_date`
    orderDate: o.created_at || o.order_date || null,  // fallback to null if both are missing
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
    staff_id: o.staff_id ? Number(o.staff_id) : null,
  });

  // Memoized fetchOrders function using useCallback to prevent infinite re-renders
  const fetchOrders = useCallback(async () => {
    if (!user) return; // Do nothing if no user is available
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await res.json();
      const normalized = data.map(normalizeOrder);
      setOrders(normalized);

      const count = normalized.filter(
        (o) => !o.notified && o.status !== "cancelled"
      ).length;
      setNewOrderCount(count);

      // Fetch inventory after fetching orders
      await updateInventoryFromBackend();
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [user, API_URL]); // `user` dependency ensures it only runs when user changes

  // Fetch orders when user is available (only runs when `user` changes)
  useEffect(() => {
    if (user) {
      fetchOrders(); // Only fetch once when user is authenticated
    }
  }, [user, fetchOrders]); // Only triggers when `user` changes

  // Fetch inventory from backend
  const updateInventoryFromBackend = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const data = await res.json();
      setInventory(data);
      // Display warning for low stock
      data.forEach(i => {
        if (i.low_stock) {
          toast.warning(`⚠ LOW STOCK: ${i.name} (Remaining: ${i.stock})`);
        }
      });
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  };

  // Deduct stock from inventory after order is placed
  const deductInventoryStock = async (items: OrderItem[]) => {
    const itemPromises = items.map(async (item) => {
      await fetch(`${API_URL}/api/inventory/deduct`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity }),
      });
    });
    await Promise.all(itemPromises);
  };

  // Handle order creation, deduct inventory, and update order status
  const createOrder = async (order: Order) => {
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(order),
      });

      const data = await res.json();
      if (res.ok) {
        await deductInventoryStock(order.items);  // Deduct stock after order is placed
        fetchOrders();  // Re-fetch orders to update state
      } else {
        toast.error("Failed to create order");
      }
    } catch (err) {
      console.error("Error creating order", err);
    }
  };

  // Update order status
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

      if (!res.ok) throw new Error("Failed to update order status");

      const data: BackendResponse = await res.json();
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status, staff_id: user?.id } : o))
      );
      return data;
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
      throw err;
    }
  };

  // Verify payment and update order status
  const verifyPayment = async (orderId: string | number, amount_received?: number) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/verify-payment/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ amount_received }),
      });

      if (!res.ok) throw new Error("Failed to verify payment");

      const data: BackendResponse = await res.json();
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, paymentStatus: "paid" } : o)));
      return data;
    } catch (err) {
      console.error("VERIFY PAYMENT ERROR:", err);
      throw err;
    }
  };

  // Mark order as notified
  const markOrderNotified = async (orderId: string | number) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/notified`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to mark notified");
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, notified: true } : o)));
      setNewOrderCount(prev => Math.max(prev - 1, 0));
      toast.success("Order marked as notified");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetNewOrderCount = () => setNewOrderCount(0);

  return (
    <StaffOrderContext.Provider
      value={{
        orders,
        inventory,
        newOrderCount,
        fetchOrders,
        updateOrderStatus,
        verifyPayment,
        markOrderNotified,
        resetNewOrderCount,
        loading,
      }}
    >
      {children}
    </StaffOrderContext.Provider>
  );
};
