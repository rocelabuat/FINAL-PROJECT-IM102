// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // in real app, hashed
  role: 'customer' | 'staff' | 'admin';
}

// Mock users
export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: 'Rocela Buat',
    email: 'rocela@example.com',
    password: '123456',
    role: 'customer',
  },
  {
    id: 'user-002',
    name: 'Grace Samson',
    email: 'grace@example.com',
    password: '123456',
    role: 'customer',
  },
  {
    id: 'user-003',
    name: 'Eric Lopez',
    email: 'eric@example.com',
    password: '123456',
    role: 'customer',
  },
  {
    id: 'staff-001',
    name: 'John Staff',
    email: 'john.staff@example.com',
    password: '123456',
    role: 'staff',
  },
  {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
  },
];

// Now mockOrders should use userId from these users
export interface Order {
  id: string;
  userId: string; // link to user
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  orderType: 'online' | 'walk-in';
  createdAt: Date;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    userId: 'user-001',
    customerName: 'Rocela Buat',
    items: [
      { name: 'Crispy Drumstick', quantity: 2, price: 45 },
      { name: 'Chicken Wings (6pc)', quantity: 1, price: 120 },
    ],
    total: 210,
    status: 'preparing',
    orderType: 'online',
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  },
  {
    id: 'ORD-002',
    userId: 'user-002',
    customerName: 'Grace Samson',
    items: [{ name: 'Family Bucket', quantity: 1, price: 499 }],
    total: 499,
    status: 'ready',
    orderType: 'walk-in',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: 'ORD-003',
    userId: 'user-003',
    customerName: 'Eric Lopez',
    items: [
      { name: 'Chicken Burger', quantity: 3, price: 89 },
      { name: 'Buffalo Wings (6pc)', quantity: 1, price: 135 },
    ],
    total: 402,
    status: 'pending',
    orderType: 'online',
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
  },
];
