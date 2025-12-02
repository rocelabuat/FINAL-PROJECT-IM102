// src/pages/Staff/StaffOrdersPage.tsx
import { useEffect, useState, useRef } from "react";
import { useStaffOrder, Order, OrderStatus } from "@/contexts/StaffOrderContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import notificationSoundFile from "@/assets/sounds/notifications.mp3";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function StaffOrdersPage() {
  const { orders, fetchOrders, markOrderNotified, verifyPayment } = useStaffOrder();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Audio
  const notificationSound = useRef(new Audio(notificationSoundFile)).current;
  const prevUnnotifiedIds = useRef<Set<string | number>>(new Set());
  const [canPlaySound, setCanPlaySound] = useState(false);

  const ALL_STATUSES: OrderStatus[] = ["pending","preparing","ready","delivered","paid","cancelled","unverified"];

  // Enable sound after first user interaction
  useEffect(() => {
    const enableSound = () => setCanPlaySound(true);
    window.addEventListener("click", enableSound, { once: true });
    return () => window.removeEventListener("click", enableSound);
  }, []);

  // Poll orders every 1 second
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 1000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Play sound for new unnotified orders
  useEffect(() => {
    const newOrders = orders.filter(
      o => !o.notified && o.status !== "cancelled" && !prevUnnotifiedIds.current.has(o.id)
    );

    if (newOrders.length > 0 && canPlaySound) {
      notificationSound.play().catch(() => console.log("Sound blocked"));

      newOrders.forEach(async (order) => {
        try {
          await markOrderNotified(order.id);
          prevUnnotifiedIds.current.add(order.id);
        } catch (err) {
          console.error("Failed to mark notified:", err);
        }
      });
    }
  }, [orders, canPlaySound, markOrderNotified, notificationSound]);

  // ✅ Reset notifications at midnight
  useEffect(() => {
    const resetAtMidnight = () => {
      const now = new Date();
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

      const timeout = setTimeout(() => {
        prevUnnotifiedIds.current.clear();
        resetAtMidnight();
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    };

    const cleanup = resetAtMidnight();
    return cleanup;
  }, []);

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleVerifyPayment = async (order: Order) => {
    if (verifying) return;
    setVerifying(true);
    try {
      if (order.status === "cancelled") throw new Error("Cannot verify payment. This order has been cancelled.");

      let amount_received: number | undefined;
      if (["cash", "cod"].includes(order.payment_method.toLowerCase())) {
        amount_received = order.total;
      }

      await verifyPayment(order.id, amount_received);
      setDialogOpen(false);
      toast.success("Payment verified successfully!");
    } catch (err: any) {
      toast.error(err.message || "Verify payment failed");
    } finally {
      setVerifying(false);
    }
  };

  const onlineOrders = orders.filter(o =>
    ["gcash", "cod", "cash"].includes(o.payment_method.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 bg-background">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Online Orders</h1>

        {/* Bell indicator */}
        <div className="relative">
          <Button variant="outline">
            🔔
            {onlineOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {onlineOrders.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ORDER CARDS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {onlineOrders.length === 0 ? (
          <p className="text-center col-span-full py-10 text-muted-foreground">
            No online orders yet
          </p>
        ) : (
          onlineOrders.map(order => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-lg"
              onClick={() => handleOpenOrder(order)}
            >
              <CardHeader>
                <CardTitle>#{String(order.id).slice(0, 6)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">{order.firstName} {order.lastName}</p>
                <p className="text-sm">Payment: {order.payment_method}</p>
                <p className="text-sm">Status: {order.status}</p>
                <p className="text-sm font-bold">Total: ₱{order.total.toFixed(2)}</p>
                <p className="text-sm">Payment Status: {order.paymentStatus}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-2 mt-2">
              {/* ✅ ORDER DATE ADDED ONLY HERE */}
              <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>

              <p><strong>Customer:</strong> {selectedOrder.firstName} {selectedOrder.lastName}</p>
              <p><strong>Phone:</strong> {selectedOrder.phone}</p>
              <p><strong>Address:</strong> {selectedOrder.address}, {selectedOrder.barangay}, {selectedOrder.city}, {selectedOrder.province}, {selectedOrder.province}, {selectedOrder.postal}</p>
              <p><strong>Payment:</strong> {selectedOrder.payment_method}</p>
              {selectedOrder.gcash_ref && <p><strong>GCash Ref:</strong> {selectedOrder.gcash_ref}</p>}
              <p><strong>Status:</strong> {selectedOrder.status}</p>

              <div>
                <strong>Items:</strong>
                <ul className="list-disc list-inside text-sm">
                  {selectedOrder.items.map(item => (
                    <li key={item.product_id}>
                      {item.quantity} x {item.name} - ₱{(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-2">
                <Separator />
                <p><strong>Subtotal:</strong> ₱{selectedOrder.subtotal.toFixed(2)}</p>
                <p><strong>Delivery Fee:</strong> ₱{selectedOrder.delivery_fee.toFixed(2)}</p>
                <p><strong>Tax:</strong> ₱{selectedOrder.tax.toFixed(2)}</p>
                <p className="font-bold"><strong>Total:</strong> ₱{selectedOrder.total.toFixed(2)}</p>
                <Separator />
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_STATUSES.map(status => (
                  <span
                    key={status}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedOrder.status === status || selectedOrder.paymentStatus === status
                        ? "bg-green-200 text-green-900"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                ))}
              </div>

              {selectedOrder.status === "cancelled" && (
                <p className="text-sm text-red-500">
                  This order was cancelled. Payment cannot be verified.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
            {selectedOrder && selectedOrder.paymentStatus !== "paid" && selectedOrder.status !== "cancelled" && (
              <Button onClick={() => handleVerifyPayment(selectedOrder)} disabled={verifying}>
                {verifying ? "Verifying..." : "Verify Payment"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}