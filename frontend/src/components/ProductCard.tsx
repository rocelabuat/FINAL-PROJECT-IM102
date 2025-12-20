import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  isLowStock: boolean;
}

export const ProductCard = ({
  id, name, description, price, image, category, stock, isLowStock
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (!user || user.role !== "customer") {
      toast.error("Please log in as a customer to add items to cart!");
      navigate("/login?type=customer");
      return;
    }

    if (stock <= 0) {
      toast.error("This item is out of stock!");
      return;
    }

    addToCart({ id, name, price, image });
    toast.success(`${name} added to cart!`);
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {category}
          </span>
        </div>

        <div className="absolute bottom-2 left-2">
          {stock <= 0 ? (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">OUT OF STOCK</span>
          ) : isLowStock ? (
            <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">LOW STOCK</span>
          ) : (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">In Stock</span>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
        <p className="text-2xl font-bold text-primary">₱{price.toFixed(2)}</p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleAddToCart} 
          className="w-full gap-2"
          disabled={stock <= 0}  // Disable if out of stock
        >
          <Plus className="h-4 w-4" />
          {stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
};
