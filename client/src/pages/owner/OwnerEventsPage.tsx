import { eventService } from '../../services/eventService';
import EventModal from '@/components/EventModal';
import TABLE from "@/components/table";

interface EventItem {
  name?: string;
  category?: string;
  services?: { serviceName?: string }[];
  totalPrice?: number;
  finalPrice?: number;
  discount?: number;
  totalDuration?: number;
}

const OwnerEventsPage = () => {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Events</h2>
        <EventModal />
      </div>
      <TABLE<EventItem>
        title="Events List"
        showPagination
        service={eventService.list}
        columns={[
          { title: 'Name' },
          { title: 'Category' },
          { title: 'Services' },
          { title: 'Duration' },
          { title: 'Price' },
          { title: 'Discount' },
          { title: 'Final Price' }
        ]}
        rows={(data) =>
          data?.map((item) => [
            item.name,
            item.category ? item.category.replace(/_/g, ' ') : '-',
            (item.services || []).map((s) => s.serviceName).join(', ') || '-',
            item.totalDuration ? `${item.totalDuration} min` : '-',
            item.totalPrice != null ? `$${item.totalPrice}` : '-',
            item.discount ? `${item.discount}%` : '-',
            item.finalPrice != null ? `$${item.finalPrice}` : '-'
          ])
        }
      />
    </div>
  );
};

export default OwnerEventsPage;
