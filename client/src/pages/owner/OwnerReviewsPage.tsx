import DataTable from "../../components/DataTable";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { reviewService } from "../../services/reviewService";

const OwnerReviewsPage = () => {
  const { data, loading, error } = useApi(
    () => reviewService.list({ page: 1, limit: 50 }),
    [],
  );

  if (error) return <ErrorBlock text={error} />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Reviews</h2>
      <DataTable
        loading={loading}
        columns={["Customer", "Rating", "Comment", "Status"]}
        rows={(data?.data || []).map((item) => [
          item.customerId?.name || "-",
          item.rating,
          item.comment,
          item.status,
        ])}
      />
    </div>
  );
};

export default OwnerReviewsPage;
