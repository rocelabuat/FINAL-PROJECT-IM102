import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/products';
import { AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
}

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(
    products.map(p => ({
      id: p.id,
      name: p.name,
      stock: Math.floor(Math.random() * 100) + 20,
      minStock: 20,
      price: p.price,
    }))
  );

  const updateStock = (id: string, newStock: number) => {
    setInventory(prev => prev.map(item =>
      item.id === id ? { ...item, stock: Math.max(0, newStock) } : item
    ));
    toast.success('Stock updated');
  };

  const getLowStockCount = () => inventory.filter(i => i.stock < i.minStock).length;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          {getLowStockCount() > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {getLowStockCount()} items low stock
            </Badge>
          )}
        </div>

        <div className="grid gap-4">
          {inventory.map(item => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      {item.stock < item.minStock ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 bg-success">
                          <Check className="h-3 w-3" />
                          In Stock
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Price: ₱{item.price.toFixed(2)} | Min Stock: {item.minStock}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStock(item.id, item.stock - 10)}
                    >
                      -10
                    </Button>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.stock}
                        onChange={(e) => updateStock(item.id, parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStock(item.id, item.stock + 10)}
                    >
                      +10
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
