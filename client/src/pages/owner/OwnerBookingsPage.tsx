import OwnerRecordsPage from "@/components/OwnerRecordsPage";
import { bookingService } from "@/services/bookingService";
import { Booking } from "@/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useInvalidate } from "@/hooks/useInvalidate";
import { useToastStore } from "@/store/toastStore";
const OwnerBookingsPage = () => {
  const confirmation = useConfirmAction();
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
  const update = async (id: string, status: string) => {
    try {
      await bookingService.updateStatus(id, status);
      invalidate(["owner-bookings"]);
      showToast("Booking updated.");
    } catch {
      showToast("Unable to update booking.", "error");
    }
  };
  const row = (item: Booking) => [
    item.customerId?.name || "-",
    item.serviceId?.name || "-",
    item.staffId?.name || "-",
    [item.bookingDate?.slice(0, 10), item.bookingTime]
      .filter(Boolean)
      .join(" ") || "-",
    item.status || "-",
  ];
  return (
    <>
      <OwnerRecordsPage<Booking>
        title="Bookings"
        queryKey="owner-bookings"
        service={bookingService.list}
        filters={[
          { key: "customer", label: "Customer" },
          { key: "service", label: "Service" },
          { key: "staff", label: "Staff" },
          { key: "fromDate", label: "From Date", type: "date" },
          { key: "toDate", label: "To Date", type: "date" },
          {
            key: "status",
            label: "Status",
            options: ["pending", "confirmed", "completed", "cancelled"],
          },
        ]}
        columns={["Customer", "Service", "Staff", "Date", "Status", "Action"]}
        exportColumns={["Customer", "Service", "Staff", "Date", "Status"]}
        exportRow={row}
        rows={(items) =>
          items.map((item) => [
            ...row(item),
            <div className="ha-actions">
              {["pending", "confirmed"].includes(item.status) && (
                <button
                  className="ha-act-btn"
                  onClick={() =>
                    confirmation.ask(
                      "Cancel Booking",
                      "Cancel this booking? Any applicable refund will follow the booking cancellation policy.",
                      () => update(item._id, "cancelled"),
                    )
                  }
                >
                  Cancel
                </button>
              )}
              {item.status === "pending" && (
                <button
                  className="ha-act-btn"
                  onClick={() =>
                    confirmation.ask(
                      "Confirm Booking",
                      "Are you sure you want to confirm this booking?",
                      () => update(item._id, "confirmed"),
                      "Confirm",
                    )
                  }
                >
                  Confirm
                </button>
              )}
            </div>,
          ])
        }
      />
      {confirmation.modal}
    </>
  );
};
export default OwnerBookingsPage;
