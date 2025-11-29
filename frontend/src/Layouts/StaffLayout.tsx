import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { useStaffOrder } from "@/contexts/StaffOrderContext";

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const staffOrder = useStaffOrder();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Redirect if not logged in
  useEffect(() => {
    if (!staffOrder) navigate("/login");
  }, [staffOrder, navigate]);

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset daily transactions at midnight (robust version)
  useEffect(() => {
    if (!staffOrder) return;

    const scheduleMidnightReset = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // next midnight
      const msUntilMidnight = midnight.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        staffOrder.resetNewOrderCount();
        staffOrder.fetchOrders(); // optional: refresh orders for the new day
        scheduleMidnightReset(); // reschedule for next midnight
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    };

    const cleanup = scheduleMidnightReset();
    return cleanup;
  }, [staffOrder]);

  // Format date & time
  const formattedDate = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex min-h-screen bg-brown-900">
      {/* Sidebar */}
      <aside className="w-64 bg-red-600 border-r border-red-500 p-5 flex flex-col justify-between shadow-lg">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>

          {/* Date & Time */}
          <div className="text-sm text-white">
            <p>{formattedDate}</p>
            <p className="font-mono mt-1">{formattedTime}</p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col space-y-3 mt-6">
            <Link
              to="/staff/orders"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/staff/orders"
                  ? "bg-white text-red-600"
                  : "text-white hover:bg-red-500"
              }`}
            >
              Order Management
            </Link>

            <Link
              to="/staff/status"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/staff/status"
                  ? "bg-white text-red-600"
                  : "text-white hover:bg-red-500"
              }`}
            >
              Status
            </Link>

            <Link
              to="/staff/payment-info"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/staff/payment-info"
                  ? "bg-white text-red-600"
                  : "text-white hover:bg-red-500"
              }`}
            >
              Customer Payment Info
            </Link>
          </nav>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={toggleTheme}
            className="flex-1 p-2 rounded-lg bg-white text-red-600 hover:bg-red-100 transition-colors"
          >
            {theme === "light" ? <Moon /> : <Sun />}
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="flex-1 p-2 rounded-lg bg-white text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto bg-brown-900 transition-colors">
        {children}
      </main>
    </div>
  );
}
