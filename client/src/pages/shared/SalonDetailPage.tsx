import { useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import TABLE from '@/components/table';
import { useApi } from '../../hooks/useApi';
import { salonService } from '../../services/salonService';
import { serviceService } from '../../services/serviceService';
import { categoryService } from '../../services/categoryService';

interface ServiceItem {
  name?: string;
  category?: string;
  categoryId?: { name?: string };
  duration?: number;
  price?: number;
}

const SalonDetailPage = () => {
  const { id } = useParams();
  const [categoryId, setCategoryId] = useState('');
  const salon = useApi(() => salonService.getById(id), [id]);
  const categories = useApi(() => categoryService.list(), []);

  if (salon.loading || categories.loading) return <LoadingBlock text="Loading salon details..." />;
  if (salon.error) return <ErrorBlock text={salon.error} />;
  if (categories.error) return <ErrorBlock text={categories.error} />;

  const s = salon.data?.data;
  const categoryOptions = categories.data?.data || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="shell-panel rounded-2xl p-6">
        <h2 className="text-2xl font-semibold">{s.name}</h2>
        <p className="mt-2 text-slate-600">{s.description || 'No description available.'}</p>
        <p className="mt-2 text-sm text-slate-500">{s.address}</p>
      </div>
      <div className="shell-panel rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-end">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Filter by Category
            </label>
            <select
              className="w-full rounded border p-2"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <TABLE<ServiceItem>
        service={serviceService.list}
        serviceParams={{ salonId: id, categoryId: categoryId || undefined }}
        columns={[{ title: 'Service' }, { title: 'Category' }, { title: 'Duration' }, { title: 'Price' }]}
        rows={(data) =>
          data?.map((item) => [item.name, item.category || item.categoryId?.name || '-', `${item.duration} min`, `$${item.price}`])
        }
      />
    </div>
  );
};

export default SalonDetailPage;

