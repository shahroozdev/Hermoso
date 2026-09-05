import { useState } from "react";
import GenericModal from "./GenericModal";
import ServiceModal, { ServiceFormModal, AI_SCAN_CATEGORIES, type ServiceRecord } from "./ServiceModal";
import TABLE from "./table";
import ActionsMenu from "./ActionsMenu";
import { serviceService } from "@/services/serviceService";
import { useInvalidate } from "@/hooks/useInvalidate";
import { useToastStore } from "@/store/toastStore";
import { formatMoney } from "@/utils/money";

const aiScanLabel = (value?: string) => AI_SCAN_CATEGORIES.find((c) => c.value === value)?.label || "-";

interface ServiceItem extends ServiceRecord {
  name?: string;
  category?: string;
  categoryId?: { name?: string };
  duration?: number;
  priceInPaisa?: number;
}

interface SalonViewModalProps {
  salon: {
    _id?: string;
    name?: string;
    owner?: { name?: string; email?: string };
    location?: { city?: string; country?: string };
    address?: string;
    phone?: string;
    description?: string;
    servicesCount?: number;
    bookingsCount?: number;
    revenueInPaisa?: number;
    commissionRate?: number;
    status?: string;
    active?: boolean;
    imageUrl?: string;
    approvedBy?: { name?: string } | null;
  };
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 border-b border-[var(--border-soft)] py-2 text-sm last:border-b-0">
    <span className="shrink-0 text-muted">{label}</span>
    <span className="min-w-0 break-all text-right font-medium">{value ?? "-"}</span>
  </div>
);

const SalonViewModal = ({ salon, onClose }: SalonViewModalProps) => {
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
  const isSuspended = salon.status === "suspended";

  const handleDeleteService = async (service: ServiceItem) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    try {
      await serviceService.delete(service._id);
      showToast("Service deleted successfully.");
      invalidate(["salon-services"]);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete service", "error");
    }
  };

  return (
    <>
      <GenericModal
        title={salon.name || "Salon Details"}
        onClose={onClose}
        wide
        footer={
          <button type="button" className="ha-btn-primary" onClick={onClose}>
            Close
          </button>
        }
      >
        {salon.imageUrl && (
          <img
            src={salon.imageUrl}
            alt={salon.name}
            className="mb-4 h-40 w-full rounded-xl object-cover"
          />
        )}
        {salon.description && <p className="mb-3 text-sm text-muted">{salon.description}</p>}
        <div className="grid gap-x-6 sm:grid-cols-2">
          <Row label="Owner" value={salon.owner?.name || "Unassigned"} />
          <Row label="Owner Email" value={salon.owner?.email} />
          <Row label="Address" value={salon.address} />
          <Row label="City" value={[salon.location?.city, salon.location?.country].filter(Boolean).join(", ")} />
          <Row label="Phone" value={salon.phone} />
          <Row label="Services" value={salon.servicesCount ?? 0} />
          <Row label="Bookings" value={salon.bookingsCount ?? 0} />
          <Row label="Revenue" value={formatMoney(salon.revenueInPaisa)} />
          <Row label="Commission Rate" value={`${salon.commissionRate ?? 10}%`} />
          <Row label="Approval" value={salon.status} />
          <Row label="Approved By" value={salon.approvedBy?.name || (salon.status === "approved" ? "-" : "Not yet approved")} />
          <Row label="Status" value={salon.active ? "Active" : "Inactive"} />
        </div>

        {salon._id && (
          <div style={{ marginTop: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <h4 className="text-sm font-semibold">Services</h4>
              {isSuspended ? (
                <span className="text-xs text-muted">Suspended salons cannot add services</span>
              ) : (
                <ServiceModal salonId={salon._id} />
              )}
            </div>
            <input
              type="text"
              className="ha-input"
              style={{ marginBottom: 10, maxWidth: 280 }}
              placeholder="Search services by name..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
            />
            <TABLE<ServiceItem>
              noBorder
              queryKey={["salon-services", salon._id]}
              service={serviceService.list}
              serviceParams={{ salonId: salon._id, search: serviceSearch }}
              columns={[
                { title: "Name" },
                { title: "Category" },
                { title: "Duration" },
                { title: "Price" },
                { title: "Description", size: "220px" },
                { title: "AI Scan" },
                { title: "Actions" },
              ]}
              rows={(data) =>
                data?.map((item) => [
                  item.name,
                  item.category || item.categoryId?.name || "-",
                  item.duration ? `${item.duration} min` : "-",
                  item.priceInPaisa != null ? formatMoney(item.priceInPaisa) : "-",
                  item.description || "-",
                  aiScanLabel(item.aiScanLink),
                  <ActionsMenu
                    items={[
                      {
                        label: "Edit",
                        onClick: () => setEditingService(item),
                      },
                      {
                        label: "Delete",
                        danger: true,
                        onClick: () => handleDeleteService(item),
                      },
                    ]}
                  />,
                ])
              }
            />
          </div>
        )}
      </GenericModal>

      {editingService && !isSuspended && (
        <ServiceFormModal
          salonId={salon._id}
          service={editingService}
          onClose={() => setEditingService(null)}
          onSaved={() => invalidate(["salon-services"])}
        />
      )}
    </>
  );
};

export default SalonViewModal;
