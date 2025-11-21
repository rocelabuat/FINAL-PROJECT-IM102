// src/contexts/OrderContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface OrderContextType {
  orders: any[];
  fetchOrders: () => Promise<void>;
  addOrderBackend: (orderData: any) => Promise<any>;
  cancelOrderBackend: (orderId: number | string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  // ===== Generate Unique Reference Number =====
  const generateReferenceNumber = () => {
    return 'GC' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8).toUpperCase();
  };

  const fetchOrders = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch("http://localhost:5000/api/orders/my", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("FETCH ORDERS ERROR:", err);
    }
  };

  const addOrderBackend = async (orderData: any) => {
    if (!user?.token) throw new Error("Not logged in");
    try {
      // ===== Set correct status/paymentStatus for GCash =====
      if (orderData.payment_method === "gcash") {
        orderData.status = "unverified";
        orderData.paymentStatus = "unverified";
        orderData.gcash_ref = orderData.gcash_ref || generateReferenceNumber();
      } else {
        orderData.status = "pending";
        orderData.paymentStatus = "paid";
      }

      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        let errorMessage = "Failed to create order";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const order = await res.json();
      setOrders(prev => [...prev, order]);
      return order;
    } catch (err: any) {
      console.error("ADD ORDER ERROR:", err);
      throw err;
    }
  };

  const cancelOrderBackend = async (orderId: number | string) => {
    if (!user?.token) throw new Error("Not logged in");
    try {
      const res = await fetch(`http://localhost:5000/api/orders/cancel/${orderId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) {
        let errorMessage = "Failed to cancel order";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      setOrders(prev =>
        prev.map(order =>
          order.id === Number(orderId)
            ? { ...order, status: "cancelled", paymentStatus: "cancelled" }
            : order
        )
      );
    } catch (err: any) {
      console.error("CANCEL ORDER ERROR:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return (
    <OrderContext.Provider
      value={{ orders, fetchOrders, addOrderBackend, cancelOrderBackend }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => useContext(OrderContext)!;
