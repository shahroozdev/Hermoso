import { useState } from 'react';
import { eventService } from '../../services/eventService';
import EventModal, { EventFormModal, EVENT_CATEGORIES, type EventRecord } from '@/components/EventModal';
import ActionsMenu from '@/components/ActionsMenu';
import ConfirmModal from '@/components/ConfirmModal';
import SearchableSelect from '@/components/form/SearchableSelect';
import RangeFilter from '@/components/form/RangeFilter';
import TABLE from "@/components/table";
import { useInvalidate } from '@/hooks/useInvalidate';
import { useToastStore } from '@/store/toastStore';
import { formatMoney, rupeesToPaisa } from '@/utils/money';
import { downloadCsv } from '@/utils';

interface EventItem extends EventRecord {
  name?: string;
  category?: string;
  services?: { serviceName?: string }[];
  totalPriceInPaisa?: number;
  finalPriceInPaisa?: number;
  discount?: number;
  totalDuration?: number;
}

const OwnerEventsPage = () => {
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [servicesSearch, setServicesSearch] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [discountMin, setDiscountMin] = useState("");
  const [discountMax, setDiscountMax] = useState("");
  const [finalPriceMin, setFinalPriceMin] = useState("");
  const [finalPriceMax, setFinalPriceMax] = useState("");
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();

  const categoryOptions = [{ value: "all", label: "All Categories" }, ...EVENT_CATEGORIES];

  const hasActiveFilters = Boolean(
    search ||
    categoryFilter !== "all" ||
    servicesSearch ||
    durationMin || durationMax ||
    priceMin || priceMax ||
    discountMin || discountMax ||
    finalPriceMin || finalPriceMax
  );

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setServicesSearch("");
    setDurationMin("");
    setDurationMax("");
    setPriceMin("");
    setPriceMax("");
    setDiscountMin("");
    setDiscountMax("");
    setFinalPriceMin("");
    setFinalPriceMax("");
  };

  const filterParams = {
    search,
    ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
    ...(servicesSearch ? { servicesSearch } : {}),
    ...(durationMin ? { durationMin } : {}),
    ...(durationMax ? { durationMax } : {}),
    ...(priceMin ? { priceMin: rupeesToPaisa(Number(priceMin)) } : {}),
    ...(priceMax ? { priceMax: rupeesToPaisa(Number(priceMax)) } : {}),
    ...(discountMin ? { discountMin } : {}),
    ...(discountMax ? { discountMax } : {}),
    ...(finalPriceMin ? { finalPriceMin: rupeesToPaisa(Number(finalPriceMin)) } : {}),
    ...(finalPriceMax ? { finalPriceMax: rupeesToPaisa(Number(finalPriceMax)) } : {}),
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    try {
      await eventService.delete(deletingEvent._id);
      showToast("Event deleted successfully.");
      invalidate(["owner-events"]);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete event", "error");
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await eventService.list({ limit: 1000, ...filterParams });
      const items: EventItem[] = res?.data || [];
      const rows = [
        ["Name", "Category", "Services", "Duration", "Price", "Discount", "Final Price"],
        ...items.map((item) => [
          item.name || "",
          item.category ? item.category.replace(/_/g, ' ') : "-",
          (item.services || []).map((s) => s.serviceName).join(', ') || "-",
          item.totalDuration ? `${item.totalDuration} min` : "-",
          item.totalPriceInPaisa != null ? (item.totalPriceInPaisa / 100).toFixed(2) : "",
          item.discount ? `${item.discount}%` : "-",
          item.finalPriceInPaisa != null ? (item.finalPriceInPaisa / 100).toFixed(2) : "",
        ]),
      ];
      downloadCsv(`hermoso-events-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to export events", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Events</h2>
        <span style={{ display: "inline-flex", gap: 8 }}>
          <button className="ha-act-btn" onClick={handleExport}>Export</button>
          <EventModal />
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-muted">Name</label>
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 220 }}
            placeholder="Search events by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-muted">Category</label>
          <span style={{ minWidth: 160, display: "inline-block" }}>
            <SearchableSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} />
          </span>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-muted">Services</label>
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 220 }}
            placeholder="Search by service name..."
            value={servicesSearch}
            onChange={(e) => setServicesSearch(e.target.value)}
          />
        </div>
        <RangeFilter label="Duration (min)" min={durationMin} max={durationMax} onMin={setDurationMin} onMax={setDurationMax} />
        <RangeFilter label="Price" min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax} />
        <RangeFilter label="Discount (%)" min={discountMin} max={discountMax} onMin={setDiscountMin} onMax={setDiscountMax} />
        <RangeFilter label="Final Price" min={finalPriceMin} max={finalPriceMax} onMin={setFinalPriceMin} onMax={setFinalPriceMax} />
        {hasActiveFilters && (
          <button type="button" className="ha-btn-secondary" onClick={clearFilters}>Clear Filters</button>
        )}
      </div>

      <TABLE<EventItem>
        title="Events List"
        queryKey={["owner-events"]}
        showPagination
        service={eventService.list}
        serviceParams={filterParams}
        columns={[
          { title: 'Name' },
          { title: 'Category' },
          { title: 'Services' },
          { title: 'Duration' },
          { title: 'Price' },
          { title: 'Discount' },
          { title: 'Final Price' },
          { title: 'Actions' }
        ]}
        rows={(data) =>
          data?.map((item) => [
            item.name,
            item.category ? item.category.replace(/_/g, ' ') : '-',
            (item.services || []).map((s) => s.serviceName).join(', ') || '-',
            item.totalDuration ? `${item.totalDuration} min` : '-',
            item.totalPriceInPaisa != null ? formatMoney(item.totalPriceInPaisa) : '-',
            item.discount ? `${item.discount}%` : '-',
            item.finalPriceInPaisa != null ? formatMoney(item.finalPriceInPaisa) : '-',
            <ActionsMenu
              items={[
                { label: 'Edit', onClick: () => setEditingEvent(item) },
                { label: 'Delete', danger: true, onClick: () => setDeletingEvent(item) },
              ]}
            />,
          ])
        }
      />

      {editingEvent && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => invalidate(["owner-events"])}
        />
      )}

      {deletingEvent && (
        <ConfirmModal
          title="Delete Event"
          message={`Delete "${deletingEvent.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteEvent}
          onCancel={() => setDeletingEvent(null)}
        />
      )}
    </div>
  );
};

export default OwnerEventsPage;
