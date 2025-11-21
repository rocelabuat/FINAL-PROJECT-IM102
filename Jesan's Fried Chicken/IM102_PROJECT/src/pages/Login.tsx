import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth, UserRole } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole>('customer');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill tab if role is passed in query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = (params.get('role') || params.get('type')) as UserRole | null;
    if (roleParam) setActiveTab(roleParam);
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('Email and password are required');

    try {
      const user = await login(email.trim(), password, activeTab);

      toast.success('Login successful!');

      // Redirect based on role
      switch (user.role) {
        case 'customer':
          navigate('/menu');
          break;
        case 'staff':
          navigate('/staff/dashboard'); // POS dashboard
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (err: any) {
      console.error('LOGIN ERROR:', err);
      toast.error(err.message || 'Login failed. Check credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Login
          </CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserRole)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            {activeTab === 'customer' && (
              <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
