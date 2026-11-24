import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Search,
  MapPin,
  Clock,
  Star,
  Filter,
  Ticket,
  Store,
} from 'lucide-react';
import { Button, Card, Input, Modal, Pagination, SkeletonCard } from '@/components/ui';
import { useSalons, useJoinQueue } from '@/hooks/useQueue';
import type { SalonOut, ServiceOut } from '@/api';
import { toast } from 'react-toastify';

export function SalonsPage() {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'open' | 'short-wait'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'wait' | 'name'>('rating');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  // TanStack Query for paginated salons
  const {
    data: salonsData,
    isLoading,
    isFetching,
  } = useSalons({
    search: search.trim() || undefined,
    city: selectedCity === 'all' ? undefined : selectedCity,
    page,
    limit,
    is_active: availabilityFilter === 'open' ? true : undefined,
  });

  const joinQueueMutation = useJoinQueue();

  // Quick Join Modal State
  const [joinModalSalon, setJoinModalSalon] = useState<SalonOut | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [joinSuccessTokenId, setJoinSuccessTokenId] = useState<string | null>(null);

  const rawSalons = useMemo(() => salonsData?.items || [], [salonsData?.items]);
  const totalSalons = salonsData?.total || 0;
  const totalPages = salonsData?.total_pages || 1;

  // Process salons for display
  const processedSalons = useMemo(() => {
    return rawSalons
      .map((salon) => {
        const services = salon.services || [];
        const waitMinutes = Math.min(60, Math.max(5, services.length * 10));
        const rating = 4.8;
        const reviewCount = 142;
        const name = salon.salon_name;
        const imageUrl =
          salon.logo_url ||
          'https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=800';

        return {
          ...salon,
          name,
          imageUrl,
          rating,
          reviewCount,
          waitMinutes,
          waitingCount: Math.floor(waitMinutes / 20),
          isOpen: salon.is_active,
        };
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'wait') return a.waitMinutes - b.waitMinutes;
        return a.name.localeCompare(b.name);
      });
  }, [rawSalons, sortBy]);

  // Handle Quick Join Submit
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinModalSalon) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.warning('Please enter your name and phone number.');
      return;
    }
    if (!selectedServiceId) {
      toast.warning('Please select a service.');
      return;
    }

    try {
      const token = await joinQueueMutation.mutateAsync({
        salonId: joinModalSalon.id,
        data: {
          service_id: selectedServiceId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
        },
      });
      setJoinSuccessTokenId(token.id);
    } catch {
      // toast handled in mutation
    }
  };

  const openJoinModal = (salon: SalonOut) => {
    setJoinModalSalon(salon);
    const firstSvc = salon.services?.[0];
    setSelectedServiceId(firstSvc ? firstSvc.id : '');
    setJoinSuccessTokenId(null);
  };

  const closeJoinModal = () => {
    setJoinModalSalon(null);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedServiceId('');
    setJoinSuccessTokenId(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-mist pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
            Real-Time Availability
          </span>
          <h1 className="text-3xl font-black text-ink mt-2">Find a Barbershop</h1>
          <p className="text-sm text-ink-soft mt-1">
            Browse verified salons, check live wait times, and step into the digital queue.
          </p>
        </div>

        {/* Total Salons active counter */}
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft bg-white px-3.5 py-2 rounded-xl border border-mist shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{totalSalons} Partner Salons Registered</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-mist shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
            <input
              type="text"
              placeholder="Search by barbershop name, address, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-btn border border-mist text-sm text-ink focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            />
          </div>

          {/* City Selector */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-btn border border-mist text-sm text-ink bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            >
              <option value="all">All Cities</option>
              <option value="Toronto">Toronto</option>
              <option value="Mississauga">Mississauga</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'wait' | 'name')}
              className="w-full py-2.5 px-3 rounded-btn border border-mist text-sm text-ink bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            >
              <option value="rating">Sort: Highest Rated</option>
              <option value="wait">Sort: Shortest Wait</option>
              <option value="name">Sort: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-mist/60 text-xs flex-wrap">
          <span className="text-ink-soft font-semibold flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Filter by:
          </span>
          <button
            onClick={() => {
              setAvailabilityFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              availabilityFilter === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-mist-light text-ink hover:bg-mist'
            }`}
          >
            All Salons
          </button>
          <button
            onClick={() => {
              setAvailabilityFilter('open');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              availabilityFilter === 'open'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-mist-light text-ink hover:bg-mist'
            }`}
          >
            Open Now
          </button>
          <button
            onClick={() => {
              setAvailabilityFilter('short-wait');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              availabilityFilter === 'short-wait'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-mist-light text-ink hover:bg-mist'
            }`}
          >
            ⚡ Short Wait
          </button>
          {isFetching && (
            <span className="text-xs text-primary-600 animate-pulse ml-auto">Updating...</span>
          )}
        </div>
      </div>

      {/* Salons Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : processedSalons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-mist">
          <Store className="h-12 w-12 mx-auto text-ink-soft/40 mb-3" />
          <h3 className="text-lg font-bold text-ink">No salons found</h3>
          <p className="text-sm text-ink-soft mt-1">Try clearing your search terms or filters.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearch('');
              setSelectedCity('all');
              setAvailabilityFilter('all');
              setPage(1);
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedSalons.map((salon) => (
              <Card
                key={salon.id}
                hover
                className="overflow-hidden flex flex-col justify-between border-mist transition-all duration-300"
              >
                <div>
                  {/* Image Cover */}
                  <div className="relative h-48 w-full bg-mist overflow-hidden group">
                    <img
                      src={salon.imageUrl}
                      alt={salon.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-ink shadow-sm flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-gold-500 fill-gold-500" />
                        {salon.rating}
                        <span className="text-[10px] text-ink-soft font-normal">({salon.reviewCount})</span>
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-ink/80 text-white backdrop-blur-sm">
                        {salon.city}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white shadow-xs">
                        Queue Active
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-ink hover:text-primary-600 transition-colors">
                      <Link to="/salon/$id" params={{ id: salon.id }}>
                        {salon.name}
                      </Link>
                    </h3>

                    <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-1.5">
                      <MapPin className="h-3.5 w-3.5 text-ink-soft shrink-0" />
                      <span>{salon.address}</span>
                    </p>

                    <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-1">
                      <Clock className="h-3.5 w-3.5 text-ink-soft shrink-0" />
                      <span>Open {salon.opening_time} &ndash; {salon.closing_time}</span>
                    </p>

                    {/* Live Queue Box */}
                    <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-mint/60 to-primary-50 border border-primary-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-primary-800 tracking-wider block">
                          Waiting in line
                        </span>
                        <span className="text-lg font-black text-primary-900">
                          {salon.waitingCount} customers
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-primary-800 tracking-wider block">
                          Est. Wait
                        </span>
                        <span className="text-lg font-black text-coral-600 font-mono">
                          {salon.waitMinutes > 0 ? `~${salon.waitMinutes}m` : 'No wait!'}
                        </span>
                      </div>
                    </div>

                    {/* Available Services Sample */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(salon.services || []).slice(0, 3).map((svc: ServiceOut) => (
                        <span
                          key={svc.id}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-mist-light text-ink-soft font-medium border border-mist/80"
                        >
                          {svc.service_name} (${svc.price})
                        </span>
                      ))}
                      {(salon.services?.length || 0) > 3 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded text-ink-soft">
                          +{(salon.services?.length || 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-5 pt-0 flex items-center gap-2">
                  <Link to="/salon/$id" params={{ id: salon.id }} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full justify-center text-xs font-semibold">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 justify-center text-xs font-bold bg-coral-500 hover:bg-coral-600 text-white shadow-sm"
                    onClick={() => openJoinModal(salon)}
                    leftIcon={<Ticket className="h-3.5 w-3.5" />}
                  >
                    Join Queue
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalSalons}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            limitOptions={[3, 6, 9, 12]}
          />
        </div>
      )}

      {/* Quick Join Modal */}
      {joinModalSalon && (
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
                  at <span className="font-bold text-ink">{joinModalSalon.salon_name}</span>
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
                  Quick Join Queue
                </span>
                <h3 className="text-xl font-bold text-ink mt-0.5">{joinModalSalon.salon_name}</h3>
                <p className="text-xs text-ink-soft">{joinModalSalon.address}</p>
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
                  {(joinModalSalon.services || []).map((svc) => (
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
