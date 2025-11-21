import { User, MenuItem, Order, CartItem, InventoryItem } from "./types";

// Mock data storage
const STORAGE_KEYS = {
  USER: "jfc_current_user",
  CART: "jfc_cart",
  ORDERS: "jfc_orders",
  MENU: "jfc_menu",
  INVENTORY: "jfc_inventory",
  USERS: "jfc_users",
};

// Auth functions
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.CART);
};

// Cart functions
export const getCart = (): CartItem[] => {
  const cart = localStorage.getItem(STORAGE_KEYS.CART);
  return cart ? JSON.parse(cart) : [];
};

export const setCart = (cart: CartItem[]) => {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
};

export const addToCart = (menuItem: MenuItem, quantity: number = 1) => {
  const cart = getCart();
  const existingItem = cart.find((item) => item.menuItem.id === menuItem.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id: menuItem.id, menuItem, quantity });
  }

  setCart(cart);
};

export const removeFromCart = (itemId: string) => {
  const cart = getCart().filter((item) => item.id !== itemId);
  setCart(cart);
};

export const updateCartQuantity = (itemId: string, quantity: number) => {
  const cart = getCart();
  const item = cart.find((item) => item.id === itemId);
  if (item) {
    item.quantity = quantity;
    setCart(cart);
  }
};

export const clearCart = () => {
  localStorage.removeItem(STORAGE_KEYS.CART);
};

// Order functions
export const getOrders = (): Order[] => {
  const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return orders ? JSON.parse(orders) : [];
};

export const addOrder = (order: Order) => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const updateOrderStatus = (orderId: string, status: Order["status"]) => {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }
};

// Menu functions
export const getMenu = (): MenuItem[] => {
  const menu = localStorage.getItem(STORAGE_KEYS.MENU);
  if (!menu) {
    const defaultMenu = getDefaultMenu();
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(defaultMenu));
    return defaultMenu;
  }
  return JSON.parse(menu);
};

export const updateMenuItem = (item: MenuItem) => {
  const menu = getMenu();
  const index = menu.findIndex((m) => m.id === item.id);
  if (index !== -1) {
    menu[index] = item;
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
  }
};

export const addMenuItem = (item: MenuItem) => {
  const menu = getMenu();
  menu.push(item);
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
};

export const deleteMenuItem = (itemId: string) => {
  const menu = getMenu().filter((item) => item.id !== itemId);
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
};

// Inventory functions
export const getInventory = (): InventoryItem[] => {
  const inventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
  if (!inventory) {
    const defaultInventory = getDefaultInventory();
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(defaultInventory));
    return defaultInventory;
  }
  return JSON.parse(inventory);
};

export const updateInventoryItem = (item: InventoryItem) => {
  const inventory = getInventory();
  const index = inventory.findIndex((i) => i.id === item.id);
  if (index !== -1) {
    inventory[index] = item;
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }
};

// Default data
function getDefaultMenu(): MenuItem[] {
  return [
    {
      id: "1",
      name: "Classic Fried Chicken",
      description: "Our signature crispy fried chicken with secret blend of 11 herbs and spices",
      price: 149,
      image: "/src/assets/chicken-drumstick.jpg",
      category: "Main",
      available: true,
      rating: 4.8,
      popular: true,
    },
    {
      id: "2",
      name: "Buffalo Wings",
      description: "Spicy buffalo wings with ranch dipping sauce",
      price: 199,
      image: "/src/assets/chicken-wings.jpg",
      category: "Main",
      available: true,
      rating: 4.6,
      popular: true,
    },
    {
      id: "3",
      name: "Chicken Burger",
      description: "Crispy chicken fillet with fresh lettuce, tomatoes, and special sauce",
      price: 129,
      image: "/src/assets/chicken-burger.jpg",
      category: "Main",
      available: true,
      rating: 4.7,
    },
    {
      id: "4",
      name: "Chicken Tenders",
      description: "Golden crispy chicken tenders with your choice of dipping sauce",
      price: 169,
      image: "/src/assets/chicken-tenders.jpg",
      category: "Main",
      available: true,
      rating: 4.5,
    },
  ];
}

function getDefaultInventory(): InventoryItem[] {
  return [
    { id: "1", name: "Chicken Pieces", stock: 150, lowStockThreshold: 30, unit: "pcs" },
    { id: "2", name: "Flour", stock: 50, lowStockThreshold: 10, unit: "kg" },
    { id: "3", name: "Oil", stock: 25, lowStockThreshold: 5, unit: "L" },
    { id: "4", name: "Buns", stock: 80, lowStockThreshold: 20, unit: "pcs" },
  ];
}