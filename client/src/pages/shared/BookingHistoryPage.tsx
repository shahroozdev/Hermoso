import TABLE from "@/components/table";
import { bookingService } from "../../services/bookingService";
import BookingPage from "./BookingPage";
import { formatTimeAMPM } from "@/utils/format";
import { formatMoney } from "@/utils/money";
import { Booking } from "@/types";
import { Link } from "react-router-dom";

const BookingHistoryPage = () => {
  return (
    <div className="mx-auto container space-y-4">
      <BookingPage />
      <h2 className="text-xl font-semibold">Booking History</h2>
      <TABLE<Booking>
        showPagination
        queryKey={["booking-history"]}
        service={bookingService.list}
        columns={[{ title: "Salon" }, { title: "Service" }, { title: "Date" }, { title: "Status" }, { title: "Amount" }, { title: "Action" }]}
        rows={(data) =>
          data?.map((item) => [
            item.salonId?.name || "-",
            item.serviceId?.name || "-",
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
            formatMoney(item.priceInPaisa),
            <div className="ha-actions">
              {item?.status !== "cancelled" && (
                <button className="ha-act-btn">Cancel</button>
              )}
              {item?.status === "confirmed" && (
                <Link
                  to={`/customer/refund-request?bookingId=${item._id}`}
                  className="ha-act-btn ml-2 text-red-600"
                >
                  Refund
                </Link>
              )}
            </div>,
          ])
        }
      />
    </div>
  );
};

export default BookingHistoryPage;
