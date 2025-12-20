// src/App.tsx
import { Toaster as RadixToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { CartProvider } from "@/contexts/CartContext";
import { StaffOrderProvider } from "@/contexts/StaffOrderContext";
import { MenuProvider } from "@/contexts/MenuContext";
import { AdminProvider } from "@/contexts/AdminContext";

import { Navbar } from "@/components/Navbar";

// Customer Pages
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/customer/Dashboard";
import About from "./pages/About";
import Contacts from "./pages/Contacts";
import LoginCustomerPrompt from "./pages/LoginCostumerPrompt";
import OrderSuccess from "./pages/OrderSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Staff Routes
import StaffRoutes from "@/routes/StaffRoutes";

// Admin Pages
import Inventory from "./pages/Admin/Inventory";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// Not Found
import NotFound from "./pages/NotFound";

// ----------------------
// Protected Routes
// ----------------------
const RedirectHomeIfStaff = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "staff") return <Navigate to="/staff/orders" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const ProtectedCustomerRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login-customer" replace />;
  if (user.role !== "customer")
    return <Navigate to={user.role === "staff" ? "/staff/orders" : "/admin/dashboard"} replace />;
  return children;
};

const ProtectedStaffRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "staff") return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const ProtectedAdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/staff/orders" replace />;
  return children;
};

// ----------------------
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <TooltipProvider>
              <RadixToaster />
              <SonnerToaster />
              <BrowserRouter>
                <Navbar />
                <Routes>
                  {/* Home: redirect staff/admin */}
                  <Route
                    path="/"
                    element={
                      <RedirectHomeIfStaff>
                        <Home />
                      </RedirectHomeIfStaff>
                    }
                  />

                  {/* Customer Routes */}
                  <Route
                    path="/menu"
                    element={
                      <ProtectedCustomerRoute>
                        <Menu />
                      </ProtectedCustomerRoute>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedCustomerRoute>
                        <Cart />
                      </ProtectedCustomerRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedCustomerRoute>
                        <Checkout />
                      </ProtectedCustomerRoute>
                    }
                  />
                  <Route
                    path="/order-success/:id"
                    element={
                      <ProtectedCustomerRoute>
                        <OrderSuccess />
                      </ProtectedCustomerRoute>
                    }
                  />
                  <Route
                    path="/customer/dashboard"
                    element={
                      <ProtectedCustomerRoute>
                        <CustomerDashboard />
                      </ProtectedCustomerRoute>
                    }
                  />

                  {/* Public Pages */}
                  <Route path="/about" element={<About />} />
                  <Route path="/contacts" element={<Contacts />} />

                  {/* Login / Register */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login-customer" element={<LoginCustomerPrompt />} />

                  {/* Forgot / Reset Password */}
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Staff Routes */}
                  <Route
                    path="/staff/*"
                    element={
                      <ProtectedStaffRoute>
                        <MenuProvider>
                          <StaffOrderProvider>
                            <StaffRoutes />
                          </StaffOrderProvider>
                        </MenuProvider>
                      </ProtectedStaffRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedAdminRoute>
                        <AdminProvider>
                          <AdminDashboard />
                        </AdminProvider>
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/inventory"
                    element={
                      <ProtectedAdminRoute>
                        <AdminProvider>
                          <Inventory />
                        </AdminProvider>
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
