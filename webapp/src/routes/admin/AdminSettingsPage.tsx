import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useSalons, useUpdateSalon } from '@/hooks/useQueue';
import { toast } from 'react-toastify';

export function AdminSettingsPage() {
  const { data: salonsData } = useSalons({ limit: 1 });
  const salon = salonsData?.items?.[0];
  const currentSalonId = salon?.id || '';

  const updateSalonMutation = useUpdateSalon();

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('19:00');
  const [isQueueActive, setIsQueueActive] = useState(true);

  // Load salon data into form
  useEffect(() => {
    if (salon) {
      setName(salon.salon_name);
      setAddress(salon.address);
      setCity(salon.city);
      setPhone(salon.phone);
      setOpenTime(salon.opening_time ? salon.opening_time.slice(0, 5) : '09:00');
      setCloseTime(salon.closing_time ? salon.closing_time.slice(0, 5) : '19:00');
      setIsQueueActive(salon.is_active);
    }
  }, [salon]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      toast.warning('Please fill in the salon name, address, and phone number.');
      return;
    }
    if (!currentSalonId) return;

    try {
      await updateSalonMutation.mutateAsync({
        id: currentSalonId,
        data: {
          salon_name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          phone: phone.trim(),
          opening_time: openTime.length === 5 ? `${openTime}:00` : openTime,
          closing_time: closeTime.length === 5 ? `${closeTime}:00` : closeTime,
          is_active: isQueueActive,
        },
      });
      toast.success('Salon configuration successfully updated!');
    } catch {
      // handled in mutation
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-mist pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
            Salon Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-ink mt-2">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Manage your barbershop profile, business hours, and queue capacity controls.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="p-6 border-mist space-y-4">
          <div className="border-b border-mist pb-3">
            <h2 className="text-base font-bold text-ink">Barbershop Profile</h2>
            <p className="text-xs text-ink-soft">
              This info is displayed to customers on the landing page and salon directory.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Salon Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Business Phone Contact"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Section 2: Hours & Schedule */}
        <Card className="p-6 border-mist space-y-4">
          <div className="border-b border-mist pb-3">
            <h2 className="text-base font-bold text-ink">Operating Schedule</h2>
            <p className="text-xs text-ink-soft">
              Controls when customers can take digital tokens and join the queue.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Opening Time"
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              required
            />

            <Input
              label="Closing Time"
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="queue-active"
              checked={isQueueActive}
              onChange={(e) => setIsQueueActive(e.target.checked)}
              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-mist"
            />
            <label htmlFor="queue-active" className="text-xs font-bold text-ink cursor-pointer">
              Digital Queue is currently OPEN for customer walk-ins
            </label>
          </div>
        </Card>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-6 shadow-md"
            loading={updateSalonMutation.isPending}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
