import GenericModal from "./GenericModal";
import ServiceModal from "./ServiceModal";
import TABLE from "./table";
import { serviceService } from "@/services/serviceService";

interface ServiceItem {
  name?: string;
  category?: string;
  categoryId?: { name?: string };
  duration?: number;
  price?: number;
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
    revenue?: number;
    commissionRate?: number;
    status?: string;
    active?: boolean;
    imageUrl?: string;
  };
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-[var(--border-soft)] py-2 text-sm last:border-b-0">
    <span className="text-muted">{label}</span>
    <span className="font-medium">{value ?? "-"}</span>
  </div>
);

const SalonViewModal = ({ salon, onClose }: SalonViewModalProps) => (
  <GenericModal
    title={salon.name || "Salon Details"}
    onClose={onClose}
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
    <Row label="Owner" value={salon.owner?.name || "Unassigned"} />
    <Row label="Owner Email" value={salon.owner?.email} />
    <Row label="Address" value={salon.address} />
    <Row label="City" value={[salon.location?.city, salon.location?.country].filter(Boolean).join(", ")} />
    <Row label="Phone" value={salon.phone} />
    <Row label="Services" value={salon.servicesCount ?? 0} />
    <Row label="Bookings" value={salon.bookingsCount ?? 0} />
    <Row label="Revenue" value={Math.round(salon.revenue || 0).toLocaleString()} />
    <Row label="Commission Rate" value={`${salon.commissionRate ?? 10}%`} />
    <Row label="Status" value={salon.status} />
    <Row label="Active" value={salon.active ? "Yes" : "No"} />

    {salon._id && (
      <div style={{ marginTop: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <h4 className="text-sm font-semibold">Services</h4>
          <ServiceModal salonId={salon._id} />
        </div>
        <TABLE<ServiceItem>
          noBorder
          queryKey={["salon-services", salon._id]}
          service={serviceService.list}
          serviceParams={{ salonId: salon._id }}
          columns={[{ title: "Name" }, { title: "Category" }, { title: "Duration" }, { title: "Price" }]}
          rows={(data) =>
            data?.map((item) => [
              item.name,
              item.category || item.categoryId?.name || "-",
              item.duration ? `${item.duration} min` : "-",
              item.price != null ? item.price.toLocaleString() : "-",
            ])
          }
        />
      </div>
    )}
  </GenericModal>
);

export default SalonViewModal;
