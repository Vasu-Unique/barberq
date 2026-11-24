import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Users,
  Ticket,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Scissors,
  Store,
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '@/components/ui';
import { useSalon, useSalonQueue, useJoinQueue } from '@/hooks/useQueue';
import type { ServiceOut } from '@/api';
import { toast } from 'react-toastify';

export function SalonDetailPage() {
  const { id } = useParams({ strict: false });
  const salonId = id || '';
  const { data: salon, isLoading } = useSalon(salonId);
  const { data: queueState } = useSalonQueue(salonId);
  const joinQueueMutation = useJoinQueue();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [joinSuccessTokenId, setJoinSuccessTokenId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mx-auto" />
        <p className="text-sm text-ink-soft mt-3">Loading salon details...</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-ink">Salon not found</h2>
        <p className="text-sm text-ink-soft mt-1">This barbershop may not be in our directory yet.</p>
        <Link to="/salons" className="inline-block mt-4">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Salons
          </Button>
        </Link>
      </div>
    );
  }

  const services: ServiceOut[] = salon.services || [];
  const servingToken = queueState?.serving_entry;
  const waitingCount = queueState?.total_waiting ?? 0;
  const totalWaitMinutes = queueState?.estimated_total_wait_minutes ?? 0;

  const imageUrl =
    salon.logo_url ||
    'https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=800';

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.warning('Please enter your name and phone number.');
      return;
    }
    const serviceToUse = selectedServiceId || services[0]?.id;
    if (!serviceToUse) {
      toast.warning('Please select a service.');
      return;
    }

    try {
      const token = await joinQueueMutation.mutateAsync({
        salonId: salon.id,
        data: {
          service_id: serviceToUse,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
        },
      });
      setJoinSuccessTokenId(token.id);
    } catch {
      // toast in mutation
    }
  };

  const openJoinWithService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setJoinSuccessTokenId(null);
    setJoinModalOpen(true);
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedServiceId('');
    setJoinSuccessTokenId(null);
  };

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        to="/salons"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to all salons</span>
      </Link>

      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden bg-ink shadow-lg">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={salon.salon_name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500 text-white shadow-xs">
                Verified Barbershop
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                Queue Open
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{salon.salon_name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-primary-100">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary-300" />
                {salon.address}, {salon.city}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-primary-300" />
                {salon.phone}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary-300" />
                {salon.opening_time} &ndash; {salon.closing_time}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <div className="flex items-center justify-center gap-1 text-gold-300 font-extrabold text-lg">
                <Star className="h-4 w-4 fill-gold-300" />
                4.9
              </div>
              <p className="text-[10px] text-white/80">Verified Reviews</p>
            </div>

            <Button
              size="lg"
              className="bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm sm:text-base px-6 shadow-xl shadow-coral-600/30"
              onClick={() => openJoinWithService(services[0]?.id || '')}
              leftIcon={<Ticket className="h-5 w-5" />}
            >
              Join Queue
            </Button>
          </div>
        </div>
      </div>

      {/* Live Queue Banner Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Serving Now */}
        <Card className="p-5 border-mist bg-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Now Serving</p>
            {servingToken ? (
              <p className="text-lg font-black text-primary-700">
                #{servingToken.token_number} &bull; {servingToken.customer_name}
              </p>
            ) : (
              <p className="text-sm font-semibold text-ink-soft">Barber chair ready</p>
            )}
          </div>
        </Card>

        {/* In Queue */}
        <Card className="p-5 border-mist bg-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gold-100 text-gold-700 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">People in Line</p>
            <p className="text-lg font-black text-ink">{waitingCount} waiting</p>
          </div>
        </Card>

        {/* Estimated Wait */}
        <Card className="p-5 border-mist bg-gradient-to-br from-mint/50 to-primary-50 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary-800 uppercase tracking-wider">Estimated Wait</p>
            <p className="text-lg font-black text-primary-900 font-mono">
              {totalWaitMinutes > 0 ? `~${totalWaitMinutes} minutes` : '0 min (Walk in now!)'}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Services & Shop Info */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Services Offered */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Grooming Services &amp; Pricing</h2>
              <p className="text-xs text-ink-soft">Select any service below to jump directly into the queue.</p>
            </div>
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
              {services.length} services available
            </span>
          </div>

          <div className="grid gap-3.5">
            {services.map((svc) => (
              <Card
                key={svc.id}
                hover
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-mist transition-all duration-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{svc.service_name}</h3>
                    <Badge variant="neutral">
                      {svc.duration_minutes} min
                    </Badge>
                  </div>
                  {svc.description && <p className="text-xs text-ink-soft">{svc.description}</p>}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xl font-black text-ink">${svc.price}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs"
                    onClick={() => openJoinWithService(svc.id)}
                    leftIcon={<Ticket className="h-3.5 w-3.5" />}
                  >
                    Select &amp; Join
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Salon Info */}
        <div className="space-y-6">
          <Card className="p-6 border-mist space-y-4">
            <h3 className="text-base font-bold text-ink border-b border-mist pb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-primary-600" />
              Barbershop Hours
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-mist/50">
                <span className="text-ink-soft">Monday &ndash; Friday</span>
                <span className="font-semibold text-ink">
                  {salon.opening_time} &ndash; {salon.closing_time}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-mist/50">
                <span className="text-ink-soft">Saturday</span>
                <span className="font-semibold text-ink">
                  {salon.opening_time} &ndash; {salon.closing_time}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-soft">Sunday</span>
                <span className="font-semibold text-coral-600">Closed</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-ink-soft space-y-2 border-t border-mist">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Walk-ins welcomed with digital ticket
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0" />
                Real-time queue tracking via SMS / Browser
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Join Queue Modal */}
      {joinModalOpen && (
        <Modal open={true} onClose={closeJoinModal} size="md">
          {joinSuccessTokenId ? (
            /* Success Screen */
            <div className="text-center py-4 space-y-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Ticket className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                  Token Issued Successfully
                </span>
                <h3 className="text-2xl font-black text-ink mt-2">You're in the queue!</h3>
                <p className="text-sm text-ink-soft mt-1">
                  at <span className="font-bold text-ink">{salon.salon_name}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-mist-light border border-mist my-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Customer:</span>
                  <span className="font-bold text-ink">{customerName || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Phone:</span>
                  <span className="font-mono text-ink">{customerPhone}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link to="/queue/$id" params={{ id: joinSuccessTokenId }} onClick={closeJoinModal}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center bg-coral-500 hover:bg-coral-600 text-white font-bold"
                  >
                    Track My Queue Live &rarr;
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={closeJoinModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            /* Join Form */
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="border-b border-mist pb-3">
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                  Join Queue
                </span>
                <h3 className="text-xl font-bold text-ink mt-0.5">{salon.salon_name}</h3>
                <p className="text-xs text-ink-soft">{salon.address}</p>
              </div>

              <Input
                label="Full Name"
                placeholder="e.g. Alex Morgan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />

              <Input
                label="Mobile Phone (for live SMS alerts)"
                placeholder="e.g. +1 (416) 555-0199"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                  Select Grooming Service
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {services.map((svc) => (
                    <label
                      key={svc.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedServiceId === svc.id
                          ? 'border-primary-600 bg-mint/50 font-bold text-primary-900 shadow-xs'
                          : 'border-mist bg-white text-ink hover:bg-mist-light'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="service"
                          value={svc.id}
                          checked={selectedServiceId === svc.id}
                          onChange={() => setSelectedServiceId(svc.id)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <p className="text-sm font-semibold">{svc.service_name}</p>
                          <p className="text-[11px] text-ink-soft">{svc.duration_minutes} minutes</p>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-ink">${svc.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button variant="outline" type="button" className="flex-1" onClick={closeJoinModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="flex-1 bg-coral-500 hover:bg-coral-600 text-white font-bold"
                  loading={joinQueueMutation.isPending}
                >
                  Confirm &amp; Get Token
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
