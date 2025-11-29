import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import StaffLayout from "@/Layouts/StaffLayout";
import OrdersPage from "@/pages/Staff/OrderPage";
import StatusPage from "@/pages/Staff/StatusPage";
import PaymentInfoPage from "@/pages/Staff/PaymentInfoPage";
import { useStaffOrder } from "@/contexts/StaffOrderContext";

export default function StaffRoutes() {
  const staffOrder = useStaffOrder();
  const location = useLocation();
  const [unverifiedCount, setUnverifiedCount] = useState(0);

  useEffect(() => {
    if (!staffOrder) return;
    staffOrder.fetchOrders();
    const interval = setInterval(() => staffOrder.fetchOrders(), 5000);
    return () => clearInterval(interval);
  }, [staffOrder]);

  useEffect(() => {
    if (!staffOrder) return;
    const count = staffOrder.orders.filter(
      (o) => o.payment_method === "gcash" && o.paymentStatus === "unverified"
    ).length;
    setUnverifiedCount(count);
  }, [staffOrder?.orders]);

  return (
    <StaffLayout>
      <Routes location={location} key={location.pathname}>
        <Route path="orders" element={<OrdersPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="payment-info" element={<PaymentInfoPage />} />

        {/* ✅ FIX: when hitting /staff or any unknown route → go to /staff/orders */}
        <Route path="*" element={<Navigate to="orders" replace />} />
      </Routes>
    </StaffLayout>
  );
}
