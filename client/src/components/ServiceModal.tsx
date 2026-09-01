import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import Form from './form/Form';
import FormInput from './form/FormInput';
import { useApi } from '../hooks/useApi';
import { serviceService } from '../services/serviceService';
import { categoryService, type CategoryRecord } from '../services/categoryService';
import GenericModal from './GenericModal';
import { useInvalidate } from '../hooks/useInvalidate';

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  description: z.string().optional(),
  aiScanLink: z.string().optional()
});

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters')
});

// CR-24: AI Scan categories that services can be linked to
const AI_SCAN_CATEGORIES = [
  { value: '', label: 'Not linked to AI scan' },
  { value: 'skin-tone', label: 'Skin Tone & Tanning' },
  { value: 'eyebrows', label: 'Eyebrow Treatments' },
  { value: 'hydration', label: 'Hydration & Texture' },
  { value: 'dark-circles', label: 'Dark Circles Treatment' },
  { value: 'acne', label: 'Acne Treatment' },
  { value: 'lip-pigmentation', label: 'Lip Pigmentation Treatment' },
  { value: 'general-facial', label: 'General Facial Treatment' }
];

export interface ServiceRecord {
  _id: string;
  name?: string;
  categoryId?: string | { _id?: string; name?: string };
  duration?: number;
  price?: number;
  description?: string;
  aiScanLink?: string;
  salonId?: string;
}

const resolveCategoryId = (service?: ServiceRecord | null) => {
  if (!service?.categoryId) return '';
  if (typeof service.categoryId === 'object') return service.categoryId._id || '';
  return service.categoryId;
};

export const ServiceFormModal = ({
  salonId,
  service,
  onClose,
  onSaved,
}: {
  salonId?: string;
  service?: ServiceRecord | null;
  onClose: () => void;
  onSaved?: () => void;
}) => {
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(resolveCategoryId(service));
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const invalidate = useInvalidate();
  const isEditing = !!service;

  const categoriesReq = useApi(() => categoryService.list(), [categoryRefreshKey]);
  const categories: CategoryRecord[] = categoriesReq.data?.data || [];

  const serviceDefaultValues = {
    name: service?.name || '',
    categoryId: selectedCategoryId,
    duration: service?.duration ?? 30,
    price: service?.price ?? 0,
    description: service?.description || '',
    aiScanLink: service?.aiScanLink || ''
  };

  const saveService = async (data) => {
    setFormError('');
    setFormSuccess('');
    try {
      const payload = {
        name: data.name,
        categoryId: data.categoryId,
        duration: Number(data.duration),
        price: Number(data.price),
        description: data.description || '',
        aiScanLink: data.aiScanLink || ''
      };
      const result = isEditing
        ? await serviceService.update(service!._id, payload)
        : await serviceService.create({ ...payload, ...(salonId ? { salonId } : {}) });
      setFormSuccess(isEditing ? 'Service updated successfully' : 'Service created successfully');
      invalidate();
      onSaved?.();
      if (!isEditing) {
        setSelectedCategoryId(data.categoryId);
      } else {
        onClose();
      }
      return { success: true, data: result.data };
    } catch (err) {
      setFormError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} service`);
      throw err;
    }
  };

  const createCategory = async (data) => {
    setCategoryError('');
    try {
      const result = await categoryService.create({ name: data.name });
      setSelectedCategoryId(result.data._id);
      setCategoryRefreshKey((value) => value + 1);
      setCategoryModalOpen(false);
      return result;
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Failed to create category');
      throw err;
    }
  };

  return (
    <>
      <Form
        key={selectedCategoryId || 0}
        schema={serviceSchema}
        defaultValues={serviceDefaultValues}
        onSubmit={saveService}
        className="grid gap-5"
      >
        <GenericModal
          title={isEditing ? 'Edit Service' : '+ Add Service'}
          onClose={onClose}
          footer={
            <div>
              <button
                type="submit"
                className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900"
              >
                Save
              </button>
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <FormInput
              name="name"
              label="Service Name"
              placeholder="e.g. Hair Cut"
              required
            />
            <CategoryPicker
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCreateClick={() => setCategoryModalOpen(true)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FormInput
              name="duration"
              type="number"
              label="Duration (minutes)"
              required
            />
            <FormInput
              name="price"
              type="number"
              label="Price"
              required
            />
            <FormInput
              name="description"
              label="Description"
              placeholder="Optional description"
            />
          </div>

          {/* CR-24: AI Scan Link */}
          <AiScanLinkPicker />

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          {formSuccess ? <p className="text-sm text-emerald-600">{formSuccess}</p> : null}
        </GenericModal>
      </Form>

      {categoryModalOpen && (
        <Form
          schema={categorySchema}
          defaultValues={{ name: '' }}
          onSubmit={createCategory}
        >
          <GenericModal
            title="+ Create Category"
            onClose={() => {
              setCategoryError('');
              setCategoryModalOpen(false);
            }}
            footer={
              <>
                <button
                  type="button"
                  className="ha-btn-secondary"
                  onClick={() => {
                    setCategoryError('');
                    setCategoryModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border bg-[var(--accent-2)] border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Save
                </button>
              </>
            }
          >
            {categoryError ? <div className="ha-error-banner">{categoryError}</div> : null}
            <FormInput
              name="name"
              label="Category Name"
              placeholder="e.g. Hair"
              required
            />
          </GenericModal>
        </Form>
      )}
    </>
  );
};

const ServiceModal = ({ salonId }: { salonId?: string } = {}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-slate-900"
        onClick={() => setOpen(true)}
      >
        + Add Service
      </button>
      {open && (
        <ServiceFormModal salonId={salonId} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

const AiScanLinkPicker = () => {
  const { register } = useFormContext();

  return (
    <div className="ha-form-group" data-field="aiScanLink">
      <label htmlFor="aiScanLink">AI Scan Link (Optional)</label>
      <select
        id="aiScanLink"
        className="ha-input"
        {...register('aiScanLink')}
      >
        {AI_SCAN_CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      <div className="ha-form-hint" style={{ marginTop: 6 }}>
        Link this service to AI skin scan results to help customers find it
      </div>
    </div>
  );
};

const CategoryPicker = ({ categories, selectedCategoryId, onCreateClick }) => {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  return (
    <div className="ha-form-group" data-field="categoryId">
      <label htmlFor="categoryId">
        Category <span className="ha-req-mark">*</span>
      </label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <select
          id="categoryId"
          className="ha-input"
          style={{ flex: 1 }}
          {...register('categoryId')}
        >
          <option value="">
            {categories.length ? 'Select category' : 'No categories available'}
          </option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-xl border bg-[var(--accent-2)] border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900"
          style={{ minWidth: 48, paddingInline: 0, alignSelf: 'end' }}
          onClick={onCreateClick}
          aria-label="Create category"
          title="Create category"
        >
          +
        </button>
      </div>
      {selectedCategoryId ? (
        <div className="ha-form-hint" style={{ marginTop: 6 }}>
          New categories can be created inline.
        </div>
      ) : null}
      {errors.categoryId ? (
        <span className="ha-field-error">{errors.categoryId.message as string}</span>
      ) : null}
    </div>
  );
};

export default ServiceModal;
