import { useMemo, useState } from "react";
import AdminPageSkeleton from "../../components/skeletons/AdminPageSkeleton";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { salonService } from "../../services/salonService";
import { useUIStore } from "../../store/uiStore";
import SalonModal from "@/components/SalonModal";
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
  const [editDefaultValues, setEditDefaultValues] = useState(null);

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
    try {
      await salonService.updateStatus(id, { status });
      setReloadKey((v) => v + 1);
    } catch (err) {
      setErrorAction(err.response?.data?.message || "Status update failed");
    }
  };

  const handleCreated = () => {
    setReloadKey((v) => v + 1);
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
              <span className={`ha-dot ${salon.active ? "on" : "off"}`} />,
              <div className="ha-actions">
                <button className="ha-act-btn">View</button>
                <button
                  className="ha-act-btn"
                  onClick={() => {
                    setEditDefaultValues(salon);
                    setSalonModal(true);
                  }}
                >
                  Edit
                </button>
                {salon.status === "pending" ? (
                  <>
                    <button
                      className="ha-act-btn"
                      onClick={() => patchStatus(salon._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="ha-act-btn danger"
                      onClick={() => patchStatus(salon._id, "suspended")}
                    >
                      Reject
                    </button>
                  </>
                ) : salon.status === "suspended" ? (
                  <button
                    className="ha-act-btn"
                    onClick={() => patchStatus(salon._id, "approved")}
                  >
                    Reinstate
                  </button>
                ) : (
                  <button
                    className="ha-act-btn danger"
                    onClick={() => patchStatus(salon._id, "suspended")}
                  >
                    Suspend
                  </button>
                )}
              </div>,
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
    </>
  );
};

export default AdminSalonsPage;
