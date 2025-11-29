// src/contexts/MenuContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface MenuItem {
  id: number | string;
  name: string;
  price: number;
}

interface MenuContextType {
  menuItems: MenuItem[];
  fetchMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | null>(null);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/menu`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch menu");
      const data: MenuItem[] = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error("FETCH MENU ERROR:", err);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <MenuContext.Provider value={{ menuItems, fetchMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext)!;
