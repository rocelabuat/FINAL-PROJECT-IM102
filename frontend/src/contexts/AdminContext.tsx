// src/contexts/AdminContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

// -------------------------
// TYPES
// -------------------------
interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  available: number;
  popular: number;
}

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
}

// ✅ UPDATED DASHBOARD TOTALS
interface DashboardTotals {
  todayRevenue: number; // replaces totalSales
  totalOrders: number;
  pendingOrders: number;
  totalMenuItems: number;
  bestSelling: { name: string; sold: number } | null;
}

interface AdminContextType {
  totals: DashboardTotals;
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  fetchTotals: () => void;
  fetchMenu: () => void;
  fetchInventory: () => void;
}

// -------------------------
// CONTEXT
// -------------------------
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// -------------------------
// PROVIDER
// -------------------------
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [totals, setTotals] = useState<DashboardTotals>({
    todayRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalMenuItems: 0,
    bestSelling: null,
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  axios.defaults.baseURL = 'http://localhost:5000';

  // -------------------------
  // FETCH FUNCTIONS
  // -------------------------
  const fetchTotals = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard-totals');
      // ✅ fallback if backend doesn't send fields yet
      setTotals({
        todayRevenue: res.data.todayRevenue ?? 0,
        totalOrders: res.data.totalOrders ?? 0,
        pendingOrders: res.data.pendingOrders ?? 0,
        totalMenuItems: res.data.totalMenuItems ?? 0,
        bestSelling: res.data.bestSelling ?? null,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get('/api/admin/menu');
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/admin/inventory');
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------
  // INITIAL LOAD
  // -------------------------
  useEffect(() => {
    fetchTotals();
    fetchMenu();
    fetchInventory();
  }, []);

  // -------------------------
  // PROVIDER VALUE
  // -------------------------
  return (
    <AdminContext.Provider
      value={{ totals, menuItems, inventory, fetchTotals, fetchMenu, fetchInventory }}
    >
      {children}
    </AdminContext.Provider>
  );
};

// -------------------------
// CUSTOM HOOK
// -------------------------
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};
