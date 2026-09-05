import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import Form from './form/Form';
import FormInput from './form/FormInput';
import SearchableSelect from './form/SearchableSelect';
import { useApi } from '../hooks/useApi';
import { serviceService } from '../services/serviceService';
import { categoryService, type CategoryRecord } from '../services/categoryService';
import GenericModal from './GenericModal';
import { useInvalidate } from '../hooks/useInvalidate';
import { useToastStore } from '../store/toastStore';

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  description: z.string().optional(),
  aiScanLink: z.string().optional()
});

// CR-24: AI Scan categories that services can be linked to
export const AI_SCAN_CATEGORIES = [
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
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(resolveCategoryId(service));
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
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
    setIsSaving(true);
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
      showToast(isEditing ? 'Service updated successfully.' : 'Service created successfully.');
      invalidate();
      onSaved?.();
      onClose();
      return { success: true, data: result.data };
    } catch (err) {
      setFormError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} service`);
      throw err;
    } finally {
      setIsSaving(false);
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
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
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
        </GenericModal>
      </Form>

      {categoryModalOpen && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setCategoryModalOpen(false)}
          onChanged={(newCategoryId) => {
            setCategoryRefreshKey((value) => value + 1);
            if (newCategoryId) setSelectedCategoryId(newCategoryId);
          }}
        />
      )}
    </>
  );
};

const CategoryManagerModal = ({
  categories,
  onClose,
  onChanged,
}: {
  categories: CategoryRecord[];
  onClose: () => void;
  onChanged: (newCategoryId?: string) => void;
}) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError('');
    setBusy(true);
    try {
      const result = await categoryService.create({ name: newName.trim() });
      setNewName('');
      onChanged(result.data._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    setError('');
    setBusy(true);
    try {
      await categoryService.update(id, { name: editingName.trim() });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (category: CategoryRecord) => {
    if (!window.confirm(`Delete category "${category.name}"? Existing services keep it, but it won't be selectable anymore.`)) return;
    setError('');
    setBusy(true);
    try {
      await categoryService.delete(category._id);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GenericModal
      title="Manage Categories"
      onClose={onClose}
      footer={
        <button type="button" className="ha-btn-primary" onClick={onClose}>
          Done
        </button>
      }
    >
      {error ? <div className="ha-error-banner">{error}</div> : null}
      <div className="space-y-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
        {categories.length === 0 ? <p className="text-sm text-muted">No categories yet.</p> : null}
        {categories.map((category) => (
          <div key={category._id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2">
            {editingId === category._id ? (
              <>
                <input
                  className="ha-input flex-1"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                />
                <button type="button" className="ha-btn-secondary" disabled={busy} onClick={() => handleRename(category._id)}>
                  Save
                </button>
                <button type="button" className="ha-btn-secondary" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{category.name}</span>
                <button
                  type="button"
                  className="ha-btn-secondary"
                  onClick={() => {
                    setEditingId(category._id);
                    setEditingName(category.name);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="ha-btn-secondary text-rose-500" disabled={busy} onClick={() => handleDelete(category)}>
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="ha-input flex-1"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="button" className="ha-btn-primary" disabled={busy} onClick={handleCreate}>
          Add
        </button>
      </div>
    </GenericModal>
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
    watch,
    setValue,
    formState: { errors }
  } = useFormContext();
  const categoryId = watch('categoryId');

  return (
    <div className="ha-form-group" data-field="categoryId">
      <label htmlFor="categoryId">
        Category <span className="ha-req-mark">*</span>
      </label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div style={{ flex: 1 }}>
          <SearchableSelect
            value={categoryId || ''}
            onChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
            options={categories.map((category) => ({ value: category._id, label: category.name }))}
            placeholder={categories.length ? 'Select category' : 'No categories available'}
          />
        </div>
        <button
          type="button"
          className="rounded-xl border bg-[var(--accent-2)] border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900"
          style={{ minWidth: 48, paddingInline: 0, alignSelf: 'end' }}
          onClick={onCreateClick}
          aria-label="Manage categories"
          title="Manage categories"
        >
          +
        </button>
      </div>
      {selectedCategoryId ? (
        <div className="ha-form-hint" style={{ marginTop: 6 }}>
          Categories can be created, renamed, or deleted from the + button.
        </div>
      ) : null}
      {errors.categoryId ? (
        <span className="ha-field-error">{errors.categoryId.message as string}</span>
      ) : null}
    </div>
  );
};

export default ServiceModal;
