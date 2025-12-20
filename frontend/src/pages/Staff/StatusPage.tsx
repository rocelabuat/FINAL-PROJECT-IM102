// src/pages/Staff/StatusPage.tsx

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useStaffOrder } from "@/contexts/StaffOrderContext";
import type { Order, OrderStatus } from "@/contexts/StaffOrderContext";

export default function StatusPage() {
  const { orders, updateOrderStatus, verifyPayment } = useStaffOrder();
  const [updatingIds, setUpdatingIds] = useState<Set<string | number>>(new Set());

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-200 text-yellow-900",
    preparing: "bg-blue-200 text-blue-900",
    ready: "bg-green-200 text-green-900",
    delivered: "bg-gray-200 text-gray-800",
  };

  const statusFlow: Record<OrderStatus, OrderStatus | null> = {
    pending: "preparing",
    preparing: "ready",
    ready: "delivered",
    delivered: null,
    paid: "pending",
    cancelled: null,
    unverified: "pending",
  };

  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    if (updatingIds.has(order.id)) return;
    setUpdatingIds(prev => new Set(prev).add(order.id));

    try {
      /* ----------------------------------------------
         AUTO-VERIFY PAYMENT FOR GCASH USERS
      ---------------------------------------------- */
      if (order.payment_method === "gcash" && order.paymentStatus !== "paid") {
        const paymentResult = await verifyPayment(order.id);

        toast.success(
          `Payment verified for order #${String(order.id).slice(0, 6)}`
        );

        // If verify-payment returned inventory warnings
        if (Array.isArray(paymentResult?.inventory)) {
          paymentResult.inventory.forEach((item: any) => {
            if (item.low_stock) {
              toast.warning(
                `⚠ LOW STOCK: ${item.name} (Remaining: ${item.stock})`
              );
            }
          });
        }
      }

      /* ----------------------------------------------
         UPDATE STATUS
      ---------------------------------------------- */
      const response = await updateOrderStatus(order.id, newStatus);

      toast.success(
        `Order #${String(order.id).slice(0, 6)} marked as ${newStatus}`
      );

      /* ----------------------------------------------
         SHOW LOW STOCK WARNING IF DELIVERED
      ---------------------------------------------- */
      if (newStatus === "delivered" && Array.isArray(response?.inventory)) {
        response.inventory.forEach((item: any) => {
          if (item.low_stock) {
            toast.warning(
              `⚠ LOW STOCK: ${item.name} (Remaining: ${item.stock})`
            );
          }
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {["pending", "preparing", "ready", "delivered"].map((status) => {
        const statusOrders = orders.filter(o => o.status === status);

        return (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="flex justify-between capitalize">
                {status}
                <Badge className={statusColors[status]}>
                  {statusOrders.length}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {statusOrders.length === 0 ? (
                <p className="text-center text-sm">No orders</p>
              ) : (
                statusOrders.map(order => (
                  <div key={order.id} className="p-2 border rounded space-y-1">
                    <p className="font-semibold">#{String(order.id).slice(0, 6)}</p>
                    <p>{order.firstName} {order.lastName}</p>
                    <p>₱{order.total.toFixed(2)}</p>

                    <p className="text-xs text-muted-foreground">
                      Payment: {order.payment_method.toUpperCase()} ({order.paymentStatus})
                    </p>

                    {order.items?.length > 0 && (
                      <div className="text-sm mt-1">
                        <p className="font-semibold">Ordered Items:</p>
                        <ul className="list-disc list-inside">
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              {item.name} ×{item.quantity || 1}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {statusFlow[status as OrderStatus] && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(order, statusFlow[status as OrderStatus]!)
                        }
                        disabled={updatingIds.has(order.id)}
                        className="mt-2"
                      >
                        {updatingIds.has(order.id)
                          ? "Processing..."
                          : `Mark as ${statusFlow[status as OrderStatus]}`}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
