import drumstickImg from '@/assets/products/drumstick.jpg';
import wingsImg from '@/assets/products/wings.jpg';
import bucketImg from '@/assets/products/bucket.jpg';
import burgerImg from '@/assets/products/burger.jpg';

// Drinks
import cocaColaImg from '@/assets/products/Coca-cola.jpg';
import pepsiImg from '@/assets/products/Pepsi.jpg';
import spriteImg from '@/assets/products/Sprite.jpg';
import sevenUpImg from '@/assets/products/7up.jpg';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export const products: Product[] = [
  // ----------------- FOOD ITEMS -----------------
  {
    id: '1',
    name: 'Crispy Drumstick',
    description: 'Perfectly seasoned and fried to golden perfection',
    price: 45,
    image: drumstickImg,
    category: 'Chicken',
  },
  {
    id: '2',
    name: 'Chicken Wings (6pc)',
    description: 'Crispy wings with your choice of sauce',
    price: 120,
    image: wingsImg,
    category: 'Chicken',
  },
  {
    id: '3',
    name: 'Family Bucket',
    description: '12 pieces of mixed chicken parts - perfect for sharing',
    price: 499,
    image: bucketImg,
    category: 'Meals',
  },
  {
    id: '4',
    name: 'Chicken Burger',
    description: 'Crispy chicken fillet with fresh lettuce and special sauce',
    price: 89,
    image: burgerImg,
    category: 'Burgers',
  },
  {
    id: '5',
    name: 'Spicy Drumstick',
    description: 'Extra spicy coating for heat lovers',
    price: 50,
    image: drumstickImg,
    category: 'Chicken',
  },
  {
    id: '6',
    name: 'Buffalo Wings (6pc)',
    description: 'Tossed in tangy buffalo sauce',
    price: 135,
    image: wingsImg,
    category: 'Chicken',
  },
  {
    id: '7',
    name: 'Mega Bucket',
    description: '20 pieces of mixed chicken - party size!',
    price: 799,
    image: bucketImg,
    category: 'Meals',
  },
  {
    id: '8',
    name: 'Deluxe Burger',
    description: 'Double chicken fillet with cheese and bacon',
    price: 149,
    image: burgerImg,
    category: 'Burgers',
  },

  // ----------------- DRINKS -----------------
  {
    id: '9',
    name: 'Coca-Cola (1 Bottle)',
    description: 'Classic refreshing cola',
    price: 25,
    image: cocaColaImg,
    category: 'Drinks',
  },
  {
    id: '10',
    name: 'Pepsi (1 Bottle)',
    description: 'Bold and refreshing Pepsi flavor',
    price: 25,
    image: pepsiImg,
    category: 'Drinks',
  },
  {
    id: '11',
    name: 'Sprite (1 Bottle)',
    description: 'Lemon-lime soda, crisp and clean',
    price: 25,
    image: spriteImg,
    category: 'Drinks',
  },
  {
    id: '12',
    name: '7up (1 Bottle)',
    description: 'Refreshing lemon-lime soda',
    price: 25,
    image: sevenUpImg,
    category: 'Drinks',
  },
];
