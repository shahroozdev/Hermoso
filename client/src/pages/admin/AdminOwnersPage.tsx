import { useState } from "react";
import TABLE from "@/components/table";
import ErrorBlock from "../../components/ErrorBlock";
import CreateOwnerModal from "@/components/createOwner";
import { useInvalidate } from "../../hooks/useInvalidate";
import { ownerService, type OwnerRecord } from "@/services/ownerService";
import { useUIStore } from "@/store/uiStore";

const statusClass = (status?: string) => {
  if (status === "suspended" || status === "inactive") return "ha-pill ha-pill-suspended";
  return "ha-pill ha-pill-active";
};

const AdminOwnersPage = () => {
  const { ownerModalOpen, setOwnerModal } = useUIStore();
  const [errorAction, setErrorAction] = useState("");
  const [newOwnerCredentials, setNewOwnerCredentials] = useState<{
    email?: string;
    password?: string;
    generated?: boolean;
  } | null>(null);
  const invalidate = useInvalidate();

  const patchStatus = async (id: string, currentStatus: string | undefined) => {
    setErrorAction("");
    const nextStatus = currentStatus === "suspended" || currentStatus === "inactive" ? "active" : "suspended";
    try {
      await ownerService.updateStatus(id, nextStatus);
      invalidate();
    } catch (err) {
      setErrorAction(err.response?.data?.message || "Failed to update owner status");
    }
  };

  return (
    <>
      <div className="ha-card">
        <div className="ha-card-title">
          All Salon Owners
          <button className="ha-topbar-btn primary" onClick={() => setOwnerModal(true)}>
            + Add Owner
          </button>
        </div>

        {errorAction ? (
          <div style={{ marginBottom: 10 }}>
            <ErrorBlock text={errorAction} />
          </div>
        ) : null}

        {newOwnerCredentials?.generated ? (
          <div className="ha-form-hint" style={{ marginBottom: 12 }}>
            Owner created with generated login: {newOwnerCredentials.email} /{" "}
            {newOwnerCredentials.password}
          </div>
        ) : null}

        <TABLE<OwnerRecord>
          noBorder
          showPagination
          queryKey={["owners"]}
          service={ownerService.list}
          columns={[
            { title: "Owner", size: "220px" },
            { title: "Phone" },
            { title: "Location" },
            { title: "Salons" },
            { title: "Status" },
            { title: "Actions" },
          ]}
          rows={(data) =>
            data?.map((owner) => {
              const isSuspended = owner.status === "suspended" || owner.status === "inactive";
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
                <span className={statusClass(owner.status)}>{isSuspended ? "suspended" : "active"}</span>,
                <div className="ha-actions">
                  <button
                    className={isSuspended ? "ha-act-btn" : "ha-act-btn danger"}
                    onClick={() => patchStatus(owner._id, owner.status)}
                  >
                    {isSuspended ? "Activate" : "Suspend"}
                  </button>
                </div>,
              ];
            })
          }
        />
      </div>

      {ownerModalOpen && (
        <CreateOwnerModal
          onClose={() => setOwnerModal(false)}
          onCreated={(_owner, credentials) => {
            setNewOwnerCredentials(credentials || null);
            invalidate();
          }}
        />
      )}
    </>
  );
};

export default AdminOwnersPage;
