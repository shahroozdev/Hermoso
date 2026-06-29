import { serviceService } from '../../services/serviceService';
import ServiceModal from '@/components/ServiceModal';
import TABLE from "@/components/table";

interface ServiceItem {
  name?: string;
  category?: string;
  categoryId?: { name?: string };
  duration?: number;
  price?: number;
}

const OwnerServicesPage = () => {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Services</h2>
        <ServiceModal />
      </div>
      <TABLE<ServiceItem>
        title="Services List"
        showPagination
        service={serviceService.list}
        columns={[{ title: 'Name' }, { title: 'Category' }, { title: 'Duration' }, { title: 'Price' }]}
        rows={(data) =>
          data?.map((item) => [
            item.name,
            item.category || item.categoryId?.name || '-',
            item.duration ? `${item.duration} min` : '-',
            item.price != null ? `$${item.price}` : '-',
          ])
        }
      />
    </div>
  );
};

export default OwnerServicesPage;
