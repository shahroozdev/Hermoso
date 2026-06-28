import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import DataTable from '../../components/DataTable';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import Form from '../../components/Form';
import FormInput from '../../components/FormInput';
import { useApi } from '../../hooks/useApi';
import { serviceService } from '../../services/serviceService';
import { categoryService, type CategoryRecord } from '../../services/categoryService';
import GenericModal from '@/components/GenericModal';

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  description: z.string().optional()
});

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters')
});

const serviceDefaults = {
  name: '',
  categoryId: '',
  duration: 30,
  price: 0,
  description: ''
};

const OwnerServicesPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [serviceFormKey, setServiceFormKey] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const servicesReq = useApi(() => serviceService.list({ page: 1, limit: 50 }), [refreshKey]);
  const categoriesReq = useApi(() => categoryService.list(), [categoryRefreshKey]);

  useEffect(() => {
    if (selectedCategoryId) {
      setServiceFormKey((value) => value + 1);
    }
  }, [selectedCategoryId]);

  const categories: CategoryRecord[] = categoriesReq.data?.data || [];
  const serviceDefaultValues = {
    ...serviceDefaults,
    categoryId: selectedCategoryId || serviceDefaults.categoryId
  };

  const createService = async (data) => {
    setFormError('');
    setFormSuccess('');
    try {
      const result = await serviceService.create({
        name: data.name,
        categoryId: data.categoryId,
        duration: Number(data.duration),
        price: Number(data.price),
        description: data.description || ''
      });
      setFormSuccess('Service created successfully');
      setRefreshKey((value) => value + 1);
      setSelectedCategoryId(data.categoryId);
      setServiceFormKey((value) => value + 1);
      return { success: true, data: result.data };
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create service');
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

  // if (servicesReq.loading || categoriesReq.loading) return <LoadingBlock text="Loading services..." />;
  if (servicesReq.error) return <ErrorBlock text={servicesReq.error} />;
  if (categoriesReq.error) return <ErrorBlock text={categoriesReq.error} />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Services</h2>
      <div className="shell-panel rounded-2xl p-4">
        <Form
          key={serviceFormKey}
          schema={serviceSchema}
          defaultValues={serviceDefaultValues}
          onSubmit={createService}
          className="grid gap-4"
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

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          {formSuccess ? <p className="text-sm text-emerald-600">{formSuccess}</p> : null}

          <div>
            <button type="submit" className="rounded-xl border bg-[var(--accent-2)] border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900">Add Service</button>
          </div>
        </Form>
      </div>

      <DataTable
      loading={servicesReq.loading}
        columns={['Name', 'Category', 'Duration', 'Price']}
        rows={(servicesReq.data?.data || []).map((item) => [item.name, item.category || item.categoryId?.name || '-', `${item.duration} min`, `$${item.price}`])}
      />

      {categoryModalOpen ? (
        <CreateCategoryModal
          error={categoryError}
          onClose={() => {
            setCategoryError('');
            setCategoryModalOpen(false);
          }}
          onSubmit={createCategory}
        />
      ) : null}
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

const CreateCategoryModal = ({ error, onClose, onSubmit }) => {
  return (
    <Form
      schema={categorySchema}
      defaultValues={{ name: '' }}
      onSubmit={onSubmit}
    >
      <GenericModal
        title="+ Create Category"
        onClose={onClose}
        footer={
          <>
            <button type="button" className="ha-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rounded-xl border bg-[var(--accent-2)] border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900">
              Save
            </button>
          </>
        }
      >
        <>
          {error ? <div className="ha-error-banner">{error}</div> : null}
          <FormInput
            name="name"
            label="Category Name"
            placeholder="e.g. Hair"
            required
          />
        </>
      </GenericModal>
    </Form>
  );
};

export default OwnerServicesPage;
