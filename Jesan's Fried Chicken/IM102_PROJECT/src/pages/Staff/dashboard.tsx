// src/pages/Staff/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, Receipt, LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { useStaffOrder, CartItem, OrderStatus } from "@/contexts/StaffOrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMenu } from "@/contexts/MenuContext";

export default function StaffPOS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const staffOrder = useStaffOrder();
  const { menuItems, fetchMenu } = useMenu();

  if (!staffOrder) return <p>Loading...</p>;
  const { orders, fetchOrders, addWalkInOrder, updateOrderStatus, verifyPayment } = staffOrder;

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountReceived, setAmountReceived] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash" | "card" | "maya">("cash");
  const [gcashRef, setGcashRef] = useState<string>("");

  useEffect(() => {
    if (!user) return navigate("/login");
    if (user.role !== "staff" && user.role !== "admin") return navigate("/login");

    fetchOrders();
    fetchMenu();
  }, [user]);

  // ===== Polling for unverified online orders =====
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ===== Notification bar =====
  const unverifiedOnlineOrders = orders.filter(
    o => o.payment_method === "gcash" && o.paymentStatus === "unverified"
  );

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const change = typeof amountReceived === "number" ? amountReceived - subtotal : 0;

  // ===== Cart / Checkout =====
  const handleCheckout = async () => {
    if (!cart.length) return toast.error("Cart is empty");

    if (paymentMethod === "cash" && (amountReceived === "" || Number(amountReceived) < subtotal)) {
      return toast.error("Please enter a valid amount received");
    }

    if (paymentMethod === "gcash" && !gcashRef) {
      return toast.error("Please enter GCash reference number");
    }

    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));

      const orderPayload = {
        firstName: "Walk-in",
        lastName: "Customer",
        items,
        total: subtotal,
        payment_method: paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "paid" : "unverified",
        status: paymentMethod === "cash" ? "paid" : "unverified",
        referenceNumber: paymentMethod === "gcash" ? gcashRef : undefined,
        amount_received: paymentMethod === "cash" ? Number(amountReceived) : undefined,
      };

      await addWalkInOrder(orderPayload);
      setCart([]);
      setAmountReceived("");
      setGcashRef("");
      await fetchOrders();
      toast.success("Order placed successfully");
    } catch (err: any) {
      console.error("CHECKOUT ERROR:", err);
      toast.error(err.message || "Failed to place order");
    }
  };

  const handleAddToCart = (item: any) => {
    if (!item?.id || !item?.name || !item?.price) {
      toast.error("Invalid item, cannot add to cart");
      return;
    }
    const existing = cart.find(c => c.product_id === item.id);
    const newCart = existing
      ? cart.map(c => c.product_id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      : [...cart, { product_id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    setCart(newCart);
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity < 1) return;
    setCart(cart.map(c => c.product_id === id ? { ...c, quantity } : c));
  };

  const removeItem = (id: number | string) => {
    setCart(cart.filter(c => c.product_id !== id));
    toast.success("Item removed");
  };

  // ===== Order management =====
  const handleUpdateOrderStatus = async (orderId: string | number, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      toast.success(`Order status updated to ${nextStatus}`);
    } catch (err: any) {
      console.error("UPDATE STATUS ERROR:", err);
      toast.error(err.message || "Failed to update order status");
    }
  };

  const handleVerifyPayment = async (orderId: string | number) => {
    try {
      await verifyPayment(orderId);
      toast.success("Payment verified successfully");
      await fetchOrders();
    } catch (err: any) {
      console.error("VERIFY PAYMENT ERROR:", err);
      toast.error(err.message || "Failed to verify payment");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const statusConfig: Record<string, { color: string; next?: OrderStatus }> = {
    pending: { color: "bg-yellow-200 text-yellow-800", next: "preparing" },
    preparing: { color: "bg-blue-200 text-blue-800", next: "ready" },
    ready: { color: "bg-green-200 text-green-800", next: "delivered" },
    delivered: { color: "bg-gray-200 text-gray-800" },
    paid: { color: "bg-green-300 text-green-900" },
    cancelled: { color: "bg-red-200 text-red-800" },
    unverified: { color: "bg-purple-200 text-purple-800" },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Top bar */}
        <div className="flex justify-end mb-4 gap-2">
          <Button size="icon" onClick={toggleTheme}>{theme === "light" ? <Moon /> : <Sun />}</Button>
          <Button size="icon" variant="ghost" onClick={() => { localStorage.removeItem("user"); navigate("/login"); }}><LogOut /></Button>
        </div>

        {/* ===== Notification bar ===== */}
        {unverifiedOnlineOrders.length > 0 && (
          <div className="bg-purple-200 text-purple-800 p-2 rounded mb-4 text-center">
            There are {unverifiedOnlineOrders.length} online order(s) awaiting payment verification.
          </div>
        )}

        <Tabs defaultValue="pos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pos">POS / Cashier</TabsTrigger>
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="payment-info">Customer Payment Info</TabsTrigger>
          </TabsList>

          {/* ===== POS Tab ===== */}
          <TabsContent value="pos">
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Menu */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader><CardTitle>Menu</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {menuItems.length === 0 ? <p className="text-center py-4">No products available</p>
                        : menuItems.map((item) => (
                          <Card key={item.id} className="cursor-pointer hover:shadow-lg" onClick={() => handleAddToCart(item)}>
                            <CardContent className="p-3">
                              <h3 className="font-semibold text-sm">{item.name}</h3>
                              <p className="text-primary font-bold">₱{item.price}</p>
                            </CardContent>
                          </Card>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart */}
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Current Order</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {cart.length === 0 ? <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                      : cart.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between gap-2">
                          <span className="text-sm flex-1">{item.name}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-sm w-8 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.product_id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <span className="text-sm font-semibold w-16 text-right">₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-primary">Total: ₱{subtotal.toFixed(2)}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["cash", "card", "gcash", "maya"] as const).map((method) => (
                        <Button key={method} variant={paymentMethod === method ? "default" : "outline"} size="sm" className="capitalize" onClick={() => setPaymentMethod(method)}>{method}</Button>
                      ))}
                    </div>

                    {paymentMethod === "cash" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Amount Received</label>
                          <Input type="number" placeholder="0.00" value={amountReceived} onChange={e => setAmountReceived(Number(e.target.value))} />
                        </div>
                        {amountReceived !== "" && <div className="text-lg font-semibold">Change: <span className={change < 0 ? "text-red-600" : "text-green-600"}>₱{change.toFixed(2)}</span></div>}
                      </>
                    )}

                    {paymentMethod === "gcash" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">GCash Reference Number</label>
                        <Input type="text" placeholder="Enter reference number" value={gcashRef} onChange={e => setGcashRef(e.target.value)} />
                      </div>
                    )}

                    <Button variant="default" className="w-full" onClick={handleCheckout}><Receipt className="mr-2 h-4 w-4" /> Complete Order</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===== Orders Tab ===== */}
          <TabsContent value="orders">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["pending", "preparing", "ready", "delivered"].map((status) => {
                const statusOrders = orders.filter(o => o.status === status);
                return (
                  <Card key={status}>
                    <CardHeader>
                      <CardTitle className="capitalize flex items-center justify-between">
                        {status}
                        <Badge className={statusConfig[status].color}>{statusOrders.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {statusOrders.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">No orders</p>
                      ) : (
                        statusOrders.map((order) => (
                          <Card key={order.id} className="p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">#{String(order.id).slice(0, 6)}</p>
                                <p className="text-xs text-muted-foreground">{order.firstName} {order.lastName}</p>
                                {order.payment_method === "gcash" && order.referenceNumber && (
                                  <p className="text-xs text-muted-foreground">Ref: {order.referenceNumber}</p>
                                )}
                              </div>
                              <p className="text-sm font-bold text-primary">₱{order.total}</p>
                            </div>

                            <div className="text-xs space-y-1">
                              {(order.items || []).map(item => (
                                <div key={item.product_id}>{item.quantity}x {item.name}</div>
                              ))}
                            </div>

                            {statusConfig[status].next && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => handleUpdateOrderStatus(order.id, statusConfig[status].next!)}
                              >
                                Mark as {statusConfig[status].next}
                              </Button>
                            )}

                            {order.paymentStatus === "unverified" && order.payment_method === "gcash" && (
                              <Button size="sm" variant="default" className="w-full mt-1" onClick={() => handleVerifyPayment(order.id)}>Verify Payment</Button>
                            )}
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ===== Status Tab ===== */}
          <TabsContent value="status">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["paid", "cancelled", "unverified"].map((status) => {
                const statusOrders = orders.filter(o => o.status === status || o.paymentStatus === status);
                return (
                  <Card key={status}>
                    <CardHeader>
                      <CardTitle className="capitalize flex items-center justify-between">
                        {status}
                        <Badge className={statusConfig[status].color}>{statusOrders.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statusOrders.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">No orders</p>
                      ) : (
                        statusOrders.map((order) => (
                          <div key={order.id} className="p-3 border rounded space-y-1">
                            <p className="font-semibold text-sm">#{String(order.id).slice(0, 6)}</p>
                            <p className="text-xs">{order.firstName} {order.lastName}</p>
                            <p className="text-sm font-bold text-primary">₱{order.total}</p>
                            <div className="text-xs space-y-1">
                              {(order.items || []).map(item => <div key={item.product_id}>{item.quantity}x {item.name}</div>)}
                            </div>

                            {order.paymentStatus === "unverified" && order.payment_method === "gcash" && (
                              <Button size="sm" variant="default" className="w-full mt-1" onClick={() => handleVerifyPayment(order.id)}>Verify Payment</Button>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ===== Customer Payment Info Tab ===== */}
          <TabsContent value="payment-info">
            <div className="space-y-4">
              {orders.filter(o => o.payment_method === "gcash").map(order => (
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle>Order #{String(order.id).slice(0, 6)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Customer: {order.firstName} {order.lastName}</p>
                    <p className="text-sm">Total: ₱{order.total}</p>
                    <p className="text-sm">Reference Number: {order.referenceNumber || "Pending"}</p>
                    <p className="text-sm">Payment Status: {order.paymentStatus}</p>
                    <div className="text-xs space-y-1">
                      {(order.items || []).map(item => <div key={item.product_id}>{item.quantity}x {item.name}</div>)}
                    </div>

                    {order.paymentStatus === "unverified" && (
                      <Button size="sm" variant="default" className="w-full mt-1" onClick={() => handleVerifyPayment(order.id)}>Verify Payment</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
