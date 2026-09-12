import { useState } from "react";
import TABLE from "@/components/table";
import ErrorBlock from "../../components/ErrorBlock";
import CreateOwnerModal from "@/components/createOwner";
import OwnerCredentialsModal from "@/components/OwnerCredentialsModal";
import ActionsMenu from "@/components/ActionsMenu";
import { useInvalidate } from "../../hooks/useInvalidate";
import { ownerService, type OwnerRecord } from "@/services/ownerService";
import { useUIStore } from "@/store/uiStore";
import { useToastStore } from "@/store/toastStore";
import SearchableSelect from "@/components/form/SearchableSelect";
import ComparisonFilter from "@/components/form/ComparisonFilter";
import { downloadCsv } from "@/utils";

const ownerStatusLabel = (owner: OwnerRecord) => {
  const isSuspended = owner.status === "suspended" || owner.status === "inactive";
  if (isSuspended) return { label: "suspended", className: "ha-pill ha-pill-suspended" };
  if (owner.isVerified === false) return { label: "pending verification", className: "ha-pill ha-pill-pending" };
  return { label: "active", className: "ha-pill ha-pill-active" };
};

const AdminOwnersPage = () => {
  const { ownerModalOpen, setOwnerModal } = useUIStore();
  const { showToast } = useToastStore();
  const [errorAction, setErrorAction] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [salonsOp, setSalonsOp] = useState(">");
  const [salonsValue, setSalonsValue] = useState("");
  const [editOwner, setEditOwner] = useState<OwnerRecord | null>(null);
  const [newOwnerCredentials, setNewOwnerCredentials] = useState<{
    email?: string;
    password?: string;
    generated?: boolean;
  } | null>(null);
  const invalidate = useInvalidate();

  const handleExport = async () => {
    try {
      const res = await ownerService.list({
        search,
        limit: 1000,
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(phoneFilter ? { phone: phoneFilter } : {}),
        ...(locationFilter ? { location: locationFilter } : {}),
        ...(salonsValue ? { salonsOp, salonsValue } : {}),
      });
      const items: OwnerRecord[] = res?.data || [];
      const rows = [
        ["Owner", "Email", "Phone", "Location", "Salons", "Status"],
        ...items.map((owner) => [
          owner.name || "",
          owner.email || "",
          owner.phone || "-",
          [owner.location?.city, owner.location?.country].filter(Boolean).join(", ") || "-",
          String(owner.salonsCount ?? 0),
          ownerStatusLabel(owner).label,
        ]),
      ];
      downloadCsv(`hermoso-owners-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to export owners", "error");
    }
  };

  const patchStatus = async (id: string, currentStatus: string | undefined) => {
    setErrorAction("");
    const nextStatus = currentStatus === "suspended" || currentStatus === "inactive" ? "active" : "suspended";
    try {
      await ownerService.updateStatus(id, nextStatus);
      invalidate();
      showToast(nextStatus === "suspended" ? "Owner suspended." : "Owner activated.");
    } catch (err) {
      setErrorAction(err.response?.data?.message || "Failed to update owner status");
    }
  };

  return (
    <>
      <div className="ha-card">
        <div className="ha-card-title">
          All Salon Owners
          <span style={{ display: "inline-flex", gap: 8 }}>
            <button className="ha-act-btn" onClick={handleExport}>
              Export
            </button>
            <button className="ha-topbar-btn primary" onClick={() => setOwnerModal(true)}>
              + Add Owner
            </button>
          </span>
        </div>

        <div className="ha-filter-bar">
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 320 }}
            placeholder="Search owners by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 180 }}
            placeholder="Filter by phone..."
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
          />
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 180 }}
            placeholder="Filter by city/country..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
          <span style={{ minWidth: 160, display: "inline-block" }}>
            <ComparisonFilter label="Salons" operator={salonsOp} value={salonsValue} onOperatorChange={setSalonsOp} onValueChange={setSalonsValue} />
          </span>
          <span style={{ minWidth: 160, display: "inline-block" }}>
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
              ]}
            />
          </span>
          {(search || statusFilter !== "all" || phoneFilter || locationFilter || salonsValue) && (
            <button
              type="button"
              className="ha-btn-secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPhoneFilter("");
                setLocationFilter("");
                setSalonsOp(">");
                setSalonsValue("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {errorAction ? (
          <div style={{ marginBottom: 10 }}>
            <ErrorBlock text={errorAction} />
          </div>
        ) : null}

        <TABLE<OwnerRecord>
          noBorder
          showPagination
          queryKey={["owners"]}
          service={ownerService.list}
          serviceParams={{
            search,
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
            ...(phoneFilter ? { phone: phoneFilter } : {}),
            ...(locationFilter ? { location: locationFilter } : {}),
            ...(salonsValue ? { salonsOp, salonsValue } : {}),
          }}
          columns={[
            { title: "Owner", size: "220px" },
            { title: "Phone" },
            { title: "Location" },
            { title: "Salons" },
            { title: "Status" },
            { title: "Actions" },
          ]}
          rows={(data) =>
            [...(data || [])]
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
              .map((owner) => {
              const isSuspended = owner.status === "suspended" || owner.status === "inactive";
              const statusInfo = ownerStatusLabel(owner);
              return [
                <div className="ha-salon-cell">
                  <div className="ha-salon-av">{(owner.name || "O").slice(0, 1).toUpperCase()}</div>
                  <div>
                    <div className="ha-salon-name">{owner.name}</div>
                    <div className="ha-salon-sub">{owner.email}</div>
                  </div>
                </div>,
                owner.phone || "-",
                [owner.location?.city, owner.location?.country].filter(Boolean).join(", ") || "-",
                owner.salonsCount ?? 0,
                <span className={statusInfo.className}>{statusInfo.label}</span>,
                <ActionsMenu
                  items={[
                    { label: "Edit", onClick: () => setEditOwner(owner) },
                    {
                      label: isSuspended ? "Activate" : "Suspend",
                      danger: !isSuspended,
                      onClick: () => patchStatus(owner._id, owner.status),
                    },
                  ]}
                />,
              ];
            })
          }
        />
      </div>

      {ownerModalOpen && (
        <CreateOwnerModal
          onClose={() => setOwnerModal(false)}
          onCreated={(_owner, credentials) => {
            setNewOwnerCredentials(credentials?.generated ? credentials : null);
            invalidate();
            if (!credentials?.generated) showToast("Owner created successfully.");
          }}
        />
      )}

      {editOwner && (
        <CreateOwnerModal
          owner={editOwner}
          onClose={() => setEditOwner(null)}
          onCreated={(_owner, credentials) => {
            invalidate();
            if (credentials?.generated) {
              setNewOwnerCredentials(credentials);
            } else {
              showToast("Owner updated successfully.");
            }
          }}
        />
      )}

      {newOwnerCredentials?.generated && (
        <OwnerCredentialsModal
          email={newOwnerCredentials.email}
          password={newOwnerCredentials.password}
          onClose={() => setNewOwnerCredentials(null)}
        />
      )}
    </>
  );
};

export default AdminOwnersPage;
