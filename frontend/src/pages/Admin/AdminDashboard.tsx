import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Package, TrendingUp, Coins } from "lucide-react";
import Inventory from "@/pages/Admin/Inventory";
import TrackSales from "@/pages/Admin/TrackSales";
import { useAdmin } from "@/contexts/AdminContext";
import axios from "axios";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { totals, fetchTotals } = useAdmin();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingExport, setLoadingExport] = useState(false);

  /* -------------------------
     Live Date & Time
  ------------------------- */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-PH", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  /* -------------------------
     Auto Refresh Totals
  ------------------------- */
  useEffect(() => {
    fetchTotals();
    const interval = setInterval(fetchTotals, 10000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------
     CSV Export
  ------------------------- */
  const handleExport = async () => {
    try {
      setLoadingExport(true);

      const res = await axios.get("/api/admin/export-summary", {
        responseType: "blob",
      });

      const disposition = res.headers["content-disposition"];
      let filename = "Sales_Report.csv";

      if (disposition) {
        const match = disposition.match(/filename="?(.*)"?/);
        if (match?.[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Sales report exported successfully!");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export sales report");
    } finally {
      setLoadingExport(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {formattedDate} — {formattedTime}
            </p>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* TODAY'S PAID REVENUE */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Today's Paid Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱{Number(totals.todayRevenue ?? 0).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paid / verified orders only
              </p>
            </CardContent>
          </Card>

          {/* TOTAL ORDERS */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total Orders
              </CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.totalOrders ?? 0}
              </div>
            </CardContent>
          </Card>

          {/* AVG ORDER VALUE */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Avg Order Value
              </CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱{Number(totals.avgOrderValue ?? 0).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          {/* BEST SELLING */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Best Selling Item
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {totals.bestSelling?.name ?? "No data"}
              </div>
              <p className="text-sm text-muted-foreground">
                Sold: {totals.bestSelling?.sold ?? 0}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Tabs */}
        <Tabs defaultValue="inventory" className="mt-10">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="trackSales">Track Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Inventory />
          </TabsContent>

          <TabsContent value="trackSales">
            <TrackSales />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default AdminDashboard;
