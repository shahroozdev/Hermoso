import { useState } from 'react';
import { serviceService } from '../../services/serviceService';
import ServiceModal, { ServiceFormModal, AI_SCAN_CATEGORIES, type ServiceRecord } from '@/components/ServiceModal';
import ActionsMenu from '@/components/ActionsMenu';
import TABLE from "@/components/table";
import { useInvalidate } from '@/hooks/useInvalidate';
import { useToastStore } from '@/store/toastStore';
import { formatMoney } from '@/utils/money';

interface ServiceItem extends ServiceRecord {
  name?: string;
  category?: string;
  categoryId?: { name?: string };
  duration?: number;
  priceInPaisa?: number;
}

const aiScanLabel = (value?: string) => AI_SCAN_CATEGORIES.find((c) => c.value === value)?.label || "-";

const OwnerServicesPage = () => {
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();

  const handleDeleteService = async (service: ServiceItem) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    try {
      await serviceService.delete(service._id);
      showToast("Service deleted successfully.");
      invalidate(["owner-services"]);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete service", "error");
    }
  };

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
          { title: 'Description', size: '220px' },
          { title: 'AI Scan' },
          { title: 'Actions' },
        ]}
        rows={(data) =>
          data?.map((item) => [
            item.name,
            item.category || item.categoryId?.name || '-',
            item.duration ? `${item.duration} min` : '-',
            item.priceInPaisa != null ? formatMoney(item.priceInPaisa) : '-',
            item.description || '-',
            aiScanLabel(item.aiScanLink),
            <ActionsMenu
              items={[
                { label: 'Edit', onClick: () => setEditingService(item) },
                { label: 'Delete', danger: true, onClick: () => handleDeleteService(item) },
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
