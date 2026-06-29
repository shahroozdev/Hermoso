import { reviewService } from "../../services/reviewService";
import TABLE from "@/components/table";

interface ReviewItem {
  customerId?: { name?: string };
  rating?: number;
  comment?: string;
  status?: string;
}

const OwnerReviewsPage = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Reviews</h2>
      <TABLE<ReviewItem>
        title="Reviews List"
        showPagination
        service={reviewService.list}
        columns={[{ title: "Customer" }, { title: "Rating" }, { title: "Comment" }, { title: "Status" }]}
        rows={(data) =>
          data?.map((item) => [
            item.customerId?.name || "-",
            item.rating,
            item.comment,
            item.status,
          ])
        }
      />
    </div>
  );
};

export default OwnerReviewsPage;
