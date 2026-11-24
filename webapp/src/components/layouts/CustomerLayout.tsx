import { type ReactNode, useState } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { Menu, X, Ticket, ShieldCheck, Sparkles, LogOut } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useCurrentUser, useLogout } from '@/hooks/useQueue';

export function CustomerLayout({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();
  const logoutMutation = useLogout();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/salons', label: 'Explore Salons' },
    { to: '/my-token', label: 'Track My Token' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-ink font-sans selection:bg-mint selection:text-primary-900">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 text-white text-xs py-1.5 px-4 text-center font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-gold-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Real-time digital queues are now live at top city barbershops!</span>
          <Link to="/salons" className="underline font-bold text-mint hover:text-white ml-1">
            Join queue &rarr;
          </Link>
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-mist shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center py-2">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-4 py-2 rounded-btn text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-mint text-primary-800 shadow-xs'
                      : 'text-ink-soft hover:bg-mist-light hover:text-ink',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-soft">
                  Hi, <strong className="text-ink">{currentUser.full_name}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="text-xs text-danger-600 hover:bg-danger-50"
                  leftIcon={<LogOut className="h-3.5 w-3.5" />}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-semibold text-ink-soft hover:text-ink">
                  Login
                </Button>
              </Link>
            )}
            <Link to="/salons">
              <Button
                variant="primary"
                size="sm"
                className="bg-coral-500 hover:bg-coral-600 text-white font-bold shadow-sm"
                leftIcon={<Ticket className="h-4 w-4" />}
              >
                Get a Token
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-btn text-ink hover:bg-mist-light border border-mist transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-mist bg-white shadow-xl animate-slide-down">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-btn text-sm font-semibold transition-colors',
                      isActive ? 'bg-mint text-primary-800' : 'text-ink-soft hover:bg-mist-light',
                    )}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-mist flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Customer / Barber Login
                  </Button>
                </Link>
                <Link to="/salons" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="primary"
                    className="w-full justify-center bg-coral-500 hover:bg-coral-600 text-white font-bold"
                    leftIcon={<Ticket className="h-4 w-4" />}
                  >
                    Get a Token Now
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-in">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Customer Footer */}
      <footer className="border-t border-mist bg-white text-ink-soft mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand */}
            <div className="md:col-span-2 space-y-3">
              <Logo size="md" />
              <p className="text-sm text-ink-soft max-w-sm leading-relaxed">
                Smart queues. Better grooming. BarberQ replaces paper clipboards and packed lobbies with digital tokens, real-time wait estimation, and instant alerts.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs text-primary-700 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero app installs required • 100% web based</span>
              </div>
            </div>

            {/* Col 2: Customer */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink mb-3">Customer App</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/salons" className="hover:text-primary-600 transition-colors">
                    Find Barbershops
                  </Link>
                </li>
                <li>
                  <Link to="/my-token" className="hover:text-primary-600 transition-colors">
                    Track Active Token
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-primary-600 transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: For Barbers */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink mb-3">For Barbers</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/admin/dashboard" className="hover:text-primary-600 transition-colors">
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/admin/queue" className="hover:text-primary-600 transition-colors">
                    Queue Console
                  </Link>
                </li>
                <li>
                  <Link to="/admin/login" className="hover:text-primary-600 transition-colors">
                    Barber Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-mist pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} BarberQ Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-ink cursor-pointer">Privacy Policy</span>
              <span className="hover:text-ink cursor-pointer">Terms of Service</span>
              <Link to="/admin/dashboard" className="font-semibold text-primary-600 hover:text-primary-700">
                Barber Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
