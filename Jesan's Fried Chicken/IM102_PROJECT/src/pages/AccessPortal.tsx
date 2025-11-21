import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

const AccessPortal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-white p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Access Portal</h1>
      <div className="grid gap-6 md:grid-cols-3 w-full max-w-3xl">
        {/* Customer Access */}
        <Card className="shadow-lg hover:shadow-xl transition">
          <CardContent className="p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-3">Customer</h2>
            <p className="text-gray-600 mb-4 text-center">
              Browse the menu, place orders, and manage your cart.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Login as Customer
            </Button>
          </CardContent>
        </Card>

        {/* Staff Access */}
        <Card className="shadow-lg hover:shadow-xl transition">
          <CardContent className="p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-3">Staff</h2>
            <p className="text-gray-600 mb-4 text-center">
              Manage walk-in orders and monitor transactions.
            </p>
            <Button onClick={() => navigate("/staff/dashboard")} className="w-full">
              Go to Staff Portal
            </Button>
          </CardContent>
        </Card>

        {/* Admin Access */}
        <Card className="shadow-lg hover:shadow-xl transition">
          <CardContent className="p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-3">Admin</h2>
            <p className="text-gray-600 mb-4 text-center">
              Manage inventory, sales reports, and staff accounts.
            </p>
            <Button onClick={() => navigate("/admin/dashboard")} className="w-full">
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessPortal;
