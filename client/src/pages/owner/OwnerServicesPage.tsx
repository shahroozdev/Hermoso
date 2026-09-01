import { useState } from 'react';
import { serviceService } from '../../services/serviceService';
import ServiceModal, { ServiceFormModal, type ServiceRecord } from '@/components/ServiceModal';
import ActionsMenu from '@/components/ActionsMenu';
import TABLE from "@/components/table";
import { useInvalidate } from '@/hooks/useInvalidate';

interface ServiceItem extends ServiceRecord {
  name?: string;
  category?: string;
  categoryId?: { name?: string };
  duration?: number;
  price?: number;
}

const OwnerServicesPage = () => {
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const invalidate = useInvalidate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Services</h2>
        <ServiceModal />
      </div>
      <TABLE<ServiceItem>
        title="Services List"
        showPagination
        queryKey={["owner-services"]}
        service={serviceService.list}
        columns={[
          { title: 'Name' },
          { title: 'Category' },
          { title: 'Duration' },
          { title: 'Price' },
          { title: 'Actions' },
        ]}
        rows={(data) =>
          data?.map((item) => [
            item.name,
            item.category || item.categoryId?.name || '-',
            item.duration ? `${item.duration} min` : '-',
            item.price != null ? `$${item.price}` : '-',
            <ActionsMenu
              items={[
                { label: 'Edit', onClick: () => setEditingService(item) },
              ]}
            />,
          ])
        }
      />

      {editingService && (
        <ServiceFormModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSaved={() => invalidate(["owner-services"])}
        />
      )}
    </div>
  );
};

export default OwnerServicesPage;
