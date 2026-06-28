import DataTable from "../../components/DataTable";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { customerService } from "../../services/customerService";

const OwnerCustomersPage = () => {
  const { data, loading, error } = useApi(
    () => customerService.list({ page: 1, limit: 50 }),
    [],
  );

  // if (loading) return <LoadingBlock text="Loading customers..." />;
  if (error) return <ErrorBlock text={error} />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customers</h2>
      <DataTable
        loading={loading}
        columns={["Name", "Email", "Status", "Joined"]}
        rows={(data?.data || []).map((item) => [
          item.name,
          item.email,
          item.status,
          new Date(item.createdAt).toLocaleDateString(),
        ])}
      />
    </div>
  );
};

export default OwnerCustomersPage;
