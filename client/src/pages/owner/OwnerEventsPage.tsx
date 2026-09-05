import { eventService } from '../../services/eventService';
import EventModal from '@/components/EventModal';
import TABLE from "@/components/table";
import { formatMoney } from '@/utils/money';

interface EventItem {
  name?: string;
  category?: string;
  services?: { serviceName?: string }[];
  totalPriceInPaisa?: number;
  finalPriceInPaisa?: number;
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
        queryKey={["owner-events"]}
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
            item.totalPriceInPaisa != null ? formatMoney(item.totalPriceInPaisa) : '-',
            item.discount ? `${item.discount}%` : '-',
            item.finalPriceInPaisa != null ? formatMoney(item.finalPriceInPaisa) : '-'
          ])
        }
      />
    </div>
  );
};

export default OwnerEventsPage;
