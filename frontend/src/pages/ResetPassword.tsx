import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext'; // ✅ useAuth hook

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth(); // ✅ get resetPassword from context

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");

    if (!token || !email) return toast.error("Invalid reset link");

    try {
      const data = await resetPassword(email, token, newPassword);
      toast.success(data.message);
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <Label>New Password</Label>
      <Input
        type="password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        required
      />
      <Label>Confirm Password</Label>
      <Input
        type="password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        required
      />
      <Button type="submit" className="w-full">Reset Password</Button>
    </form>
  );
};

export default ResetPassword;
