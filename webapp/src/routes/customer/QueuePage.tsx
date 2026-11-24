import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  Ticket,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { Button, Card, ConfirmDialog } from '@/components/ui';
import { useToken, useSalon, useCancelToken } from '@/hooks/useQueue';
import { toast } from 'react-toastify';

export function QueuePage() {
  const { id } = useParams({ strict: false });
  const entryId = id || '';
  const { data: token, refetch, isLoading } = useToken(entryId);
  const salonId = token?.salon_id || '';
  const { data: salon } = useSalon(salonId);
  const cancelTokenMutation = useCancelToken();

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Previous tracking state for toast notifications
  const prevPositionRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const normalizedStatus = (token?.status || 'WAITING').toUpperCase();
  const peopleAhead = token?.people_ahead ?? 0;

  // Sync remaining seconds
  useEffect(() => {
    if (!token) return;
    const initialSecs = (token.estimated_wait_minutes ?? 15) * 60;
    setSecondsRemaining(initialSecs);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  // Reactive notifications on queue movement
  useEffect(() => {
    if (!token) return;

    if (prevPositionRef.current === null) {
      prevPositionRef.current = peopleAhead;
      prevStatusRef.current = normalizedStatus;
      return;
    }

    if (prevStatusRef.current !== normalizedStatus) {
      if (normalizedStatus === 'SERVING' || normalizedStatus === 'CALLED') {
        toast.success("It's your turn! The barber chair is ready for you now!", {
          autoClose: 8000,
        });
      } else if (normalizedStatus === 'COMPLETED') {
        toast.info('Your service has been completed. Thanks for visiting!');
      } else if (normalizedStatus === 'CANCELLED') {
        toast.warn('This token has been cancelled.');
      }
      prevStatusRef.current = normalizedStatus;
    }

    if (prevPositionRef.current !== peopleAhead && normalizedStatus === 'WAITING') {
      if (peopleAhead === 2) {
        toast.info('Queue update: 2 people ahead. Please make your way toward the salon.');
      } else if (peopleAhead === 1) {
        toast.warning("Queue update: You're next! Please be inside the salon waiting area.");
      } else if (peopleAhead === 0) {
        toast.success("Queue update: 0 ahead! You're up right now!");
      }
      prevPositionRef.current = peopleAhead;
    }
  }, [peopleAhead, normalizedStatus, token]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCancelConfirm = async () => {
    if (!token) return;
    try {
      await cancelTokenMutation.mutateAsync({ entryId: token.id, salonId: token.salon_id || undefined });
      setConfirmCancelOpen(false);
    } catch {
      // toast in mutation
    }
  };

  const formatCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) return 'Any moment now';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mx-auto" />
        <p className="text-sm text-ink-soft mt-3">Loading token details...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-mist text-ink-soft flex items-center justify-center mx-auto">
          <Ticket className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-ink">Token not found</h2>
        <p className="text-sm text-ink-soft max-w-sm mx-auto">
          The requested token may have expired, or the ID was entered incorrectly.
        </p>
        <Link to="/salons" className="inline-block pt-2">
          <Button variant="primary">Explore Barbershops</Button>
        </Link>
      </div>
    );
  }

  const isServing = normalizedStatus === 'SERVING' || normalizedStatus === 'CALLED';
  const isCompleted = normalizedStatus === 'COMPLETED';
  const isCancelled = normalizedStatus === 'CANCELLED' || normalizedStatus === 'SKIPPED';

  let stateBanner = {
    title: '3+ ahead – Waiting',
    message: 'Sit back and relax. Your turn will approach shortly. Grab a coffee or wait comfortably.',
    badgeClass: 'bg-primary-100 text-primary-800 border-primary-200',
    stepNumber: 1,
  };

  if (isCompleted) {
    stateBanner = {
      title: 'Service Completed',
      message: 'Your service has wrapped up. Thank you for using BarberQ! Looking fresh!',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      stepNumber: 4,
    };
  } else if (isCancelled) {
    stateBanner = {
      title: 'Token Cancelled',
      message: 'This token has been cancelled or skipped. You can grab a new token anytime.',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      stepNumber: 0,
    };
  } else if (isServing || peopleAhead === 0) {
    stateBanner = {
      title: "0 ahead – It's your turn!",
      message: 'Please step right up to the barber chair. Your barber is ready to give you a clean cut!',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse',
      stepNumber: 4,
    };
  } else if (peopleAhead === 1) {
    stateBanner = {
      title: "1 ahead – You're next!",
      message: 'You are the very next customer in line. Please be present inside the salon waiting area now.',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
      stepNumber: 3,
    };
  } else if (peopleAhead === 2) {
    stateBanner = {
      title: '2 ahead – Approaching',
      message: 'Your turn is approaching! Please begin heading over to the shop.',
      badgeClass: 'bg-gold-100 text-gold-800 border-gold-300',
      stepNumber: 2,
    };
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/salons"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Salons</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          loading={isRefreshing}
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
        >
          Refresh Live
        </Button>
      </div>

      {/* Main Ticket Card */}
      <Card className="overflow-hidden border-mist shadow-lg bg-white">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#006a71] to-[#004e54] text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-primary-200">
                Digital Queue Token
              </span>
              <h2 className="text-xl font-bold mt-0.5">{salon?.salon_name || 'Barbershop'}</h2>
              <p className="text-xs text-primary-100/80">{salon?.address || ''}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white block">
                #{token.token_number}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${stateBanner.badgeClass}`}>
                {normalizedStatus}
              </span>
            </div>
          </div>
        </div>

        {/* State Banner */}
        <div className={`p-4 border-b border-mist/80 text-xs sm:text-sm font-medium ${stateBanner.badgeClass}`}>
          <div className="flex items-start gap-3">
            <div className="font-bold text-sm">{stateBanner.title}</div>
            <p className="opacity-90">{stateBanner.message}</p>
          </div>
        </div>

        {/* Queue Stats Grid */}
        <div className="grid grid-cols-2 divide-x divide-mist border-b border-mist text-center p-6 bg-mist-light/40">
          <div>
            <span className="text-xs text-ink-soft uppercase tracking-wider font-bold block mb-1">
              Ahead of You
            </span>
            <span className="text-3xl font-black text-ink">{isServing ? 0 : peopleAhead}</span>
            <span className="text-xs text-ink-soft block mt-0.5">customers</span>
          </div>

          <div>
            <span className="text-xs text-ink-soft uppercase tracking-wider font-bold block mb-1">
              Estimated Wait
            </span>
            <span className="text-3xl font-black text-coral-600 font-mono">
              {isServing ? '0m' : formatCountdown(secondsRemaining)}
            </span>
            <span className="text-xs text-ink-soft block mt-0.5">approximate</span>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between py-1.5 border-b border-mist/60">
            <span className="text-ink-soft">Customer Name</span>
            <span className="font-semibold text-ink">{token.customer_name}</span>
          </div>
          {token.customer_phone && (
            <div className="flex justify-between py-1.5 border-b border-mist/60">
              <span className="text-ink-soft">Phone</span>
              <span className="font-mono text-ink">{token.customer_phone}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-mist/60">
            <span className="text-ink-soft">Service</span>
            <span className="font-semibold text-ink">{token.service_name || 'Haircut'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-mist/60">
            <span className="text-ink-soft">Est. Duration</span>
            <span className="font-semibold text-ink">{token.estimated_duration || 30} mins</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-ink-soft">Price</span>
            <span className="font-bold text-ink">${token.service_price}</span>
          </div>
        </div>

        {/* Actions */}
        {!isCompleted && !isCancelled && (
          <div className="p-6 pt-0">
            <Button
              variant="outline"
              className="w-full text-danger-600 hover:text-danger-700 hover:bg-danger-50 border-danger-200"
              onClick={() => setConfirmCancelOpen(true)}
            >
              Cancel My Queue Token
            </Button>
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Queue Token?"
        message="Are you sure you want to cancel your spot in line? You will lose your position and will need to request a new token."
        confirmLabel="Yes, Cancel Token"
        variant="danger"
        loading={cancelTokenMutation.isPending}
      />
    </div>
  );
}
