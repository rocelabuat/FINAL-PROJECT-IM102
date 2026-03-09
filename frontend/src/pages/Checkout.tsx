import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrder } from "@/contexts/OrderContext";
import { toast } from "sonner";

import GCashQR from "@/assets/qr/qr_code.jpg";
import barangays from "@/data/davaoBarangays.json";

const TAX_RATE = 0.12;

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { addOrderBackend } = useOrder();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [loading, setLoading] = useState(false);
  const [gcashRef, setGcashRef] = useState("");
  const [phone, setPhone] = useState("+63");

  const taxAmount = total * TAX_RATE;
  const totalWithFeeAndTax = total + 50 + taxAmount;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.token) return toast.error("Please log in to place an order");
    if (items.length === 0) return toast.error("Your cart is empty");
    if (paymentMethod === "gcash" && !gcashRef) return toast.error("Enter GCash reference number");

    setLoading(true);

    try {
      const fd = new FormData(e.target as HTMLFormElement);
      const orderData = {
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        phone,
        address: fd.get("address"),
        barangay: fd.get("barangay"),
        city: fd.get("city"),
        province: fd.get("province"),
        postal: fd.get("postal") || "8000",
        payment_method: paymentMethod,
        gcash_ref: paymentMethod === "gcash" ? gcashRef : null,
        subtotal: total,
        delivery_fee: 50,
        tax: taxAmount,
        total: totalWithFeeAndTax,
        items: items.map((i) => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      };

      const order = await addOrderBackend(orderData);

      toast.success("Order placed successfully!");
      clearCart();

      if (paymentMethod === "gcash") {
        if (isMobile) {
          window.location.href = `gcash://pay?receiver=YOUR_NUMBER&amount=${totalWithFeeAndTax}&ref=ORDER${order.id}`;
          toast.info("Opening GCash app. Enter reference number after payment.");
        } else {
          toast.info("Scan the QR code using your GCash app.");
        }
      }

      navigate(`/order-success/${order.id}`, {
        state: { order: { ...orderData, id: order.id } },
      });
    } catch (err: any) {
      console.error("CHECKOUT ERROR:", err);
      toast.error(err?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Juan"
                        className="border border-input focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Dela Cruz"
                        className="border border-input focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground space-x-2">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/9/99/Flag_of_the_Philippines.svg"
                        alt="Philippines Flag"
                        className="w-5 h-5 rounded-sm"
                      />
                      <span>+63</span>
                    </span>
                    <Input
                      id="phone"
                      name="phone"
                      value={phone.slice(3)}
                      onChange={(e) => setPhone("+63" + e.target.value)}
                      placeholder="9123456789"
                      required
                      className="rounded-l-none flex-1 border border-input focus:border-primary focus:ring-primary"
                    />
                  </div>

                  <Label htmlFor="address">Street / House No.</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="123 Sample St."
                    className="border border-input focus:border-primary focus:ring-primary"
                    required
                  />

                  <div className="grid sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="city">City / Municipality</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue="Davao City"
                        className="border border-input focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        name="province"
                        defaultValue="Davao del Sur"
                        className="border border-input focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="barangay">Barangay</Label>
                    <select
                      id="barangay"
                      name="barangay"
                      required
                      className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:border-primary focus:ring-primary"
                    >
                      <option value="">Select Barangay</option>
                      {barangays.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2">
                    <Label htmlFor="postal">Postal Code</Label>
                    <Input
                      id="postal"
                      name="postal"
                      defaultValue="8000"
                      className="border border-input focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <label className="flex items-center space-x-3 mb-2 cursor-pointer">
                      <RadioGroupItem value="cash" />
                      <span className="text-foreground">Cash on Delivery</span>
                    </label>
                    <label className="flex items-center space-x-3 mb-2 cursor-pointer">
                      <RadioGroupItem value="gcash" />
                      <span className="text-foreground">GCash</span>
                    </label>
                  </RadioGroup>

                  {paymentMethod === "gcash" && (
                    <div className="mt-4 flex flex-col items-center space-y-4">
                      <img
                        src={GCashQR}
                        alt="GCash QR"
                        className="w-48 h-48 rounded-md object-contain"
                      />

                      <Label htmlFor="gcashRef">Enter Reference Number</Label>
                      <Input
                        id="gcashRef"
                        value={gcashRef}
                        onChange={(e) => setGcashRef(e.target.value)}
                        placeholder="Ex: 5X3D18K"
                        className="border border-input focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between"><span>Subtotal</span><span>₱{total.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>₱50.00</span></div>
                  <div className="flex justify-between"><span>Tax (12%)</span><span>₱{taxAmount.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₱{totalWithFeeAndTax.toFixed(2)}</span>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading ? "Processing..." : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
