// src/pages/Staff/PaymentInfoPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useStaffOrder, Order } from "@/contexts/StaffOrderContext";
import { toast } from "sonner";

export default function PaymentInfoPage() {
  const { orders, verifyPayment } = useStaffOrder();
  const [verifyingIds, setVerifyingIds] = useState<Set<string | number>>(new Set());

  // Only cash and GCash orders
  const relevantOrders = orders.filter(o => o.payment_method === "cash" || o.payment_method === "gcash");

  const handleVerify = async (order: Order) => {
    if (verifyingIds.has(order.id)) return;

    setVerifyingIds(prev => new Set(prev).add(order.id));
    try {
      const amount_received = order.payment_method === "cash" ? order.total : undefined;
      await verifyPayment(order.id, amount_received);
      toast.success(`Payment for order #${String(order.id).slice(0,6)} verified successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to verify payment");
    } finally {
      setVerifyingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  if (orders.length === 0) return <p className="text-center mt-4">Loading orders...</p>;

  return (
    <div className="space-y-4">
      {relevantOrders.length === 0 ? (
        <p className="text-center mt-4">No cash or GCash orders to verify</p>
      ) : (
        relevantOrders.map(order => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>Order #{String(order.id).slice(0,6)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Customer:</strong> {order.firstName} {order.lastName}</p>
              <p><strong>Payment Method:</strong> {order.payment_method.toUpperCase()}</p>
              <p><strong>Total:</strong> ₱{order.total.toFixed(2)}</p>
              <p><strong>Payment Status:</strong> {order.paymentStatus}</p> {/* <-- Added here */}
              
              {order.payment_method === "gcash" && (
                <p><strong>GCash Ref:</strong> {order.gcash_ref || "Pending"}</p>
              )}

              {/* Only show verify button for unverified payments */}
              {order.paymentStatus === "unverified" && (
                <Button
                  size="sm"
                  onClick={() => handleVerify(order)}
                  disabled={verifyingIds.has(order.id)}
                  className="mt-2"
                >
                  {verifyingIds.has(order.id) ? "Verifying..." : "Verify Payment"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
