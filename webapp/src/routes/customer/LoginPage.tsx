import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Mail, Lock, Sparkles, User, Phone } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { Logo } from '@/components/brand/Logo';
import { useLogin, useRegister } from '@/hooks/useQueue';
import { toast } from 'react-toastify';

export function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('customer@barberq.com');
  const [password, setPassword] = useState('UserPass123!');
  const [phone, setPhone] = useState('+1 (647) 555-0101');

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.warning('Please enter your email and password.');
      return;
    }

    if (isRegister) {
      if (!fullName.trim()) {
        toast.warning('Please enter your full name.');
        return;
      }
      try {
        await registerMutation.mutateAsync({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
        });
        setIsRegister(false);
      } catch {
        // handled in mutation
      }
    } else {
      try {
        await loginMutation.mutateAsync({
          email: email.trim(),
          password: password.trim(),
        });
        navigate({ to: '/salons' });
      } catch {
        // handled in mutation
      }
    }
  };

  const handleQuickDemo = (role: 'customer' | 'barber') => {
    if (role === 'customer') {
      setEmail('customer@barberq.com');
      setPassword('UserPass123!');
      setIsRegister(false);
      toast.info('Loaded demo customer credentials');
    } else {
      navigate({ to: '/admin/login' });
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      {/* Brand Icon Header */}
      <div className="text-center space-y-3">
        <Logo size="lg" className="justify-center" showText={false} />
        <h1 className="text-2xl font-black text-ink">
          {isRegister ? 'Create an Account' : 'Sign In to BarberQ'}
        </h1>
        <p className="text-xs text-ink-soft">
          Track your queue tokens, view past haircut history, and save favorite barbers.
        </p>
      </div>

      <Card className="p-6 sm:p-8 border-mist shadow-md space-y-5">
        {/* Toggle sign in / register */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-mist text-xs font-bold">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`py-2 rounded-lg transition-all ${
              !isRegister ? 'bg-white text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`py-2 rounded-lg transition-all ${
              isRegister ? 'bg-white text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <Input
                label="Full Name"
                placeholder="e.g. James Carter"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="h-4 w-4 text-ink-soft" />}
                required
              />
              <Input
                label="Mobile Phone"
                placeholder="+1 (647) 555-0101"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="h-4 w-4 text-ink-soft" />}
              />
            </>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4 text-ink-soft" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4 text-ink-soft" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center bg-coral-500 hover:bg-coral-600 text-white font-bold"
            loading={loginMutation.isPending || registerMutation.isPending}
          >
            {isRegister ? 'Create Account' : 'Sign In'} &rarr;
          </Button>
        </form>

        {/* Demo Fast Login */}
        <div className="pt-4 border-t border-mist space-y-2">
          <p className="text-[11px] font-bold text-ink-soft flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-gold-500" />
            Instant Demo Sign In:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickDemo('customer')}
              className="text-xs font-semibold"
            >
              Demo Customer
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => handleQuickDemo('barber')}
              className="text-xs font-semibold"
            >
              Barber Admin &rarr;
            </Button>
          </div>
        </div>
      </Card>

      <div className="text-center text-xs text-ink-soft">
        Are you a shop owner or barber?{' '}
        <Link to="/admin/login" className="font-bold text-primary-700 underline">
          Barber Admin Login
        </Link>
      </div>
    </div>
  );
}
