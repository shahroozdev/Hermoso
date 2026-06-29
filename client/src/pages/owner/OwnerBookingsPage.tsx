import { bookingService } from "../../services/bookingService";
import { formatTimeAMPM } from "@/utils/format";
import TABLE from "@/components/table";
import { Booking } from "@/types";

const OwnerBookingsPage = () => {

  const updateStatus = async (id, status) => {
    try {
      await bookingService.updateStatus(id, status);
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bookings</h2>
      {/* <div className="shell-panel rounded-2xl p-6">
        <div className="h-28 rounded bg-gradient-to-r from-amber-100 to-rose-100" />
      </div> */}
      <TABLE<Booking>
        title="Bookings List"
        showPagination
        service={bookingService.list}
        columns={[
          { title: "Customer" },
          { title: "Service" },
          { title: "Staff" },
          { title: "Date" },
          { title: "Status" },
          { title: "Action" },
        ]}
        rows={(data) =>
          data?.map((item) => [
              item.customerId?.name || "-",
              item.serviceId?.name || "-",
              item.staffId?.name || "-",
              <p>
                {new Date(item.bookingDate).toLocaleDateString()} <br />
                <span className="text-gray-400">
                  {formatTimeAMPM(item.bookingTime)}
                </span>
              </p>,
              <p
                className={`w-20 text-center rounded-full px-2.5 py-0.5 text-xs capitalize font-medium ${item.status === "confirmed" ? "bg-green-100 text-green-800" : item.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
              >
                {item.status}
              </p>,
              <div className="ha-actions">
                {item.status !== "cancelled" && (
                  <button
                    className="ha-act-btn"
                    onClick={() => updateStatus(item?._id, "cancelled")}
                  >
                    Cancel
                  </button>
                )}
                {item.status === "pending" && (
                  <button
                    className="ha-act-btn"
                    onClick={() => updateStatus(item?._id, "confirmed")}
                  >
                    Confirm
                  </button>
                )}
              </div>,
            ]
          )
        }
      />
    </div>
  );
};

export default OwnerBookingsPage;
