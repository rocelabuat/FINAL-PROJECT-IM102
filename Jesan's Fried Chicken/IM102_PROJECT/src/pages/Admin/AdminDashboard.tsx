import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockOrders } from '@/data/orders';
import { products } from '@/data/products';
import { DollarSign, BarChart, Clock, Package } from 'lucide-react';

// Import your existing components
import Inventory from '@/pages/Admin/Inventory';
import MenuManagement from '@/pages/Admin/MenuManagement';

const AdminDashboard = () => {
  const totalSales = mockOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = mockOrders.length;
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
  const totalProducts = products.length;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Inventory and Menu Management */}
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Inventory />
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
