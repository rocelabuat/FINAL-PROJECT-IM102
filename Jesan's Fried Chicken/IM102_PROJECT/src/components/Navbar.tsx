import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export const Navbar = () => {
  const { items, itemCount, clearCart } = useCart();
  const { user, logout: authLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-clear cart if user changes
  useEffect(() => {
    clearCart();
  }, [user]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      clearCart();       // clear cart items
      authLogout?.();    // remove user/token
      navigate('/');
    }
  };

  const requireLogin = (path: string) => {
    if (user?.role === 'customer') {
      navigate(path);
    } else {
      navigate('/login-customer'); // redirect guests or non-customers
    }
  };

  const homeRoute = user ? '/' : '/';

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={homeRoute} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Jesan's Fried Chicken</h1>
              <p className="text-xs text-muted-foreground">Crispy. Juicy. Perfectly Fried!</p>
            </div>
          </Link>

          {/* Navigation Links */}
          {(!user || user?.role === 'customer') && (
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'hover:text-primary'}`}
              >
                Home
              </Link>

              <span
                onClick={() => requireLogin('/menu')}
                className={`cursor-pointer text-sm font-medium transition-colors ${location.pathname === '/menu' ? 'text-primary' : 'hover:text-primary'}`}
              >
                Menu
              </span>

              <Link
                to="/about"
                className={`text-sm font-medium transition-colors ${location.pathname === '/about' ? 'text-primary' : 'hover:text-primary'}`}
              >
                About
              </Link>
              <Link
                to="/contacts"
                className={`text-sm font-medium transition-colors ${location.pathname === '/contacts' ? 'text-primary' : 'hover:text-primary'}`}
              >
                Contact
              </Link>

              <span
                onClick={() => requireLogin('/customer/dashboard')}
                className={`cursor-pointer text-sm font-medium transition-colors ${location.pathname === '/customer/dashboard' ? 'text-primary' : 'hover:text-primary'}`}
              >
                Orders
              </span>
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Cart & Profile for customer or guest */}
            {(!user || user?.role === 'customer') && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => requireLogin('/cart')}
                  className="relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => requireLogin('/customer/dashboard')}
                >
                  <User className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Staff/Admin: Name only */}
            {(user?.role === 'staff' || user?.role === 'admin') && (
              <span className="font-medium">{user.name || user.role}</span>
            )}

            {/* Login / Logout */}
            {user ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
