import { useState } from "react";
import TABLE from "@/components/table";
import SearchableSelect from "@/components/form/SearchableSelect";
import { customerService } from "@/services/customerService";
import { useToastStore } from "@/store/toastStore";
import { downloadCsv } from "@/utils";

interface Customer {
  name?: string;
  email?: string;
  status?: string;
  createdAt?: string;
}

type DatePreset =
  | "all"
  | "current_month"
  | "last_month"
  | "current_year"
  | "last_year"
  | "custom";

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const computePresetRange = (preset: DatePreset): { from: string; to: string } => {
  const now = new Date();
  switch (preset) {
    case "current_month":
      return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toIsoDate(now),
      };
    case "last_month":
      return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "current_year":
      return {
        from: toIsoDate(new Date(now.getFullYear(), 0, 1)),
        to: toIsoDate(now),
      };
    case "last_year":
      return {
        from: toIsoDate(new Date(now.getFullYear() - 1, 0, 1)),
        to: toIsoDate(new Date(now.getFullYear() - 1, 11, 31)),
      };
    default:
      return { from: "", to: "" };
  }
};

const EXPORT_COLUMNS = ["Name", "Email", "Status", "Joined"];

const row = (item: Customer) => [
  item.name || "",
  item.email || "",
  item.status || "",
  item.createdAt?.slice(0, 10) || "",
];

export default function OwnerCustomersPage() {
  const { showToast } = useToastStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "all" || preset === "custom") {
      if (preset === "all") {
        setFromDate("");
        setToDate("");
      }
      return;
    }
    const range = computePresetRange(preset);
    setFromDate(range.from);
    setToDate(range.to);
  };

  const hasActiveFilters = Boolean(
    name || email || statusFilter !== "all" || datePreset !== "all",
  );

  const clearFilters = () => {
    setName("");
    setEmail("");
    setStatusFilter("all");
    setDatePreset("all");
    setFromDate("");
    setToDate("");
  };

  const filterParams = {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const records: Customer[] = [];
      let page = 1;
      while (true) {
        const res = await customerService.list({ ...filterParams, page, limit: 100 });
        const batch = res?.data || [];
        records.push(...batch);
        if (!batch.length || (res?.meta?.total != null ? records.length >= res.meta.total : batch.length < 100)) break;
        page++;
      }
      downloadCsv(`hermoso-customers-${new Date().toISOString().slice(0, 10)}.csv`, [
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
        <h2 className="text-xl font-semibold">Customers</h2>
        <button className="ha-act-btn" disabled={exporting} onClick={handleExport}>
          {exporting ? "Exporting..." : "Export"}
        </button>
      </div>

      <div className="ha-filter-grid ha-card">
        <label>
          Name
          <input
            aria-label="Name"
            className="ha-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            aria-label="Email"
            className="ha-input"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Status
          <select
            aria-label="Status"
            className="ha-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="suspended">suspended</option>
          </select>
        </label>
        <label>
          Joined
          <SearchableSelect
            value={datePreset}
            onChange={(v) => handleDatePresetChange(v as DatePreset)}
            options={[
              { value: "all", label: "Any Time" },
              { value: "current_month", label: "Current Month" },
              { value: "last_month", label: "Last Month" },
              { value: "current_year", label: "Current Year" },
              { value: "last_year", label: "Last Year" },
              { value: "custom", label: "Custom Range" },
            ]}
          />
        </label>
        <label>
          Joined From
          <input
            type="date"
            disabled={datePreset !== "custom"}
            aria-label="Joined From"
            className="ha-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          Joined To
          <input
            type="date"
            disabled={datePreset !== "custom"}
            aria-label="Joined To"
            className="ha-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
        {hasActiveFilters && (
          <button className="ha-btn-secondary" onClick={clearFilters}>Reset Filters</button>
        )}
      </div>

      <TABLE<Customer>
        title="Customers List"
        queryKey={["owner-customers"]}
        showPagination
        service={customerService.list}
        serviceParams={filterParams}
        columns={[
          { title: "Name" },
          { title: "Email" },
          { title: "Status" },
          { title: "Joined" },
        ]}
        rows={(items) => items.map(row)}
      />
    </div>
  );
}
