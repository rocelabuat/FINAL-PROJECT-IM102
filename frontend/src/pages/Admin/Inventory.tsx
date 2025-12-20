// src/pages/admin/Inventory.tsx
import { useEffect, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Check } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const Inventory = () => {
  const { inventory, fetchInventory, lowStockCount, alerts, fetchLowStockAlerts } =
    useAdmin();

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  /* ================================
     LOAD INVENTORY + ALERTS
  ================================= */
  const loadData = async () => {
    setLoading(true);
    try {
      await fetchInventory();
      await fetchLowStockAlerts();
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================================
     UPDATE STOCK (Manual +1 / -1)
  ================================= */
  const handleUpdateStock = async (id: number, delta: number) => {
    try {
      const item = inventory.find((i) => i.id === id);
      if (!item) return;

      const updated = Number(item.stock) + delta;

      if (updated < 0) {
        toast.error("Stock cannot be negative");
        return;
      }

      setUpdatingId(id);

      await axios.put(`/api/admin/inventory/${id}`, { stock: updated });

      // Refresh both inventory + alerts to stay perfectly synced
      await fetchInventory();
      await fetchLowStockAlerts();

      toast.success("Stock updated");
    } catch (err) {
      toast.error("Failed to update stock");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================================
     RENDER
  ================================= */

  if (loading) return <p className="text-center py-8">Loading inventory...</p>;

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Inventory Management</h1>

          {lowStockCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} items low stock
            </Badge>
          )}
        </div>

        {/* Inventory Items */}
        <div className="grid gap-4">
          {inventory.length === 0 ? (
            <p className="text-center">No inventory found.</p>
          ) : (
            inventory.map((item) => {
              const stock = Number(item.stock);
              const threshold = Number(item.threshold);
              const isLow = Boolean(item.low_stock);

              return (
                <Card key={item.id}>
                  <CardContent className="p-6 flex justify-between items-center">
                    {/* Item Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>

                        {isLow ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-green-600 text-white">
                            <Check className="h-3 w-3" />
                            In Stock
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Stock: {stock} &nbsp;|&nbsp; Threshold: {threshold}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingId === item.id || stock <= 0}
                        onClick={() => handleUpdateStock(item.id, -1)}
                      >
                        -1
                      </Button>

                      <Input
                        readOnly
                        type="number"
                        value={stock}
                        className="w-20 text-center"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStock(item.id, +1)}
                      >
                        +1
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
