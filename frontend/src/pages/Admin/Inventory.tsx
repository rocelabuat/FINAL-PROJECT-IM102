import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number; // corresponds to low_stock_threshold in DB
  unit: string;
}

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Fetch inventory from backend
  // -------------------------
  const fetchInventory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/inventory");
      // Map DB fields to frontend state
      const data = res.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        stock: item.stock,
        minStock: item.low_stock_threshold,
        unit: item.unit
      }));
      setInventory(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch inventory");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // -------------------------
  // Update stock
  // -------------------------
  const updateStock = async (id: string, newStock: number) => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/${id}`, { stock: newStock });
      setInventory(prev =>
        prev.map(item =>
          item.id === id ? { ...item, stock: Math.max(0, newStock) } : item
        )
      );
      toast.success('Stock updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stock');
    }
  };

  const getLowStockCount = () => inventory.filter(i => i.stock < i.minStock).length;

  if (loading) return <p>Loading inventory...</p>;

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
              <CardContent className="p-6 flex justify-between items-center">
                <div>
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
                    Stock: {item.stock} {item.unit} | Min Stock: {item.minStock}
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
