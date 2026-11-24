import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { Lock, Mail, Store, Sparkles } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Logo } from '@/components/brand/Logo';
import { useLogin } from '@/hooks/useQueue';
import { toast } from 'react-toastify';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('staff@barberq.com');
  const [password, setPassword] = useState('StaffPass123!');
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.warning('Please enter both email and password.');
      return;
    }

    try {
      const data = await loginMutation.mutateAsync({
        email: email.trim(),
        password: password.trim(),
      });
      toast.success(`Logged in as ${data.user.full_name}`);
      navigate({ to: '/admin/dashboard' });
    } catch {
      // toast in mutation
    }
  };

  const handleQuickFill = (role: 'staff' | 'admin') => {
    if (role === 'staff') {
      setEmail('staff@barberq.com');
      setPassword('StaffPass123!');
      toast.info('Loaded credentials for Shop Staff (Tony Barber)');
    } else {
      setEmail('admin@barberq.com');
      setPassword('AdminPass123!');
      toast.info('Loaded credentials for Platform Admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004e54] via-[#006a71] to-[#007C84] flex flex-col justify-center items-center p-4 sm:p-6 text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-coral-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <Logo variant="white" size="lg" className="justify-center" />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            Barber Console &amp; Admin
          </h1>
          <p className="text-xs text-primary-100/80">
            Sign in to manage live walk-in queues, services, and customers.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white text-ink rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 space-y-6">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-primary-50 border border-primary-200/80">
            <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary-900">Sharp &amp; Co. Barbershop</p>
              <p className="text-[11px] text-primary-700">Staff Console Portal</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@barberq.com"
              leftIcon={<Mail className="h-4 w-4 text-ink-soft" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4 text-ink-soft" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center bg-coral-500 hover:bg-coral-600 text-white font-bold"
              loading={loginMutation.isPending}
            >
              Sign In to Console &rarr;
            </Button>
          </form>

          {/* Quick autofill demo credentials */}
          <div className="pt-4 border-t border-mist space-y-2 text-xs">
            <p className="text-[11px] font-bold text-ink-soft flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" />
              Demo Staff Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill('staff')}
                className="text-xs font-semibold"
              >
                Staff (Tony)
              </Button>
              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={() => handleQuickFill('admin')}
                className="text-xs font-semibold"
              >
                Platform Admin
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-primary-100">
          <Link to="/salons" className="underline hover:text-white">
            &larr; Back to Customer View
          </Link>
        </div>
      </div>
    </div>
  );
}
