import { useState } from 'react';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button, Card, Modal, Input, Textarea, ConfirmDialog, Pagination } from '@/components/ui';
import {
  useSalons,
  useSalonServices,
  useAddService,
  useUpdateService,
  useDeleteService,
} from '@/hooks/useQueue';
import type { ServiceOut } from '@/api';
import { toast } from 'react-toastify';

export function AdminServicesPage() {
  const { data: salonsData } = useSalons({ limit: 1 });
  const salon = salonsData?.items?.[0];
  const currentSalonId = salon?.id || '';

  const { data: services = [], isLoading } = useSalonServices(currentSalonId);
  const addServiceMutation = useAddService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOut | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(35);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; service: ServiceOut | null }>({
    open: false,
    service: null,
  });

  const totalServices = services.length;
  const totalPages = Math.max(1, Math.ceil(totalServices / limit));
  const displayedServices = services.slice((page - 1) * limit, page * limit);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDurationMinutes(25);
    setPrice(30);
    setDescription('');
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (svc: ServiceOut) => {
    setEditingService(svc);
    setName(svc.service_name);
    setDurationMinutes(svc.duration_minutes);
    setPrice(Number(svc.price));
    setDescription(svc.description || '');
    setActive(svc.is_available);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a service name.');
      return;
    }
    if (!currentSalonId) return;

    try {
      if (editingService) {
        await updateServiceMutation.mutateAsync({
          salonId: currentSalonId,
          serviceId: editingService.id,
          service: {
            service_name: name.trim(),
            duration_minutes: Number(durationMinutes) || 20,
            price: Number(price) || 25,
            description: description.trim(),
            is_available: active,
          },
        });
      } else {
        await addServiceMutation.mutateAsync({
          salonId: currentSalonId,
          service: {
            service_name: name.trim(),
            duration_minutes: Number(durationMinutes) || 20,
            price: Number(price) || 25,
            description: description.trim(),
            is_available: active,
          },
        });
      }
      setModalOpen(false);
    } catch {
      // handled in mutation
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.service || !currentSalonId) return;
    try {
      await deleteServiceMutation.mutateAsync({
        salonId: currentSalonId,
        serviceId: deleteDialog.service.id,
      });
      setDeleteDialog({ open: false, service: null });
    } catch {
      // handled
    }
  };

  const handleToggleActive = async (svc: ServiceOut) => {
    if (!currentSalonId) return;
    try {
      await updateServiceMutation.mutateAsync({
        salonId: currentSalonId,
        serviceId: svc.id,
        service: { is_available: !svc.is_available },
      });
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-mist pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
            Menu &amp; Pricing Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-ink mt-2">
            Salon Services
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Configure available grooming options, service duration timers, and customer prices.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs sm:text-sm shadow-md"
          onClick={openAddModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add New Service
        </Button>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-ink-soft">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-mist p-6">
          <Scissors className="h-8 w-8 mx-auto text-ink-soft/40 mb-2" />
          <p className="font-bold text-ink">No services configured yet</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={openAddModal}>
            Add First Service
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedServices.map((svc) => (
              <Card
                key={svc.id}
                hover
                className={`p-5 flex flex-col justify-between border-mist transition-all ${
                  !svc.is_available ? 'opacity-60 bg-mist-light/50' : 'bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-ink">{svc.service_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-primary-700 bg-mint px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {svc.duration_minutes} mins
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            svc.is_available
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-mist text-ink-soft'
                          }`}
                        >
                          {svc.is_available ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-ink">${svc.price}</span>
                  </div>

                  <p className="text-xs text-ink-soft leading-relaxed min-h-[36px]">
                    {svc.description || 'Standard salon styling service.'}
                  </p>
                </div>

                {/* Service Controls */}
                <div className="pt-4 mt-3 border-t border-mist/70 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(svc)}
                    className={`font-semibold hover:underline ${
                      svc.is_available ? 'text-ink-soft' : 'text-primary-700 font-bold'
                    }`}
                  >
                    {svc.is_available ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs font-semibold"
                      onClick={() => openEditModal(svc)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-danger-600 hover:bg-danger-50"
                      onClick={() => setDeleteDialog({ open: true, service: svc })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalServices}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            limitOptions={[3, 6, 12]}
          />
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <Modal open={true} onClose={() => setModalOpen(false)} size="md">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="border-b border-mist pb-3">
              <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                {editingService ? 'Edit Existing Service' : 'Add New Service'}
              </span>
              <h3 className="text-xl font-bold text-ink mt-0.5">
                {editingService ? editingService.service_name : 'Create Service Item'}
              </h3>
            </div>

            <Input
              label="Service Name"
              placeholder="e.g. Skin Fade &amp; Line-up"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Duration (Minutes)"
                type="number"
                min={5}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
              <Input
                label="Price ($ USD)"
                type="number"
                min={0}
                step={0.5}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>

            <Textarea
              label="Description (Optional)"
              placeholder="Detail what this grooming service includes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-mist"
              />
              <label htmlFor="active" className="text-xs font-bold text-ink cursor-pointer">
                Available for customer queue join
              </label>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                type="button"
                className="flex-1"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1 bg-coral-500 hover:bg-coral-600 text-white font-bold"
                loading={addServiceMutation.isPending || updateServiceMutation.isPending}
              >
                {editingService ? 'Save Changes' : 'Create Service'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, service: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Service Item?"
        message={`Are you sure you want to delete "${deleteDialog.service?.service_name}"? Existing active queue tokens will still retain their price and duration snapshots.`}
        confirmLabel="Yes, Delete Service"
        variant="danger"
        loading={deleteServiceMutation.isPending}
      />
    </div>
  );
}
