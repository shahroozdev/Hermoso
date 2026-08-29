import { useMemo, useState } from "react";
import AdminPageSkeleton from "../../components/skeletons/AdminPageSkeleton";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { salonService } from "../../services/salonService";
import { useUIStore } from "../../store/uiStore";
import { useToastStore } from "../../store/toastStore";
import SalonModal from "@/components/SalonModal";
import SalonViewModal from "@/components/SalonViewModal";
import ActionsMenu from "@/components/ActionsMenu";
import { salonsStats } from "@/components/constant";
import TABLE from "@/components/table";
import { SalonItem } from "../shared/SalonListPage";

const statusClass = (status) => {
  if (status === "approved") return "ha-pill ha-pill-active";
  if (status === "suspended") return "ha-pill ha-pill-suspended";
  return "ha-pill ha-pill-pending";
};

const AdminSalonsPage = () => {
  const [cityFilter, setCityFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [errorAction, setErrorAction] = useState("");
  const { salonModalOpen, setSalonModal } = useUIStore();
  const { showToast } = useToastStore();
  const [editDefaultValues, setEditDefaultValues] = useState(null);
  const [viewSalon, setViewSalon] = useState(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const { data, loading, error } = useApi(
    () =>
      salonService.getCities(),
    [cityFilter, reloadKey],
  );
  const { data:stats} = useApi(
    () =>
      salonService.getStatusStats(),
    [reloadKey],
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
      setReloadKey((v) => v + 1);
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
    setReloadKey((v) => v + 1);
    showToast(editDefaultValues ? "Salon updated successfully." : "Salon created successfully.");
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
          <span>
            <select
              className="ha-select"
              style={{ minWidth: 140, padding: "6px 10px" }}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              {cities.map((city: string) => (
                <option key={city} value={city}>
                  {city === "all" ? "All Cities" : city}
                </option>
              ))}
            </select>
          </span>
        </div>

        {errorAction ? (
          <div style={{ marginBottom: 10 }}>
            <ErrorBlock text={errorAction} />
          </div>
        ) : null}
        <TABLE<SalonItem>
          noBorder
          showPagination
          service={salonService.list}
          serviceParams={{ ...(cityFilter !== "all" ? { city: cityFilter } : {}) }}
          columns={[
            { title: "Salon / Clinic", size: "250px" },
            { title: "Owner" , size: "150px" },
            { title: "City" },
            { title: "Services" },
            { title: "Bookings" },
            { title: "Revenue" },
            { title: "Commission" },
            { title: "Status" },
            { title: "Active" },
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
                  {
                    label: "Edit",
                    onClick: () => {
                      setEditDefaultValues(salon);
                      setSalonModal(true);
                    },
                  },
                ];
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

export default AdminSalonsPage;
