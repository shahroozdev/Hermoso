import { useMemo, useState } from "react";
import AdminPageSkeleton from "../../components/AdminPageSkeleton";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { salonService } from "../../services/salonService";
import { useUIStore } from "../../store/uiStore";
import SalonModal from "@/components/SalonModal";

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
      salonService.list({
        page: 1,
        limit: 50,
        ...(cityFilter !== "all" ? { city: cityFilter } : {}),
      }),
    [cityFilter, reloadKey],
  );

  const salons = useMemo(() => data?.data || [], [data]);
  const kpis = useMemo(() => {
    const active = salons.filter((s) => s.status === "approved").length;
    const pending = salons.filter((s) => s.status === "pending").length;
    const suspended = salons.filter((s) => s.status === "suspended").length;
    const cities = new Set(salons.map((s) => s.location?.city).filter(Boolean))
      .size;
    return { active, pending, suspended, cities };
  }, [salons]);

  const cities = useMemo(() => {
    return [
      "all",
      ...new Set(
        (data?.data || []).map((s) => s.location?.city).filter(Boolean),
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
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Active Salons</div>
          <div className="ha-kpi-val">{kpis.active}</div>
          <div className="ha-kpi-change up">Live and approved</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Pending Approval</div>
          <div className="ha-kpi-val white">{kpis.pending}</div>
          <div className="ha-kpi-change" style={{ color: "var(--amber)" }}>
            Needs review
          </div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Suspended</div>
          <div className="ha-kpi-val white">{kpis.suspended}</div>
          <div className="ha-kpi-change" style={{ color: "var(--rose)" }}>
            Policy violations
          </div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Cities Covered</div>
          <div className="ha-kpi-val">{kpis.cities}</div>
          <div className="ha-kpi-change up">Active regions</div>
        </div>
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

        <div style={{ overflowX: "auto" }}>
          <table className="ha-salon-table">
            <thead>
              <tr>
                <th>Salon / Clinic</th>
                <th>Owner</th>
                <th>City</th>
                <th>Services</th>
                <th>Bookings</th>
                <th>Revenue</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salons.map((salon, idx) => (
                <tr key={salon._id}>
                  <td>
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
                    </div>
                  </td>
                  <td>{salon.owner?.name || "Unassigned"}</td>
                  <td>{salon.location?.city || "-"}</td>
                  <td>{salon.servicesCount || 0}</td>
                  <td>{(salon.bookingsCount || 0).toLocaleString()}</td>
                  <td className="ha-money">
                    {Math.round(salon.revenue || 0).toLocaleString()}
                  </td>
                  <td>
                    <div className="ha-commission-box">
                      {salon.commissionRate ?? 10}
                    </div>
                  </td>
                  <td>
                    <span className={statusClass(salon.status)}>
                      {salon.status}
                    </span>
                  </td>
                  <td>
                    <span className={`ha-dot ${salon.active ? "on" : "off"}`} />
                  </td>
                  <td>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
