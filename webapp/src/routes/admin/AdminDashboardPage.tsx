import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Users,
  Clock,
  Ticket,
  Scissors,
  TrendingUp,
  Play,
} from 'lucide-react';
import { Button, Card, StatusBadge } from '@/components/ui';
import type { TokenStatus } from '@/data/types';
import {
  useSalons,
  useStaffQueueDashboard,
  useSalonQueueEntries,
  useCallNext,
  useCompleteToken,
} from '@/hooks/useQueue';
import { formatRelativeTime } from '@/utils/format';

export function AdminDashboardPage() {
  const { data: salonsData } = useSalons({ limit: 1 });
  const salon = salonsData?.items?.[0];
  const currentSalonId = salon?.id || '';

  const { data: dashboardState } = useStaffQueueDashboard(currentSalonId);
  const { data: recentEntriesData } = useSalonQueueEntries(currentSalonId, { limit: 10 });

  const callNextMutation = useCallNext();
  const completeMutation = useCompleteToken();

  const servingToken = dashboardState?.serving_entry;
  const waitingTokens = dashboardState?.waiting_entries ?? [];
  const waitingCount = dashboardState?.total_waiting ?? 0;
  const totalWaitMins = dashboardState?.estimated_total_wait_minutes ?? 0;

  // Elapsed service timer for the customer currently in chair
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    if (!servingToken?.started_at && !servingToken?.called_at) {
      setElapsedSecs(0);
      return;
    }
    const startTime = servingToken.started_at || servingToken.called_at;
    const updateElapsed = () => {
      const start = new Date(startTime!).getTime();
      setElapsedSecs(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [servingToken]);

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleCallNext = async () => {
    if (!currentSalonId) return;
    try {
      await callNextMutation.mutateAsync({ salonId: currentSalonId });
    } catch {
      // handled
    }
  };

  const handleCompleteCurrent = async () => {
    if (!servingToken || !currentSalonId) return;
    try {
      await completeMutation.mutateAsync({ salonId: currentSalonId, entryId: servingToken.id });
    } catch {
      // handled
    }
  };

  // Activity chart simulated distribution
  const hourlyActivity = [
    { hour: '9 AM', count: 4, height: '40%' },
    { hour: '10 AM', count: 7, height: '65%' },
    { hour: '11 AM', count: 9, height: '85%' },
    { hour: '12 PM', count: 12, height: '100%' },
    { hour: '1 PM', count: 8, height: '75%' },
    { hour: '2 PM', count: 6, height: '55%' },
    { hour: '3 PM', count: 10, height: '90%' },
    { hour: '4 PM', count: 5, height: '45%' },
  ];

  const recentEntries = recentEntriesData?.items || [];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-mist pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
            Barber Station Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-ink mt-2">
            Overview &amp; Queue Pulse
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Live queue telemetry for {salon?.salon_name || 'Sharp & Co. Barbershop'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/admin/queue">
            <Button
              variant="primary"
              size="md"
              className="bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs sm:text-sm shadow-md"
              leftIcon={<Play className="h-4 w-4" />}
            >
              Open Live Queue Console &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Waiting */}
        <Card className="p-5 border-mist bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
              Waiting in Queue
            </span>
            <div className="h-8 w-8 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{waitingCount}</span>
            <span className="text-xs font-medium text-ink-soft">customers</span>
          </div>
          <p className="text-[11px] text-ink-soft mt-1">In lobby or nearby</p>
        </Card>

        {/* Total Entries Today */}
        <Card className="p-5 border-mist bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
              Total Today
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink">{recentEntriesData?.total ?? 0}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> Live
            </span>
          </div>
          <p className="text-[11px] text-ink-soft mt-1">Digital queue records</p>
        </Card>

        {/* In Chair Status */}
        <Card className="p-5 border-mist bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
              In Chair
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Scissors className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              {servingToken ? `#${servingToken.token_number}` : 'None'}
            </span>
          </div>
          <p className="text-[11px] text-ink-soft mt-1">
            {servingToken ? servingToken.customer_name : 'Chair available'}
          </p>
        </Card>

        {/* Estimated Wait Time */}
        <Card className="p-5 border-mist bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
              Total Queue Wait
            </span>
            <div className="h-8 w-8 rounded-xl bg-mint text-primary-800 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary-900 font-mono">~{totalWaitMins}m</span>
          </div>
          <p className="text-[11px] text-ink-soft mt-1">Automated forecast</p>
        </Card>
      </div>

      {/* Middle Grid: In-Chair Spotlight & Customer Activity Chart */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Spotlight: Currently in Barber Chair */}
        <div className="lg:col-span-5">
          <Card className="p-6 border-mist h-full flex flex-col justify-between bg-gradient-to-br from-white via-primary-50/30 to-mint/20 shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-mist">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-900">
                    Chair 1 &bull; Now Serving
                  </span>
                </div>
                <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2.5 py-0.5 rounded-full">
                  Barber On Duty
                </span>
              </div>

              {servingToken ? (
                <div className="py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-ink-soft font-semibold">Active Customer</p>
                      <h3 className="text-xl font-black text-ink">{servingToken.customer_name}</h3>
                      <p className="text-xs text-ink-soft font-mono">{servingToken.customer_phone}</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-primary-600 text-white flex flex-col items-center justify-center font-mono font-black text-2xl shadow-md">
                      #{servingToken.token_number}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-primary-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-ink-soft block text-[10px] uppercase font-bold">Service</span>
                      <span className="font-bold text-ink">{servingToken.service_name || 'Haircut'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-ink-soft block text-[10px] uppercase font-bold">Target Time</span>
                      <span className="font-bold text-primary-700">{servingToken.estimated_duration} mins</span>
                    </div>
                  </div>

                  {/* Elapsed Timer */}
                  <div className="p-4 rounded-2xl bg-ink text-white flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-5 w-5 text-mint animate-pulse" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-primary-200 tracking-wider">
                          Elapsed in Chair
                        </p>
                        <p className="text-2xl font-black font-mono tracking-tight text-white">
                          {formatElapsed(elapsedSecs)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                      onClick={handleCompleteCurrent}
                      loading={completeMutation.isPending}
                    >
                      Complete &amp; Free Chair
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-mist text-ink-soft flex items-center justify-center mx-auto">
                    <Scissors className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-ink text-sm">Chair is Empty</h4>
                  <p className="text-xs text-ink-soft max-w-xs mx-auto">
                    Call the next waiting customer to seat them in the grooming chair.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs"
                    onClick={handleCallNext}
                    loading={callNextMutation.isPending}
                    disabled={waitingTokens.length === 0}
                  >
                    Call Next Customer
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-mist/80 flex items-center justify-between text-xs text-ink-soft">
              <span>Next up: {waitingTokens[0]?.customer_name || 'None waiting'}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleCallNext}
                disabled={waitingTokens.length === 0 || callNextMutation.isPending}
              >
                Call Next &rarr;
              </Button>
            </div>
          </Card>
        </div>

        {/* Hourly Queue Activity */}
        <div className="lg:col-span-7">
          <Card className="p-6 border-mist h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-mist">
                <div>
                  <h3 className="font-bold text-ink text-sm">Customer Flow Today</h3>
                  <p className="text-xs text-ink-soft">Peak queue volume across business hours</p>
                </div>
                <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                  Peak at 12 PM
                </span>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-48 pt-6 flex items-end justify-between gap-2 px-2">
                {hourlyActivity.map((bar) => (
                  <div key={bar.hour} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-mist-light rounded-t-lg h-36 flex items-end overflow-hidden">
                      <div
                        style={{ height: bar.height }}
                        className="w-full bg-primary-500 group-hover:bg-coral-500 rounded-t-lg transition-all duration-300 relative"
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-ink text-white px-1.5 py-0.5 rounded shadow-xs transition-opacity">
                          {bar.count}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-ink-soft">{bar.hour}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-mist flex items-center justify-between text-xs text-ink-soft">
              <span>Busiest window: 11:30 AM &ndash; 1:30 PM</span>
              <Link to="/admin/queue" className="text-primary-700 font-bold hover:underline">
                View Queue Details &rarr;
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Queue Entries Table */}
      <Card className="p-6 border-mist">
        <div className="flex items-center justify-between pb-4 border-b border-mist">
          <div>
            <h3 className="font-bold text-ink text-sm">Recent Queue Activity</h3>
            <p className="text-xs text-ink-soft">Latest entries logged in BarberQ</p>
          </div>
          <Link to="/admin/queue">
            <Button variant="outline" size="sm" className="text-xs">
              Manage All Tokens
            </Button>
          </Link>
        </div>

        {recentEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-soft">No queue entries found for today.</div>
        ) : (
          <div className="divide-y divide-mist">
            {recentEntries.slice(0, 5).map((tok) => (
              <div key={tok.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-primary-900 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200">
                    #{tok.token_number}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{tok.customer_name}</p>
                    <p className="text-[11px] text-ink-soft">{tok.service_name || 'Haircut'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-ink-soft text-[11px] hidden sm:inline">
                    {formatRelativeTime(tok.joined_at)}
                  </span>
                  <StatusBadge status={tok.status.toLowerCase() as TokenStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
