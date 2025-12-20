import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

/* -------------------------
   Peso Formatter
-------------------------- */
const pesoFormatter = (value: number) =>
  `₱${Number(value).toLocaleString()}`;

/* -------------------------
   Sort Helper (IMPORTANT)
-------------------------- */
const sortByLabel = (data: any[]) =>
  [...data].sort((a, b) => a.label.localeCompare(b.label));

const TrackSales = () => {
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  /* -------------------------
     Fetch Analytics
  -------------------------- */
  const fetchAnalytics = async () => {
    try {
      const [
        dailyRes,
        weeklyRes,
        monthlyRes,
        topRes,
        statusRes,
        paymentRes,
      ] = await Promise.all([
        axios.get("/api/admin/sales/daily"),
        axios.get("/api/admin/sales/weekly"),
        axios.get("/api/admin/sales/monthly"),
        axios.get("/api/admin/sales/top-products"),
        axios.get("/api/admin/status-counts"),
        axios.get("/api/admin/payment-counts"),
      ]);

      setDailyRevenue(sortByLabel(dailyRes.data));
      setWeeklyRevenue(sortByLabel(weeklyRes.data));
      setMonthlyRevenue(sortByLabel(monthlyRes.data));
      setTopProducts(topRes.data);
      setOrderStatus(statusRes.data);
      setPaymentMethods(paymentRes.data);
    } catch (err) {
      console.error("Failed to fetch sales analytics:", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /* -------------------------
     Export CSV
  -------------------------- */
  const handleExport = async () => {
    try {
      const res = await axios.get("/api/admin/export", {
        responseType: "blob",
      });

      const disposition = res.headers["content-disposition"];
      let filename = "Sales Report.csv";

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
    } catch (err) {
      console.error("EXPORT ERROR:", err);
    }
  };

  /* -------------------------
     Reusable Line Chart
  -------------------------- */
  const RevenueLineChart = ({
    data,
    color,
  }: {
    data: any[];
    color: string;
  }) => (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ top: 30, right: 30, left: 80, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickMargin={10}
          interval="preserveStartEnd"
        />
        <YAxis
          width={80}
          tickFormatter={pesoFormatter}
          domain={[0, "dataMax + 1000"]}
          allowDecimals={false}
        />
        <Tooltip formatter={(v) => pesoFormatter(v as number)} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke={color}
          strokeWidth={3}
          dot={{ r: 5 }}
          activeDot={{ r: 7 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  /* =========================
        RENDER
  ========================= */
  return (
    <div className="space-y-8">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Export Sales Summary
        </button>
      </div>

      {/* Revenue Tabs */}
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        {/* DAILY */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            {/* IMPORTANT: overflow-visible FIXES CUT LABELS */}
            <CardContent className="overflow-visible">
              <RevenueLineChart data={dailyRevenue} color="#FBBF24" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEEKLY */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible">
              <RevenueLineChart data={weeklyRevenue} color="#34D399" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* MONTHLY */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible">
              <RevenueLineChart data={monthlyRevenue} color="#3B82F6" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 3 Best-Selling Products</CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatus}
                dataKey="count"
                nameKey="label"
                outerRadius={100}
                label
              >
                {orderStatus.map((e, i) => (
                  <Cell key={i} fill={e.color || "#ccc"} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethods}
                dataKey="count"
                nameKey="method"
                outerRadius={100}
                label
              >
                {paymentMethods.map((e, i) => (
                  <Cell key={i} fill={e.color || "#ccc"} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackSales;
