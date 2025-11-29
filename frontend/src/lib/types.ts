// src/lib/types.ts

// ===== User =====
export type UserRole = "customer" | "staff" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ===== Menu =====
export interface MenuItem {
  id: number | string;   // previously string
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  rating?: number;
  popular?: boolean;
}

// ===== Cart =====
export interface CartItem {
  id: number | string;
  menuItem: MenuItem;
  quantity: number;
}

// ===== Orders =====
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled" | "paid";
export type PaymentMethod = "cash" | "card" | "gcash" | "maya";
export type PaymentStatus = "pending" | "paid";

export interface Order {
  id: number | string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Inventory =====
export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  unit: string;
}
