import { useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { products } from '@/data/products';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Menu = () => {
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Function to check if stock is low
  const getStockAndLowStock = (productId: string) => {
    // Dummy logic for stock: you can replace this with real logic
    const stock = 10; // Hardcoded stock value, replace with your logic
    const isLowStock = stock <= 5;
    return { stock, isLowStock };
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Our Menu</h1>
          <p className="text-muted-foreground text-lg">
            Choose from our delicious selection of fried chicken, burgers, meals, and drinks!
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-5 gap-2">
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            // Get stock and low stock info dynamically
            const { stock, isLowStock } = getStockAndLowStock(product.id);

            return (
              <ProductCard
                key={product.id}
                {...product}
                stock={stock}
                isLowStock={isLowStock}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Menu;
