import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";

/* ===========================
   TYPES
=========================== */

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  available: number;
  popular: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  threshold: number;
  low_stock: boolean;
}

export interface LowStockAlert {
  id: number;
  inventory_id: number;
  name: string;
  stock: number;
  threshold: number;
  alerted_at: string;
}

export interface DashboardTotals {
  todayRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalMenuItems: number;
  bestSelling: { name: string; sold: number } | null;
}

interface AdminContextType {
  totals: DashboardTotals;
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  alerts: LowStockAlert[];
  lowStockCount: number;

  fetchTotals: () => Promise<void>;
  fetchMenu: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchLowStockAlerts: () => Promise<void>;
  addStock: (id: number, quantity: number) => Promise<void>;  // Add the addStock function type
}

/* ===========================
   CONTEXT
=========================== */

const AdminContext = createContext<AdminContextType | undefined>(undefined);

/* ===========================
   PROVIDER
=========================== */

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  axios.defaults.baseURL = "http://localhost:5000";

  const [totals, setTotals] = useState<DashboardTotals>({
    todayRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalMenuItems: 0,
    bestSelling: null,
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);

  /* ===========================
     FETCH FUNCTIONS
  ============================ */

  const fetchTotals = async () => {
    try {
      const res = await axios.get("/api/admin/dashboard-totals");
      setTotals({
        todayRevenue: Number(res.data.todayRevenue || 0),
        totalOrders: Number(res.data.totalOrders || 0),
        avgOrderValue: Number(res.data.avgOrderValue || 0),
        totalMenuItems: Number(res.data.totalMenuItems || 0),
        bestSelling: res.data.bestSelling || null,
      });
    } catch (err) {
      console.error("Error fetching dashboard totals:", err);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get("/api/admin/menu");
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get("/api/admin/inventory");
      setInventory(
        res.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          stock: Number(item.stock),
          threshold: Number(item.threshold),
          low_stock: Boolean(item.low_stock),
        }))
      );
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const res = await axios.get("/api/admin/low-stock-alerts-admin");
      setAlerts(res.data);
    } catch (err) {
      console.error("Error fetching low stock alerts:", err);
    }
  };

  /* ===========================
     ADD STOCK FUNCTION
  ============================ */

  const addStock = async (id: number, quantity: number) => {
    try {
      const response = await axios.post(`/api/inventory/${id}/add-stock`, { quantity });

      if (response.status === 200) {
        const { updatedStock, lowStockAlert, itemName } = response.data;

        // Update the inventory in the context with the new stock and low-stock alert status
        setInventory(prevInventory =>
          prevInventory.map(item =>
            item.id === id
              ? { ...item, stock: updatedStock, low_stock: lowStockAlert }
              : item
          )
        );

        alert(`${itemName} stock updated successfully.`);
      }
    } catch (err) {
      console.error("Failed to add stock:", err);
      alert("Failed to add stock. Please try again.");
    }
  };

  /* ===========================
     REAL LOW STOCK COUNT
  ============================ */
  const lowStockCount = inventory.filter((i) => i.low_stock).length;

  /* ===========================
     INITIAL LOAD + AUTO REFRESH
  ============================ */

  useEffect(() => {
    fetchTotals();
    fetchMenu();
    fetchInventory();
    fetchLowStockAlerts();

    const interval = setInterval(() => {
      fetchTotals();
      fetchInventory();
      fetchLowStockAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        totals,
        menuItems,
        inventory,
        alerts,
        lowStockCount,
        fetchTotals,
        fetchMenu,
        fetchInventory,
        fetchLowStockAlerts,
        addStock,  // Expose addStock in the context
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

/* ===========================
   HOOK
=========================== */

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};
