// src/pages/LoginCustomerPrompt.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LoginCustomerPrompt = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // The page the user tried to visit
  const from = (location.state as { from?: string })?.from || "/";

  const handleLogin = () => {
    navigate("/login", { state: { from } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 bg-background">
      <h1 className="text-2xl font-bold text-foreground">Customer Login</h1>
      <p className="text-center text-muted-foreground">
         Please log in as a customer first.
      </p>

      <Button size="sm" variant="outline" onClick={handleLogin} className="px-6">
        Go to Login
      </Button>
    </div>
  );
};

export default LoginCustomerPrompt;
