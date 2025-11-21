import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Truck,
  Star,
  ShoppingBag,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import heroImage from "@/assets/hero-chicken.jpg";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const featuredProducts = products.slice(0, 4);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed && logout) {
      logout();
      navigate("/landing");
    }
  };

  const handleOrderNow = () => {
    if (user?.role === "customer") navigate("/menu");
    else navigate("/login?type=customer");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
              Crispy. Juicy. <span className="text-primary">Perfectly Fried!</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Experience the ultimate fried chicken — crispy on the outside, juicy
              on the inside, seasoned to perfection.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2" onClick={handleOrderNow}>
                Order Now <ArrowRight className="h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  user?.role === "customer"
                    ? navigate("/menu")
                    : navigate("/login?type=customer")
                }
              >
                View Menu
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Service</h3>
              <p className="text-muted-foreground">
                Quick preparation and delivery, hot and fresh every time.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Home Delivery</h3>
              <p className="text-muted-foreground">
                Order online and get it delivered right to your doorstep.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-muted-foreground">
                Premium ingredients and time-tested recipes for the best taste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Menu</h2>
            <p className="text-muted-foreground text-lg">
              Our most popular items — loved by everyone!
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                user?.role === "customer"
                  ? navigate("/menu")
                  : navigate("/login?type=customer")
              }
            >
              View Full Menu
            </Button>
          </div>
        </div>
      </section>

      {/* Access Portal Section */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold mb-4 text-foreground">Access Portal</h3>
          <p className="text-muted-foreground text-lg mb-16">Select your role to continue</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Customer Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-card/90 backdrop-blur">
              <CardHeader className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <ShoppingBag className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground mb-2">
                  Customer
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Browse menu, place orders, and track deliveries
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4">
                {user?.role === "customer" ? (
                  <Button
                    className="w-full font-medium shadow-sm hover:shadow-md"
                    variant="default"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                ) : (
                  <Link to="/login?type=customer">
                    <Button className="w-full font-medium shadow-sm hover:shadow-md" variant="default">
                      Customer Login
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Staff Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-card/90 backdrop-blur">
              <CardHeader className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mb-4 group-hover:bg-secondary/25 transition-colors">
                  <UserCircle className="h-7 w-7 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground mb-2">
                  Staff
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Manage orders, process payments, and update inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4">
                <Link to="/login?type=staff">
                  <Button className="w-full font-medium shadow-sm hover:shadow-md" variant="secondary">
                    Staff Login
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Admin Card */}
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-card/90 backdrop-blur">
              <CardHeader className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <ShieldCheck className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground mb-2">
                  Admin
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Access reports, analytics, and staff management
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4">
                <Link to="/login?type=admin">
                  <Button
                    className="w-full font-medium shadow-sm hover:shadow-md border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    variant="outline"
                  >
                    Admin Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
