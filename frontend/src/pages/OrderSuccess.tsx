// src/pages/OrderSuccess.tsx
import React from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const TAX_RATE = 0.12; // 12% VAT
const DELIVERY_FEE = 50; // Example delivery fee

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const state = location.state as { order?: any } | null;
  const order = state?.order;

  // fallback items
  const items = order?.items ?? [
    { id: 1, name: "Sample Item", price: 99, quantity: 1 },
  ];

  // calculate subtotal
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + (item.price ?? 0) * (item.quantity ?? 0),
    0
  );

  // calculate tax
  const tax = subtotal * TAX_RATE;

  // delivery fee (from order if exists, otherwise default)
  const deliveryFee = order?.delivery_fee ?? DELIVERY_FEE;

  // grand total
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl shadow-lg p-8 border border-border">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="text-red-500 w-16 h-16 mb-4" />
          <h1 className="text-3xl font-semibold mb-2">Order Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your order! Your transaction was completed successfully.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="text-sm">
            <p>
              <span className="font-semibold">Order ID:</span>{" "}
              {id ?? order?.id ?? "N/A"}
            </p>
            <p>
              <span className="font-semibold">Payment Method:</span>{" "}
              {order?.payment_method ?? order?.paymentMethod ?? "Cash on Delivery"}
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2 text-lg">Items Ordered</h2>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {items.map((item: any) => (
                <li
                  key={item.id ?? item.product_id}
                  className="flex justify-between items-center p-2"
                >
                  <div>
                    <p className="font-medium">{item.name ?? "Unnamed Item"}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity ?? 1}
                    </p>
                  </div>
                  <p className="font-medium">
                    ₱{((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Price breakdown */}
          <div className="mt-4 border-t border-border pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (12%)</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₱{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center sm:justify-between gap-3">
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate("/customer/dashboard")}
          >
            View My Orders
          </Button>
          <Link
            to="/menu"
            className="w-full sm:w-auto inline-flex justify-center items-center text-primary hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
