import { useMemo, useState } from "react";
import AdminPageSkeleton from "../../components/skeletons/AdminPageSkeleton";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { useInvalidate } from "../../hooks/useInvalidate";
import { salonService } from "../../services/salonService";
import { useUIStore } from "../../store/uiStore";
import { useToastStore } from "../../store/toastStore";
import SalonModal from "@/components/SalonModal";
import SalonViewModal from "@/components/SalonViewModal";
import ActionsMenu from "@/components/ActionsMenu";
import { salonsStats } from "@/components/constant";
import TABLE from "@/components/table";
import { SalonItem } from "../shared/SalonListPage";
import SearchableSelect from "@/components/form/SearchableSelect";
import { exportPageTables } from "@/utils";
import { ownerService } from "@/services/ownerService";

const statusClass = (status) => {
  if (status === "approved") return "ha-pill ha-pill-active";
  if (status === "suspended") return "ha-pill ha-pill-suspended";
  return "ha-pill ha-pill-pending";
};

const AdminSalonsPage = () => {
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [servicesMin, setServicesMin] = useState("");
  const [servicesMax, setServicesMax] = useState("");
  const [bookingsMin, setBookingsMin] = useState("");
  const [bookingsMax, setBookingsMax] = useState("");
  const [revenueMin, setRevenueMin] = useState("");
  const [revenueMax, setRevenueMax] = useState("");
  const [commissionMin, setCommissionMin] = useState("");
  const [commissionMax, setCommissionMax] = useState("");
  const [errorAction, setErrorAction] = useState("");
  const { salonModalOpen, setSalonModal } = useUIStore();
  const { showToast } = useToastStore();
  const [editDefaultValues, setEditDefaultValues] = useState(null);
  const [viewSalon, setViewSalon] = useState(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const invalidate = useInvalidate();

  const { data, loading, error } = useApi(
    () =>
      salonService.getCities(),
    [cityFilter],
  );
  const { data:stats} = useApi(
    () =>
      salonService.getStatusStats(),
    [],
  );
  const { data: ownersData } = useApi(() => ownerService.list(), []);
  const ownerOptions = useMemo(
    () => [
      { value: "all", label: "All Owners" },
      ...((ownersData?.data || []).map((owner) => ({ value: owner._id, label: owner.name }))),
    ],
    [ownersData],
  );
  const kpis = useMemo(() => {
    const active = stats?.data?.approved||0
    const pending = stats?.data?.pending||0
    const suspended = stats?.data?.suspended||0
    const cities = data?.data?.length || 0
    return { active, pending, suspended, cities };
  }, [stats, data]);

  const cities = useMemo(() => {
    return [
      "all",
      ...new Set(
        (data?.data || []).map((s) => s).filter(Boolean),
      ),
    ];
  }, [data]);

  const patchStatus = async (id, status) => {
    setErrorAction("");
    setPendingActionId(id);
    try {
      await salonService.updateStatus(id, { status });
      invalidate();
      showToast(
        status === "approved" ? "Salon approved." : status === "suspended" ? "Salon suspended." : "Salon status updated."
      );
    } catch (err) {
      setErrorAction(err.response?.data?.message || "Status update failed");
    } finally {
      setPendingActionId(null);
    }
  };

  const handleCreated = () => {
    invalidate();
    showToast(editDefaultValues ? "Salon updated successfully." : "Salon created successfully.");
  };

  const hasActiveFilters = Boolean(
    search ||
      cityFilter !== "all" ||
      statusFilter !== "all" ||
      ownerFilter !== "all" ||
      servicesMin || servicesMax || bookingsMin || bookingsMax ||
      revenueMin || revenueMax || commissionMin || commissionMax,
  );

  const clearFilters = () => {
    setSearch("");
    setCityFilter("all");
    setStatusFilter("all");
    setOwnerFilter("all");
    setServicesMin("");
    setServicesMax("");
    setBookingsMin("");
    setBookingsMax("");
    setRevenueMin("");
    setRevenueMax("");
    setCommissionMin("");
    setCommissionMax("");
  };

  if (loading) return <AdminPageSkeleton variant="table" />;
  if (error) return <ErrorBlock text={error} />;

  return (
    <>
      <div className="ha-kpi-row">
        {salonsStats.map((stat) => (
          <div className="ha-kpi-card" key={stat.key}>
            <div className="ha-kpi-label">{stat.label}</div>
            <div className="ha-kpi-val">{kpis[stat.key]}</div>
            <div className="ha-kpi-change up" style={{ color: stat.color }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="ha-card">
        <div className="ha-card-title">
          All Salons & Clinics
          <span style={{ display: "inline-flex", gap: 8 }}>
            <span style={{ minWidth: 160, display: "inline-block" }}>
              <SearchableSelect
                value={cityFilter}
                onChange={setCityFilter}
                options={cities.map((city: string) => ({
                  value: city,
                  label: city === "all" ? "All Cities" : city,
                }))}
              />
            </span>
            <span style={{ minWidth: 160, display: "inline-block" }}>
              <SearchableSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All Approval Status" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "suspended", label: "Suspended" },
                ]}
              />
            </span>
            <button className="ha-act-btn" onClick={() => exportPageTables("salons")}>
              Export
            </button>
          </span>
        </div>

        <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 320 }}
            placeholder="Search salons by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ minWidth: 160, display: "inline-block" }}>
            <SearchableSelect value={ownerFilter} onChange={setOwnerFilter} options={ownerOptions} />
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
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <RangeFilter label="Services" min={servicesMin} max={servicesMax} onMin={setServicesMin} onMax={setServicesMax} />
              <RangeFilter label="Bookings" min={bookingsMin} max={bookingsMax} onMin={setBookingsMin} onMax={setBookingsMax} />
              <RangeFilter label="Revenue" min={revenueMin} max={revenueMax} onMin={setRevenueMin} onMax={setRevenueMax} />
              <RangeFilter label="Commission %" min={commissionMin} max={commissionMax} onMin={setCommissionMin} onMax={setCommissionMax} />
            </div>
          </div>
        )}

        {errorAction ? (
          <div style={{ marginBottom: 10 }}>
            <ErrorBlock text={errorAction} />
          </div>
        ) : null}
        <TABLE<SalonItem>
          noBorder
          showPagination
          queryKey={["salons"]}
          service={salonService.list}
          serviceParams={{
            search,
            ...(cityFilter !== "all" ? { city: cityFilter } : {}),
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
            ...(ownerFilter !== "all" ? { ownerId: ownerFilter } : {}),
            ...(servicesMin ? { servicesMin } : {}),
            ...(servicesMax ? { servicesMax } : {}),
            ...(bookingsMin ? { bookingsMin } : {}),
            ...(bookingsMax ? { bookingsMax } : {}),
            ...(revenueMin ? { revenueMin } : {}),
            ...(revenueMax ? { revenueMax } : {}),
            ...(commissionMin ? { commissionMin } : {}),
            ...(commissionMax ? { commissionMax } : {}),
          }}
          columns={[
            { title: "Salon / Clinic", size: "250px" },
            { title: "Owner" , size: "150px" },
            { title: "City" },
            { title: "Services" },
            { title: "Bookings" },
            { title: "Revenue" },
            { title: "Commission" },
            { title: "Approval" },
            { title: "Status" },
            { title: "Actions" },
          ]}
          rows={(data) =>
            data?.map((salon, idx) => [
              <div className="ha-salon-cell">
                <div className="ha-salon-av">
                  {["💅", "🌿", "💎", "✨", "🚫"][idx % 5]}
                </div>
                <div>
                  <div className="ha-salon-name">{salon.name}</div>
                  <div className="ha-salon-sub">
                    ⭐ {salon.avgRating || 0} · {salon.reviewsCount || 0}{" "}
                    reviews
                  </div>
                </div>
              </div>,
              salon.owner?.name || "Unassigned",
              salon.location?.city || "-",
              salon.servicesCount || 0,
              (salon.bookingsCount || 0).toLocaleString(),
              Math.round(salon.revenue || 0).toLocaleString(),
              salon.commissionRate ?? 10,
              <span className={statusClass(salon.status)}>{salon.status}</span>,
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span className={`ha-dot ${salon.active ? "on" : "off"}`} />
                {salon.active ? "Active" : "Inactive"}
              </span>,
              (() => {
                const isPending = pendingActionId === salon._id;
                const items = [
                  { label: "View", onClick: () => setViewSalon(salon) },
                ];
                if (salon.status !== "suspended") {
                  items.push({
                    label: "Edit",
                    onClick: () => {
                      setEditDefaultValues(salon);
                      setSalonModal(true);
                    },
                  });
                }
                if (salon.status === "pending") {
                  items.push(
                    { label: isPending ? "Approving..." : "Approve", onClick: () => patchStatus(salon._id, "approved") },
                    { label: isPending ? "Rejecting..." : "Reject", danger: true, onClick: () => patchStatus(salon._id, "suspended") },
                  );
                } else if (salon.status === "suspended") {
                  items.push({ label: isPending ? "Activating..." : "Activate", onClick: () => patchStatus(salon._id, "approved") });
                } else {
                  items.push({ label: isPending ? "Suspending..." : "Suspend", danger: true, onClick: () => patchStatus(salon._id, "suspended") });
                }
                return <ActionsMenu items={items} />;
              })(),
            ])
          }
        />
      </div>

      {salonModalOpen && (
        <SalonModal
          onClose={() => {
            setSalonModal(false);
            setEditDefaultValues(null);
          }}
          onCreated={handleCreated}
          editDefaultValues={editDefaultValues}
        />
      )}

      {viewSalon && <SalonViewModal salon={viewSalon} onClose={() => setViewSalon(null)} />}
    </>
  );
};

const RangeFilter = ({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase text-muted">{label}</label>
    <div style={{ display: "flex", gap: 6 }}>
      <input
        type="number"
        className="ha-input"
        placeholder="Min"
        value={min}
        onChange={(e) => onMin(e.target.value)}
      />
      <input
        type="number"
        className="ha-input"
        placeholder="Max"
        value={max}
        onChange={(e) => onMax(e.target.value)}
      />
    </div>
  </div>
);

export default AdminSalonsPage;
