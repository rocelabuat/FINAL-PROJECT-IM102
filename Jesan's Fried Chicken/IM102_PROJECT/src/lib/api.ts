// src/lib/api.ts
import axios from "axios";

// Base URL for backend
const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    (config.headers as any)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ===== Types =====
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  rating?: number;
  popular?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  postal: string;
  gps_lat?: number;
  gps_lng?: number;
  payment_method: string;
  gcash_ref?: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  items: OrderItem[];
  created_at: string;
  status: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "staff" | "admin";
  last_login?: string;
  last_logout?: string;
  created_at?: string;
}

// ===== Menu API (Admin/Staff) =====
export const fetchMenu = async (): Promise<Product[]> => {
  const response = await api.get<Product[]>("/menu");
  return response.data;
};

export const addMenuItem = async (item: Omit<Product, "id">): Promise<Product> => {
  const response = await api.post<Product>("/menu", item);
  return response.data;
};

export const updateMenuItem = async (id: string, item: Partial<Product>) => {
  await api.put(`/menu/${id}`, item);
};

export const deleteMenuItem = async (id: string) => {
  await api.delete(`/menu/${id}`);
};

// ===== Orders API (Admin/Staff) =====
export const fetchOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>("/orders");
  return response.data;
};

export const verifyPayment = async (orderId: string, status: string) => {
  const response = await api.post("/orders/verify", { orderId, status });
  return response.data;
};

// ===== User API (Admin only) =====
export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users");
  return response.data;
};

export const updateUserRole = async (userId: string, role: User["role"]) => {
  const response = await api.put(`/users/${userId}/role`, { role });
  return response.data;
};

export default api;
