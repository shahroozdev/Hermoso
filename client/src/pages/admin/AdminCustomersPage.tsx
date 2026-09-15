import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useMemo, useState } from "react";
import AdminPageSkeleton from "../../components/skeletons/AdminPageSkeleton";
import ErrorBlock from "../../components/ErrorBlock";
import CustomerDetailModal from "../../components/CustomerDetailModal";
import TABLE from "@/components/table";
import { useApi } from "../../hooks/useApi";
import { useInvalidate } from "../../hooks/useInvalidate";
import { customerService } from "../../services/customerService";
import { useToastStore } from "../../store/toastStore";
import { formatMoney, rupeesToPaisa } from "../../utils/money";
import { downloadCsv } from "../../utils";
import SearchableSelect from "@/components/form/SearchableSelect";
import RangeFilter from "@/components/form/RangeFilter";

interface CustomerOverview {
  _id: string;
  name: string;
  email: string;
  status?: string;
  createdAt?: string;
  bookingsCount: number;
  totalSpentInPaisa: number;
  eventCount: number;
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

const computePresetRange = (
  preset: DatePreset,
): { from: string; to: string } => {
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

const formatJoinedDate = (createdAt?: string) =>
  createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const AdminCustomersPage = () => {
  const confirmation = useConfirmAction();
  const [comparisons, setComparisons] = useState<Record<string, string>>({});
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookingsMin, setBookingsMin] = useState("");
  const [bookingsMax, setBookingsMax] = useState("");
  const [spentMin, setSpentMin] = useState("");
  const [spentMax, setSpentMax] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
  const kpiReq = useApi(
    () => customerService.getOverview({ page: 1, limit: 1 }),
    ["customer-overview"],
  );

  const kpi = useMemo(() => {
    const m = kpiReq.data?.meta;
    return {
      totalCustomers: m?.totalCustomers ?? 0,
      returningCustomers: m?.returningCustomers ?? 0,
      flaggedAccounts: m?.flaggedAccounts ?? 0,
      totalRevenueInPaisa: m?.totalRevenueInPaisa ?? 0,
    };
  }, [kpiReq.data]);

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

  const handleFlag = (id: string, currentStatus: string | undefined) => confirmation.ask(currentStatus === 'suspended' || currentStatus === 'inactive' ? 'Unflag Customer' : 'Flag Customer', 'Confirm this customer flag change?', () => handleFlagNow(id, currentStatus));
  const handleFlagNow = async (id: string, currentStatus: string | undefined) => {
    const isFlagged =
      currentStatus === "suspended" || currentStatus === "inactive";
    const newStatus = isFlagged ? "active" : "suspended";
    try {
      await customerService.updateStatus(id, newStatus);
      invalidate();
      showToast(isFlagged ? "Customer unflagged." : "Customer flagged.");
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showToast(
        apiErr.response?.data?.message ||
          "Failed to update customer status. Please try again.",
        "error",
      );
    }
  };

  const hasActiveFilters = Boolean(
    search ||
    statusFilter !== "all" ||
    bookingsMin ||
    bookingsMax ||
    spentMin ||
    spentMax ||
    fromDate ||
    toDate,
  );

  const clearFilters = () => {
    setComparisons({});
    setSearch("");
    setStatusFilter("all");
    setBookingsMin("");
    setBookingsMax("");
    setSpentMin("");
    setSpentMax("");
    setDatePreset("all");
    setFromDate("");
    setToDate("");
  };

  const filterParams = {
    ...comparisons,
    ...(search ? { search } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(bookingsMin ? { bookingsMin } : {}),
    ...(bookingsMax ? { bookingsMax } : {}),
    ...(spentMin ? { spentMin: rupeesToPaisa(Number(spentMin)) } : {}),
    ...(spentMax ? { spentMax: rupeesToPaisa(Number(spentMax)) } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const handleExport = async () => {
    try {
      const res = await customerService.getOverview({
        page: 1,
        limit: 1000,
        ...filterParams,
      });
      const items: CustomerOverview[] = res?.data || [];
      const rows = [
        [
          "Name",
          "Email",
          "Joined Date",
          "Bookings",
          "AI Scans",
          "Total Spent",
          "Status",
        ],
        ...items.map((item) => {
          const aiScans = Math.max(0, Math.round(item.bookingsCount * 0.35));
          const isFlagged =
            item.status === "suspended" || item.status === "inactive";
          const isVip = item.totalSpentInPaisa >= rupeesToPaisa(80000);
          const statusLabel = isFlagged ? "flagged" : isVip ? "vip" : "active";
          return [
            item.name || "",
            item.email || "",
            formatJoinedDate(item.createdAt),
            String(item.bookingsCount ?? 0),
            String(aiScans),
            String(Math.round((item.totalSpentInPaisa || 0) / 100)),
            statusLabel,
          ];
        }),
      ];
      downloadCsv(
        `hermoso-customers-${new Date().toISOString().slice(0, 10)}.csv`,
        rows,
      );
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showToast(
        apiErr.response?.data?.message || "Failed to export customers",
        "error",
      );
    }
  };

  if (kpiReq.loading) return <AdminPageSkeleton variant="table" />;
  if (kpiReq.error) return <ErrorBlock text={kpiReq.error} />;

  const icons = ["🧑", "💅", "✨", "⚠️"];

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Total Customers</div>
          <div className="ha-kpi-val">
            {kpi.totalCustomers.toLocaleString()}
          </div>
          <div className="ha-kpi-change up">Registered accounts</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Returning Customers</div>
          <div className="ha-kpi-val">
            {kpi.returningCustomers.toLocaleString()}
          </div>
          <div className="ha-kpi-change up">
            {kpi.totalCustomers
              ? Math.round((kpi.returningCustomers / kpi.totalCustomers) * 100)
              : 0}
            % retention
          </div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Total Revenue</div>
          <div className="ha-kpi-val">
            {formatMoney(kpi.totalRevenueInPaisa)}
          </div>
          <div className="ha-kpi-change up">From bookings</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Flagged Accounts</div>
          <div className="ha-kpi-val white">{kpi.flaggedAccounts}</div>
          <div className="ha-kpi-change" style={{ color: "var(--rose)" }}>
            Needs review
          </div>
        </div>
      </div>

      <div className="ha-card">
        <div className="ha-card-title">
          Customer Accounts
          <span style={{ display: "inline-flex", gap: 8 }}>
            <button className="ha-act-btn" onClick={handleExport}>
              Export
            </button>
          </span>
        </div>

        <div className="ha-filter-bar"
        >
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 280 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ minWidth: 160, display: "inline-block" }}>
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </span>
          <span style={{ minWidth: 180, display: "inline-block" }}>
            <SearchableSelect
              value={datePreset}
              onChange={(v) => handleDatePresetChange(v as DatePreset)}
              options={[
                { value: "all", label: "Joined: Any Time" },
                { value: "current_month", label: "Current Month" },
                { value: "last_month", label: "Last Month" },
                { value: "current_year", label: "Current Year" },
                { value: "last_year", label: "Last Year" },
                { value: "custom", label: "Custom Range" },
              ]}
            />
          </span>
          {(
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input
                type="date" disabled={datePreset !== "custom"}
                aria-label="From Date"
                className="ha-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date" disabled={datePreset !== "custom"}
                aria-label="To Date"
                className="ha-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </span>
          )}
          <button
            type="button"
            className="ha-btn-secondary"
            onClick={() => setShowMoreFilters((v) => !v)}
          >
            {showMoreFilters ? "Hide Filters" : "More Filters"}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="ha-btn-secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        {showMoreFilters && (
          <div
            className="ha-card"
            style={{ marginBottom: 12, background: "var(--surface-soft)" }}
          >
            <div className="ha-filter-grid"
            >
              <RangeFilter operator={comparisons.bookingsOp} onOperator={op => setComparisons(prev => ({...prev, bookingsOp: op}))}
                label="Bookings"
                min={bookingsMin}
                max={bookingsMax}
                onMin={setBookingsMin}
                onMax={setBookingsMax}
              />
              <RangeFilter operator={comparisons.spentOp} onOperator={op => setComparisons(prev => ({...prev, spentOp: op}))}
                label="Spent Amount"
                min={spentMin}
                max={spentMax}
                onMin={setSpentMin}
                onMax={setSpentMax}
              />
            </div>
          </div>
        )}

        <TABLE<CustomerOverview>
          noBorder
          queryKey={["admin-customers"]}
          showPagination
          service={customerService.getOverview}
          serviceParams={filterParams}
          columns={[
            { title: "Customer" },
            { title: "Joined Date" },
            { title: "Bookings" },
            { title: "AI Scans" },
            { title: "Total Spent" },
            { title: "Status" },
            { title: "Actions" },
          ]}
          rows={(data) =>
            data?.map((item, idx) => {
              const aiScans = Math.max(
                0,
                Math.round(item.bookingsCount * 0.35),
              );
              const isFlagged =
                item.status === "suspended" || item.status === "inactive";
              const isVip = item.totalSpentInPaisa >= rupeesToPaisa(80000);
              const statusLabel = isFlagged
                ? "flagged"
                : isVip
                  ? "vip"
                  : "active";
              const joined = formatJoinedDate(item.createdAt);
              return [
                <div className="ha-salon-cell">
                  <div className="ha-salon-av">{icons[idx % 4]}</div>
                  <div>
                    <div className="ha-salon-name">{item.name}</div>
                    <div className="ha-salon-sub">{item.email}</div>
                  </div>
                </div>,
                joined,
                item.bookingsCount,
                aiScans,
                <span className="ha-money">
                  {formatMoney(item.totalSpentInPaisa)}
                </span>,
                <span
                  className={
                    statusLabel === "active"
                      ? "ha-pill ha-pill-active"
                      : statusLabel === "vip"
                        ? "ha-pill ha-pill-vip"
                        : "ha-pill ha-pill-suspended"
                  }
                >
                  {statusLabel}
                </span>,
                <div className="ha-actions">
                  <button
                    className="ha-act-btn"
                    onClick={() => setViewingId(item._id)}
                  >
                    View
                  </button>
                  <button
                    className="ha-act-btn"
                    onClick={() => handleFlag(item._id, item.status)}
                  >
                    {isFlagged ? "Unflag" : "Flag"}
                  </button>
                </div>,
              ];
            })
          }
        />
      </div>

      {viewingId && (
        <CustomerDetailModal
          customerId={viewingId}
          onClose={() => setViewingId(null)}
        />
      )}
    {confirmation.modal}
    </>
  );
};

export default AdminCustomersPage;
