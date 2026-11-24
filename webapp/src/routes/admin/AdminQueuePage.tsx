import { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Plus,
  Clock,
  Search,
  Ticket,
  Phone,
} from 'lucide-react';
import type { TokenStatus } from '@/data/types';
import {
  Button,
  Card,
  StatusBadge,
  Modal,
  Input,
  ConfirmDialog,
  EmptyState,
  Pagination,
} from '@/components/ui';
import {
  useSalons,
  useStaffQueueDashboard,
  useSalonQueueEntries,
  useCallNext,
  useStartService,
  useCompleteToken,
  useSkipToken,
  useCancelToken,
  useAddWalkIn,
} from '@/hooks/useQueue';
import { formatRelativeTime } from '@/utils/format';
import type { QueueTokenOut } from '@/api';
import { toast } from 'react-toastify';

export function AdminQueuePage() {
  const { data: salonsData } = useSalons({ limit: 1 });
  const salon = salonsData?.items?.[0];
  const currentSalonId = salon?.id || '';

  const { data: dashboardState } = useStaffQueueDashboard(currentSalonId);

  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'waiting' | 'serving' | 'completed' | 'cancelled'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // TanStack Query paginated queue entries
  const { data: entriesData, isLoading: isLoadingEntries } = useSalonQueueEntries(currentSalonId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm.trim() || undefined,
    page,
    limit,
  });

  const callNextMutation = useCallNext();
  const startServiceMutation = useStartService();
  const completeMutation = useCompleteToken();
  const skipMutation = useSkipToken();
  const cancelMutation = useCancelToken();
  const addWalkInMutation = useAddWalkIn();

  // Modals & confirmation dialogs
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState(salon?.services?.[0]?.id || '');

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'skip' | 'cancel';
    token: QueueTokenOut | null;
  }>({
    open: false,
    type: 'cancel',
    token: null,
  });

  const waitingCount = dashboardState?.total_waiting ?? 0;
  const servingToken = dashboardState?.serving_entry;
  const totalEntries = entriesData?.total ?? 0;
  const totalPages = entriesData?.total_pages ?? 1;
  const displayedTokens = entriesData?.items ?? [];

  // Action handlers
  const handleCallNext = async () => {
    if (!currentSalonId) return;
    try {
      await callNextMutation.mutateAsync({ salonId: currentSalonId });
    } catch {
      // handled
    }
  };

  const handleStartService = async (tokenId: string) => {
    if (!currentSalonId) return;
    try {
      await startServiceMutation.mutateAsync({ salonId: currentSalonId, entryId: tokenId });
    } catch {
      // handled
    }
  };

  const handleComplete = async (tokenId: string) => {
    if (!currentSalonId) return;
    try {
      await completeMutation.mutateAsync({ salonId: currentSalonId, entryId: tokenId });
    } catch {
      // handled
    }
  };

  const openConfirm = (type: 'skip' | 'cancel', token: QueueTokenOut) => {
    setConfirmDialog({ open: true, type, token });
  };

  const handleConfirmAction = async () => {
    const { type, token } = confirmDialog;
    if (!token || !currentSalonId) return;
    try {
      if (type === 'skip') {
        await skipMutation.mutateAsync({ salonId: currentSalonId, entryId: token.id });
      } else {
        await cancelMutation.mutateAsync({ salonId: currentSalonId, entryId: token.id });
      }
      setConfirmDialog({ open: false, type: 'cancel', token: null });
    } catch {
      // handled
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInPhone.trim()) {
      toast.warning('Please enter customer name and phone.');
      return;
    }
    const serviceToUse = walkInServiceId || salon?.services?.[0]?.id;
    if (!serviceToUse || !currentSalonId) {
      toast.warning('Please select a service.');
      return;
    }

    try {
      await addWalkInMutation.mutateAsync({
        salonId: currentSalonId,
        data: {
          customer_name: walkInName.trim(),
          customer_phone: walkInPhone.trim(),
          service_id: serviceToUse,
        },
      });
      setWalkInModalOpen(false);
      setWalkInName('');
      setWalkInPhone('');
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Call Next Main Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-mist pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
            Live Queue Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-ink mt-2">
            Queue Control Station
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Manage customer tokens, seat walk-ins, and advance queues in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            className="text-xs sm:text-sm font-bold border-primary-300 text-primary-800 hover:bg-mint"
            onClick={() => {
              setWalkInServiceId(salon?.services?.[0]?.id || '');
              setWalkInModalOpen(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Walk-in Customer
          </Button>

          <Button
            variant="primary"
            size="lg"
            className="bg-coral-500 hover:bg-coral-600 text-white font-extrabold text-sm sm:text-base px-6 shadow-lg shadow-coral-500/30 active:scale-95 transition-all"
            onClick={handleCallNext}
            loading={callNextMutation.isPending}
            disabled={waitingCount === 0}
            leftIcon={<Play className="h-5 w-5 fill-white" />}
          >
            Call Next Customer
          </Button>
        </div>
      </div>

      {/* 4 Stats Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => {
            setStatusFilter('waiting');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'waiting'
              ? 'bg-gold-50 border-gold-400 ring-2 ring-gold-400 shadow-xs'
              : 'bg-white border-mist hover:border-gold-300'
          }`}
        >
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">
            Waiting in Line
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{waitingCount}</span>
            <span className="text-xs text-ink-soft font-semibold">in queue</span>
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('serving');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'serving'
              ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500 shadow-xs'
              : 'bg-white border-mist hover:border-primary-300'
          }`}
        >
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">
            Currently Serving
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary-700">{servingToken ? 1 : 0}</span>
            <span className="text-xs text-ink-soft font-semibold">in chair</span>
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('completed');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'completed'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
              : 'bg-white border-mist hover:border-emerald-300'
          }`}
        >
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">
            Completed View
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">Finished</span>
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-primary-50 border-primary-600 ring-2 ring-primary-600 shadow-xs'
              : 'bg-white border-mist hover:border-primary-300'
          }`}
        >
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">
            Total Logged
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary-900">{totalEntries}</span>
            <span className="text-xs text-ink-soft font-semibold">records</span>
          </div>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-mist shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            placeholder="Search by customer name, phone, #token..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-mist text-xs sm:text-sm text-ink focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => {
              setStatusFilter('active');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-mist-light text-ink hover:bg-mist'
            }`}
          >
            Active Tokens
          </button>
          <button
            onClick={() => {
              setStatusFilter('waiting');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'waiting'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-mist-light text-ink hover:bg-mist'
            }`}
          >
            Waiting ({waitingCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-mist-light text-ink hover:bg-mist'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Queue Content: Desktop Table + Mobile Cards */}
      {isLoadingEntries ? (
        <div className="py-16 text-center text-sm text-ink-soft">Loading queue entries...</div>
      ) : displayedTokens.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-8 w-8" />}
          title="No customers in this view"
          description="There are currently no tokens matching your filter. Use 'Add Walk-in Customer' above to check in a client."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setWalkInServiceId(salon?.services?.[0]?.id || '');
                setWalkInModalOpen(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add First Customer
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-mist shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-mist bg-mist-light/70 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                  <th className="py-3.5 px-4">Token #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service &amp; Time</th>
                  <th className="py-3.5 px-4">Joined Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist text-sm">
                {displayedTokens.map((tok) => {
                  const statusUpper = tok.status.toUpperCase();
                  const isServ = statusUpper === 'SERVING' || statusUpper === 'CALLED';
                  const isWait = statusUpper === 'WAITING';

                  return (
                    <tr
                      key={tok.id}
                      className={`hover:bg-mist-light/50 transition-colors ${
                        isServ ? 'bg-mint/20 font-medium' : ''
                      }`}
                    >
                      {/* Token # */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="h-9 w-9 rounded-xl bg-primary-100 text-primary-900 font-mono font-black text-sm flex items-center justify-center border border-primary-200">
                            #{tok.token_number}
                          </span>
                        </div>
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-ink">{tok.customer_name}</p>
                          {tok.customer_phone && (
                            <p className="text-xs text-ink-soft font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-ink-soft" />
                              {tok.customer_phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Service & Duration */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-ink">{tok.service_name || 'Haircut'}</p>
                          <span className="text-xs text-primary-700 bg-mint px-2 py-0.5 rounded font-bold">
                            {tok.estimated_duration} mins
                          </span>
                        </div>
                      </td>

                      {/* Joined Time */}
                      <td className="py-3.5 px-4 text-xs text-ink-soft">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatRelativeTime(tok.joined_at)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={tok.status.toLowerCase() as TokenStatus} />
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isWait && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 h-8"
                                onClick={() => handleStartService(tok.id)}
                                loading={startServiceMutation.isPending}
                              >
                                Start Service
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs font-semibold px-2.5 py-1 h-8 text-amber-700 hover:bg-amber-50"
                                onClick={() => openConfirm('skip', tok)}
                              >
                                Skip
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs font-semibold px-2 py-1 h-8 text-danger-600 hover:bg-danger-50"
                                onClick={() => openConfirm('cancel', tok)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}

                          {isServ && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1 h-8 shadow-sm"
                                onClick={() => handleComplete(tok.id)}
                                loading={completeMutation.isPending}
                                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                              >
                                Complete Service
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs font-semibold px-2 py-1 h-8 text-danger-600 hover:bg-danger-50"
                                onClick={() => openConfirm('cancel', tok)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}

                          {!isWait && !isServ && (
                            <span className="text-xs text-ink-soft font-semibold">Archived</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {displayedTokens.map((tok) => {
              const statusUpper = tok.status.toUpperCase();
              const isServ = statusUpper === 'SERVING' || statusUpper === 'CALLED';
              const isWait = statusUpper === 'WAITING';

              return (
                <Card
                  key={tok.id}
                  className={`p-4 border-mist space-y-3 ${
                    isServ ? 'border-primary-500 bg-primary-50/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-900 font-mono font-black text-base flex items-center justify-center border border-primary-200">
                        #{tok.token_number}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-sm">{tok.customer_name}</h4>
                        <p className="text-xs text-ink-soft font-mono">{tok.customer_phone}</p>
                      </div>
                    </div>
                    <StatusBadge status={tok.status.toLowerCase() as TokenStatus} />
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y border-mist/70">
                    <div>
                      <span className="text-ink-soft block text-[10px]">Service</span>
                      <span className="font-semibold text-ink">{tok.service_name || 'Haircut'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-ink-soft block text-[10px]">Joined</span>
                      <span className="font-medium text-ink">{formatRelativeTime(tok.joined_at)}</span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {isWait && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          onClick={() => handleStartService(tok.id)}
                        >
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold text-amber-700"
                          onClick={() => openConfirm('skip', tok)}
                        >
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs font-semibold text-danger-600"
                          onClick={() => openConfirm('cancel', tok)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {isServ && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          onClick={() => handleComplete(tok.id)}
                          leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        >
                          Complete Cut
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-danger-600"
                          onClick={() => openConfirm('cancel', tok)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Component */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalEntries}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            limitOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      {/* Add Walk-in Customer Modal */}
      {walkInModalOpen && (
        <Modal open={true} onClose={() => setWalkInModalOpen(false)} size="md">
          <form onSubmit={handleWalkInSubmit} className="space-y-4">
            <div className="border-b border-mist pb-3">
              <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                In-Store Reception
              </span>
              <h3 className="text-xl font-bold text-ink mt-0.5">Add Walk-in Customer</h3>
              <p className="text-xs text-ink-soft">
                Issues a digital token and immediately places customer into queue.
              </p>
            </div>

            <Input
              label="Customer Full Name"
              placeholder="e.g. Samuel Green"
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              required
            />

            <Input
              label="Customer Phone (for notifications)"
              placeholder="+1 (647) 555-0199"
              value={walkInPhone}
              onChange={(e) => setWalkInPhone(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                Select Service
              </label>
              <select
                value={walkInServiceId}
                onChange={(e) => setWalkInServiceId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-btn border border-mist text-sm text-ink bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              >
                {(salon?.services || []).map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.service_name} &ndash; ${svc.price} ({svc.duration_minutes} mins)
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                type="button"
                className="flex-1"
                onClick={() => setWalkInModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1 bg-coral-500 hover:bg-coral-600 text-white font-bold"
                loading={addWalkInMutation.isPending}
              >
                Issue Walk-in Token
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: 'cancel', token: null })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.type === 'skip' ? 'Skip Customer Token?' : 'Cancel Customer Token?'}
        message={
          confirmDialog.type === 'skip'
            ? `Skip #${confirmDialog.token?.token_number} (${confirmDialog.token?.customer_name})? This will move them to skipped status and recalculate wait times.`
            : `Are you sure you want to cancel Token #${confirmDialog.token?.token_number} (${confirmDialog.token?.customer_name})?`
        }
        confirmLabel={confirmDialog.type === 'skip' ? 'Yes, Skip Token' : 'Yes, Cancel Token'}
        variant={confirmDialog.type === 'skip' ? 'primary' : 'danger'}
        loading={skipMutation.isPending || cancelMutation.isPending}
      />
    </div>
  );
}
