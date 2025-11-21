// src/App.tsx
import { Toaster as RadixToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext"; // customer orders
import { CartProvider } from "@/contexts/CartContext";
import { StaffOrderProvider } from "@/contexts/StaffOrderContext"; // staff orders
import { MenuProvider } from "@/contexts/MenuContext"; // menu items

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

// Staff Pages
import StaffPOS from "./pages/Staff/dashboard";

// Admin Pages
import Inventory from "./pages/Admin/Inventory";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// Not Found
import NotFound from "./pages/NotFound";

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
                  {/* Customer Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success/:id" element={<OrderSuccess />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contacts" element={<Contacts />} />

                  {/* Guest login prompt */}
                  <Route path="/login-customer" element={<LoginCustomerPrompt />} />

                  {/* Staff Routes */}
                  <Route
                    path="/staff/dashboard"
                    element={
                      <MenuProvider>
                        <StaffOrderProvider>
                          <StaffPOS />
                        </StaffOrderProvider>
                      </MenuProvider>
                    }
                  />

                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/inventory" element={<Inventory />} />

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
