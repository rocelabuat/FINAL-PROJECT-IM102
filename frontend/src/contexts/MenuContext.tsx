import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface MenuItem {
  id: number | string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

interface MenuContextType {
  menuItems: MenuItem[];
  fetchMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | null>(null);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Correct API root: backend uses /api/admin/menu
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/menu`, {
        headers: user?.token
          ? { Authorization: `Bearer ${user.token}` }
          : {},
      });

      if (!res.ok) throw new Error(`Failed to fetch menu (${res.status})`);

      const data: MenuItem[] = await res.json();

      setMenuItems(
        data.map(item => ({
          ...item,
          stock: item.stock ?? 0,
        }))
      );
    } catch (err) {
      console.error("FETCH MENU ERROR:", err);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [user?.token]); // refresh when login changes

  return (
    <MenuContext.Provider value={{ menuItems, fetchMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext)!;
