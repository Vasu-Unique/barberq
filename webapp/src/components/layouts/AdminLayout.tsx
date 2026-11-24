import { type ReactNode, useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  Scissors,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  ExternalLink,
  Store,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/utils/cn';
import { useSalons, useCurrentUser, useLogout } from '@/hooks/useQueue';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/queue', label: 'Queue Management', icon: ListOrdered },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/services', label: 'Services', icon: Scissors },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children?: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const { data: salonsData } = useSalons({ limit: 1 });
  const { data: currentUser } = useCurrentUser();
  const logoutMutation = useLogout();

  const currentSalon = salonsData?.items?.[0] || {
    id: 'salon-1',
    salon_name: 'Sharp & Co. Barbershop',
    address: '12 King Street West, Toronto',
  };

  const activeTokensCount = 0;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const SidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#006066] to-[#00474C] text-white">
      {/* Brand header */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <Link to="/admin/dashboard" onClick={() => setSidebarOpen(false)}>
          <Logo variant="white" />
        </Link>
      </div>

      {/* Salon Badge */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-mint/20 border border-mint/30 flex items-center justify-center text-mint shrink-0">
            <Store className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentSalon.salon_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-primary-200">Live Queue Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        <p className="px-3 py-1.5 text-[11px] font-bold text-primary-200/60 uppercase tracking-wider">
          Barber Controls
        </p>
        {adminLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-md font-semibold'
                  : 'text-primary-100/80 hover:bg-white/10 hover:text-white',
              )}
            >
              <div className="flex items-center gap-3">
                <link.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{link.label}</span>
              </div>
              {link.to === '/admin/queue' && activeTokensCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-coral-500 text-white shadow-sm">
                  {activeTokensCount}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-2 border-t border-white/10">
          <p className="px-3 py-1.5 text-[11px] font-bold text-primary-200/60 uppercase tracking-wider">
            Quick Actions
          </p>
          <Link
            to="/salons"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-btn text-sm font-medium text-primary-100/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="h-4.5 w-4.5 shrink-0 text-mint" />
              <span>Customer View</span>
            </div>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded text-white/90">Preview</span>
          </Link>
        </div>
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-white/10 bg-black/15">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-coral-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
              {currentUser?.full_name ? currentUser.full_name.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-white">{currentUser?.full_name || 'Tony Barber'}</p>
              <p className="text-[10px] text-primary-200">
                {currentUser?.roles?.includes('admin') ? 'Platform Admin' : 'Shop Staff'}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logoutMutation.mutate();
            window.location.href = '/admin/login';
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-btn text-xs font-medium text-red-200 hover:bg-red-500/20 hover:text-white transition-all text-left"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mist-light flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 shadow-xl z-40">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-72 z-50 animate-slide-down shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg bg-black/20"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-mist h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-btn text-ink hover:bg-mist-light border border-mist transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-ink truncate">
                  {currentSalon.salon_name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Open
                </span>
              </div>
              <p className="text-xs text-ink-soft hidden sm:block">Queue Management Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Live Clock & Date */}
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-ink">{formattedDate}</p>
              <p className="text-xs text-ink-soft font-mono font-medium">{formattedTime}</p>
            </div>

            {/* Notification Bell */}
            <Link
              to="/admin/queue"
              className="relative p-2 rounded-btn text-ink-soft hover:text-ink hover:bg-mist-light transition-colors"
              title="Active Queue"
            >
              <Bell className="h-5 w-5" />
              {activeTokensCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {activeTokensCount}
                </span>
              )}
            </Link>

            {/* Barber Profile */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-mist">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                TC
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-ink">Tony C.</p>
                <p className="text-[11px] text-ink-soft">Barber / Owner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
