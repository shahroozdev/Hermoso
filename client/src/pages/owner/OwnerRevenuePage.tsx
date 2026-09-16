import { useState } from "react";
import TABLE from "@/components/table";
import SearchableSelect from "@/components/form/SearchableSelect";
import RangeFilter from "@/components/form/RangeFilter";
import { payoutService } from "@/services/payoutService";
import { useToastStore } from "@/store/toastStore";
import { downloadCsv } from "@/utils";
import { rupeesToPaisa } from "@/utils/money";

interface Payout {
  amountInPaisa?: number;
  status?: string;
  createdAt?: string;
  payoutDate?: string;
}

const EXPORT_COLUMNS = ["Amount (PKR)", "Status", "Created", "Payout Date"];

const row = (item: Payout) => [
  item.amountInPaisa == null ? "" : (item.amountInPaisa / 100).toFixed(2),
  item.status || "",
  item.createdAt?.slice(0, 10) || "",
  item.payoutDate?.slice(0, 10) || "",
];

export default function OwnerRevenuePage() {
  const { showToast } = useToastStore();
  const [comparisons, setComparisons] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [netMin, setNetMin] = useState("");
  const [netMax, setNetMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payoutFrom, setPayoutFrom] = useState("");
  const [payoutTo, setPayoutTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const hasActiveFilters = Boolean(
    statusFilter !== "all" ||
    netMin ||
    netMax ||
    dateFrom ||
    dateTo ||
    payoutFrom ||
    payoutTo,
  );

  const clearFilters = () => {
    setComparisons({});
    setStatusFilter("all");
    setNetMin("");
    setNetMax("");
    setDateFrom("");
    setDateTo("");
    setPayoutFrom("");
    setPayoutTo("");
  };

  const filterParams = {
    ...comparisons,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(netMin ? { netMin: rupeesToPaisa(netMin) } : {}),
    ...(netMax ? { netMax: rupeesToPaisa(netMax) } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(payoutFrom ? { payoutFrom } : {}),
    ...(payoutTo ? { payoutTo } : {}),
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const records: Payout[] = [];
      let page = 1;
      while (true) {
        const res = await payoutService.list({ ...filterParams, page, limit: 100 });
        const batch = res?.data || [];
        records.push(...batch);
        if (!batch.length || (res?.meta?.total != null ? records.length >= res.meta.total : batch.length < 100)) break;
        page++;
      }
      downloadCsv(`hermoso-revenue-${new Date().toISOString().slice(0, 10)}.csv`, [
        EXPORT_COLUMNS,
        ...records.map(row),
      ]);
    } catch {
      showToast("Unable to export records. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 ha-owner-records">
      <div className="ha-records-toolbar">
        <h2 className="text-xl font-semibold">Revenue</h2>
        <button className="ha-act-btn" disabled={exporting} onClick={handleExport}>
          {exporting ? "Exporting..." : "Export"}
        </button>
      </div>

      <div className="ha-filter-bar">
        <span style={{ minWidth: 160, display: "inline-block" }}>
          <SearchableSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
            ]}
          />
        </span>
        <button
          type="button"
          className="ha-btn-secondary"
          onClick={() => setShowMoreFilters((v) => !v)}
        >
          {showMoreFilters ? "Hide Filters" : "More Filters"}
        </button>
        {hasActiveFilters && (
          <button type="button" className="ha-btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {showMoreFilters && (
        <div className="ha-card" style={{ marginBottom: 12, background: "var(--surface-soft)" }}>
          <div className="ha-filter-grid">
            <RangeFilter
              operator={comparisons.netOp}
              onOperator={(op) => setComparisons((prev) => ({ ...prev, netOp: op }))}
              label="Amount (PKR)"
              min={netMin}
              max={netMax}
              onMin={setNetMin}
              onMax={setNetMax}
            />
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted">Created From</label>
              <input type="date" className="ha-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted">Created To</label>
              <input type="date" className="ha-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted">Payout From</label>
              <input type="date" className="ha-input" value={payoutFrom} onChange={(e) => setPayoutFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted">Payout To</label>
              <input type="date" className="ha-input" value={payoutTo} onChange={(e) => setPayoutTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <TABLE<Payout>
        title="Revenue List"
        queryKey={["owner-payouts"]}
        showPagination
        service={payoutService.list}
        serviceParams={filterParams}
        columns={[
          { title: "Amount (PKR)" },
          { title: "Status" },
          { title: "Created" },
          { title: "Payout Date" },
        ]}
        rows={(items) => items.map(row)}
      />
    </div>
  );
}
