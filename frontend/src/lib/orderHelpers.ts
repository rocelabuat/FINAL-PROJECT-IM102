// lib/orderHelpers.ts
import { CartItem, Order, OrderStatus } from "./types";

export const getCart = (): CartItem[] => JSON.parse(localStorage.getItem("cart") || "[]");
export const setCart = (cart: CartItem[]) => localStorage.setItem("cart", JSON.stringify(cart));

export const getOrders = (): Order[] => JSON.parse(localStorage.getItem("orders") || "[]");
export const addOrder = (order: Order) => localStorage.setItem("orders", JSON.stringify([...getOrders(), order]));

export const updateOrderStatus = (orderId: string, status: OrderStatus) => {
  const orders = getOrders().map(o =>
    o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
  );
  localStorage.setItem("orders", JSON.stringify(orders));
};

export const updateOrderPayment = (orderId: string) => {
  const orders = getOrders().map(o =>
    o.id === orderId
      ? { ...o, paymentStatus: "paid", status: "paid", updatedAt: new Date().toISOString() }
      : o
  );
  localStorage.setItem("orders", JSON.stringify(orders));
  return orders;
};
