import { useState } from 'react';
import { z } from 'zod';
import Form from './form/Form';
import FormInput from './form/FormInput';
import { useApi } from '../hooks/useApi';
import { eventService } from '../services/eventService';
import { serviceService } from '../services/serviceService';
import GenericModal from './GenericModal';
import { useInvalidate } from '../hooks/useInvalidate';

const eventSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  description: z.string().optional()
});

const eventDefaults = {
  name: '',
  category: '',
  services: [],
  discount: 0,
  description: ''
};

const EVENT_CATEGORIES = [
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

const EventModal = () => {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const invalidate = useInvalidate();

  const servicesReq = useApi(
    () => serviceService.list({ page: 1, limit: 100 }),
    []
  );

  const createEvent = async (data) => {
    setFormError('');
    setFormSuccess('');
    try {
      const result = await eventService.create({
        name: data.name,
        category: data.category,
        services: (data.services || []).map((id) => ({ serviceId: id })),
        discount: Number(data.discount) || 0,
        description: data.description || ''
      });
      setFormSuccess('Event created successfully');
      invalidate();
      return { success: true, data: result.data };
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create event');
      throw err;
    }
  };

  return (
    <>
      <button
        type="button"
        className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-slate-900"
        onClick={() => setOpen(true)}
      >
        + Add Event
      </button>
      {open && (
        <Form
          schema={eventSchema}
          defaultValues={eventDefaults}
          onSubmit={createEvent}
          className="grid gap-5"
        >
          <GenericModal
            title="+ Add Event"
            onClose={() => setOpen(false)}
            footer={
              <div>
                <button
                  type="submit"
                  className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Add Event
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
            {formSuccess ? <p className="text-sm text-emerald-600">{formSuccess}</p> : null}
          </GenericModal>
        </Form>
      )}
    </>
  );
};

export default EventModal;
