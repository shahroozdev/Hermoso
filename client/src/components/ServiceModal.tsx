import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import Form from './form/Form';
import FormInput from './form/FormInput';
import { useApi } from '../hooks/useApi';
import { serviceService } from '../services/serviceService';
import { categoryService, type CategoryRecord } from '../services/categoryService';
import GenericModal from './GenericModal';
import { useNavigate } from 'react-router-dom';

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

const ServiceModal = () => {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const navigate = useNavigate();

  const categoriesReq = useApi(() => categoryService.list(), [categoryRefreshKey]);

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
      setSelectedCategoryId(data.categoryId);
      navigate(0);
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
        <Form
          key={selectedCategoryId || 0}
          schema={serviceSchema}
          defaultValues={serviceDefaultValues}
          onSubmit={createService}
          className="grid gap-5"
        >
          <GenericModal
            title="+ Add Service"
            onClose={() => setOpen(false)}
            footer={
              <div>
                <button
                  type="submit"
                  className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Add Service
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

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            {formSuccess ? <p className="text-sm text-emerald-600">{formSuccess}</p> : null}

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
          </GenericModal>
        </Form>
      )}
    </>
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
