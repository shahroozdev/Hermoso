import { useMemo, useState } from 'react';
import { serviceService } from '../../services/serviceService';
import { categoryService } from '../../services/categoryService';
import ServiceModal, { ServiceFormModal, AI_SCAN_CATEGORIES, type ServiceRecord } from '@/components/ServiceModal';
import ActionsMenu from '@/components/ActionsMenu';
import ConfirmModal from '@/components/ConfirmModal';
import SearchableSelect from '@/components/form/SearchableSelect';
import RangeFilter from '@/components/form/RangeFilter';
import TABLE from "@/components/table";
import { useApi } from '@/hooks/useApi';
import { useInvalidate } from '@/hooks/useInvalidate';
import { useToastStore } from '@/store/toastStore';
import { formatMoney, rupeesToPaisa } from '@/utils/money';
import { downloadCsv, truncateWords } from '@/utils';

interface ServiceItem extends ServiceRecord {
  name?: string;
  category?: string;
  categoryId?: { name?: string };
  duration?: number;
  priceInPaisa?: number;
}

const aiScanLabel = (value?: string) => AI_SCAN_CATEGORIES.find((c) => c.value === value)?.label || "-";

const OwnerServicesPage = () => {
  const [comparisons, setComparisons] = useState<Record<string, string>>({});
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState('');
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [aiScanFilter, setAiScanFilter] = useState("all");
  const [durationMin, setDurationMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();

  const { data: categoriesData } = useApi(() => categoryService.list(), ["owner-service-categories"]);
  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...((categoriesData?.data || []).map((c) => ({ value: c.name, label: c.name }))),
    ],
    [categoriesData],
  );

  const hasActiveFilters = Boolean(
    search || description || categoryFilter !== "all" || aiScanFilter !== "all" || durationMin || durationMax || priceMin || priceMax,
  );

  const clearFilters = () => {
    setComparisons({});
    setSearch("");
    setDescription('');
    setCategoryFilter("all");
    setAiScanFilter("all");
    setDurationMin("");
    setDurationMax("");
    setPriceMin("");
    setPriceMax("");
  };

  const filterParams = {
    ...comparisons,
    search,
    ...(description ? { description } : {}),
    ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
    ...(aiScanFilter !== "all" ? { aiScanLink: aiScanFilter } : {}),
    ...(durationMin ? { durationMin } : {}),
    ...(durationMax ? { durationMax } : {}),
    ...(priceMin ? { priceMin: rupeesToPaisa(Number(priceMin)) } : {}),
    ...(priceMax ? { priceMax: rupeesToPaisa(Number(priceMax)) } : {}),
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    try {
      await serviceService.delete(deletingService._id);
      showToast("Service deleted successfully.");
      invalidate(["owner-services"]);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete service", "error");
    } finally {
      setDeletingService(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await serviceService.list({ limit: 1000, ...filterParams });
      const items: ServiceItem[] = res?.data || [];
      const rows = [
        ["Name", "Category", "Duration", "Price", "Description", "AI Scan"],
        ...items.map((item) => [
          item.name || "",
          item.category || item.categoryId?.name || "-",
          item.duration ? `${item.duration} min` : "-",
          item.priceInPaisa != null ? (item.priceInPaisa / 100).toFixed(2) : "",
          item.description || "-",
          aiScanLabel(item.aiScanLink),
        ]),
      ];
      downloadCsv(`hermoso-services-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to export services", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Services</h2>
        <span style={{ display: "inline-flex", gap: 8 }}>
          <button className="ha-act-btn" onClick={handleExport}>Export</button>
          <ServiceModal />
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          className="ha-input"
          style={{ maxWidth: 220 }}
          placeholder="Search services by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ minWidth: 160, display: "inline-block" }}>
          <SearchableSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} />
        </span>
        <span style={{ minWidth: 160, display: "inline-block" }}>
          <SearchableSelect
            value={aiScanFilter}
            onChange={setAiScanFilter}
            options={[{ value: "all", label: "All AI Scan Links" }, ...AI_SCAN_CATEGORIES]}
          />
        </span>
        <RangeFilter operator={comparisons.durationOp} onOperator={op => setComparisons(prev => ({...prev, durationOp: op}))} label="Duration (min)" min={durationMin} max={durationMax} onMin={setDurationMin} onMax={setDurationMax} />
        <input className="ha-input" style={{maxWidth:220}} aria-label="Service description" placeholder="Search description..." value={description} onChange={e => setDescription(e.target.value)} />
        <RangeFilter operator={comparisons.priceOp} onOperator={op => setComparisons(prev => ({...prev, priceOp: op}))} label="Price" min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax} />
        {hasActiveFilters && (
          <button type="button" className="ha-btn-secondary" onClick={clearFilters}>Clear Filters</button>
        )}
      </div>

      <TABLE<ServiceItem>
        title="Services List"
        showPagination
        queryKey={["owner-services"]}
        service={serviceService.list}
        serviceParams={filterParams}
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
            item.description ? <span title={item.description}>{truncateWords(item.description, 12)}</span> : '-',
            aiScanLabel(item.aiScanLink),
            <ActionsMenu
              items={[
                { label: 'Edit', onClick: () => setEditingService(item) },
                { label: 'Delete', danger: true, onClick: () => setDeletingService(item) },
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

      {deletingService && (
        <ConfirmModal
          title="Delete Service"
          message={`Delete "${deletingService.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteService}
          onCancel={() => setDeletingService(null)}
        />
      )}
    </div>
  );
};

export default OwnerServicesPage;
