import { useState } from 'react';
import { z } from 'zod';
import Form from './form/Form';
import FormInput from './form/FormInput';
import { useApi } from '../hooks/useApi';
import { eventService } from '../services/eventService';
import { serviceService } from '../services/serviceService';
import GenericModal from './GenericModal';
import { useInvalidate } from '../hooks/useInvalidate';
import { useToastStore } from '../store/toastStore';

const eventSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  description: z.string().optional()
});

// Event categories are a fixed enum on the server (see EventCategory in
// server/utils/constants.ts) — unrelated to the salon's ad-hoc service
// categories (categoryService), so both the form and the page filter reuse
// this same list rather than fetching categoryService.list().
export const EVENT_CATEGORIES = [
  { label: 'Bridal', value: 'bridal' },
  { label: 'Party', value: 'party' },
  { label: 'Eid', value: 'eid' },
  { label: 'Independence Day', value: 'independence_day' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Engagement', value: 'engagement' },
  { label: 'Anniversary', value: 'anniversary' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Wedding', value: 'wedding' },
  { label: 'Other', value: 'other' }
];

export interface EventRecord {
  _id: string;
  name?: string;
  category?: string;
  description?: string;
  discount?: number;
  services?: { serviceId?: string | { _id?: string; name?: string }; serviceName?: string }[];
  totalPriceInPaisa?: number;
  totalDuration?: number;
  finalPriceInPaisa?: number;
}

const resolveServiceIds = (event?: EventRecord | null): string[] => {
  if (!event?.services) return [];
  return event.services
    .map((s) => (typeof s.serviceId === 'object' ? s.serviceId?._id : s.serviceId))
    .filter((id): id is string => Boolean(id));
};

export const EventFormModal = ({
  event,
  onClose,
  onSaved,
}: {
  event?: EventRecord | null;
  onClose: () => void;
  onSaved?: () => void;
}) => {
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
  const isEditing = !!event;

  const servicesReq = useApi(
    () => serviceService.list({ page: 1, limit: 100 }),
    ["event-modal-services"]
  );

  const eventDefaultValues = {
    name: event?.name || '',
    category: event?.category || '',
    services: resolveServiceIds(event),
    discount: event?.discount ?? 0,
    description: event?.description || ''
  };

  const saveEvent = async (data) => {
    setFormError('');
    setIsSaving(true);
    try {
      const payload = {
        name: data.name,
        category: data.category,
        // Dedupe defensively: the multiselect already prevents picking the same
        // service twice (toggling an already-selected id removes it), but this
        // keeps the payload safe even if that guard is ever bypassed (BUG-144).
        services: Array.from(new Set((data.services || []) as string[])).map((id) => ({ serviceId: id })),
        discount: Number(data.discount) || 0,
        description: data.description || ''
      };
      const result = isEditing
        ? await eventService.update(event!._id, payload)
        : await eventService.create(payload);
      showToast(isEditing ? 'Event updated successfully.' : 'Event created successfully.');
      invalidate(["owner-events"]);
      onSaved?.();
      onClose();
      return { success: true, data: result.data };
    } catch (err) {
      setFormError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form
      schema={eventSchema}
      defaultValues={eventDefaultValues}
      onSubmit={saveEvent}
      className="grid gap-5"
    >
      <GenericModal
        title={isEditing ? 'Edit Event' : '+ Add Event'}
        onClose={onClose}
        footer={
          <div>
            <button
              type="submit"
              className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Add Event'}
            </button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <FormInput
            name="name"
            label="Event Name"
            placeholder="e.g. Bridal Package"
            required
          />
          <FormInput
            name="category"
            label="Category"
            type="select"
            placeholder="Select category"
            required
            options={EVENT_CATEGORIES}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <FormInput
            name="services"
            label="Services"
            type="multiselect"
            required
            options={servicesReq?.data?.data?.map((service) => ({
              label: service.name,
              value: service._id
            }))}
          />
          <FormInput
            name="discount"
            type="number"
            label="Discount %"
            placeholder="0"
          />
          <FormInput
            name="description"
            label="Description"
            placeholder="Optional description"
          />
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      </GenericModal>
    </Form>
  );
};

const EventModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-slate-900"
        onClick={() => setOpen(true)}
      >
        + Add Event
      </button>
      {open && <EventFormModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default EventModal;
