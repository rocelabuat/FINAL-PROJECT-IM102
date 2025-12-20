import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext'; // ✅ useAuth hook

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { forgotPassword } = useAuth(); // ✅ get forgotPassword from context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await forgotPassword(email);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <Label>Email</Label>
      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <Button type="submit" className="w-full">Send Reset Link</Button>
    </form>
  );
};

export default ForgotPassword;
