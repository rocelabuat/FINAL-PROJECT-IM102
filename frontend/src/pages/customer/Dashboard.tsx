// src/pages/customer/Dashboard.tsx
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";

const CustomerDashboard: React.FC = () => {
  const { orders, fetchOrders, cancelOrderBackend } = useOrder();
  const { user } = useAuth();

  // Fetch orders on login and set up auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchAndRefresh = () => {
      fetchOrders();
    };

    fetchAndRefresh(); // initial fetch

    interval = setInterval(fetchAndRefresh, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleString();
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return new Date().toLocaleString();
    }
  };

  const handleCancelOrder = async (orderId: string | number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await cancelOrderBackend(orderId);
      alert("Order cancelled successfully!");
      fetchOrders(); // refresh orders immediately
    } catch (err: any) {
      console.error("CANCEL ORDER ERROR:", err);
      alert(err.message || "Failed to cancel order");
    }
  };

  // Sort orders by created_at descending (newest first)
  const sortedOrders = [...(orders ?? [])].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // newest first
  });

  // Map order id to chronological number (1 = first order ever)
  const chronologicalOrderNumbers: Record<string, number> = {};
  [...(orders ?? [])]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((order, index) => {
      const orderId = typeof order.id === "string" ? order.id : String(order.id);
      chronologicalOrderNumbers[orderId] = index + 1;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders === null ? (
        <p className="text-gray-400">Loading orders...</p>
      ) : sortedOrders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOrders.map((order) => {
            const { id, total, items, status, payment_method, created_at } = order;
            const orderId = typeof id === "string" ? id : String(id);
            const orderTotal = Number(total) || 0;
            const orderItems = items ?? [];
            const orderNumber = chronologicalOrderNumbers[orderId] ?? 0;

            return (
              <Card key={orderId}>
                <CardHeader>
                  <CardTitle>Order #{orderNumber}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p><strong>Date:</strong> {formatDate(created_at)}</p>
                  <p><strong>Status:</strong> {status ?? "Pending"}</p>
                  <p><strong>Payment Method:</strong> {payment_method ?? "—"}</p>

                  <div>
                    <p className="font-semibold">Items:</p>
                    <ul className="text-sm text-gray-600">
                      {orderItems.map((item) => {
                        const price = Number(item.price) || 0;
                        const qty = Number(item.quantity) || 0;
                        const itemId = item.product_id ?? item.id ?? Math.random().toString(36).substr(2, 6);
                        return (
                          <li key={itemId}>
                            {item.name ?? "Unnamed Item"} × {qty} — ₱{(price * qty).toFixed(2)}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <p className="font-bold text-primary">Total: ₱{orderTotal.toFixed(2)}</p>

                  {(status === "pending" || status === "unverified") && (
                    <button
                      className="text-red-500 hover:underline mt-2"
                      onClick={() => handleCancelOrder(orderId)}
                    >
                      Cancel Order
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
