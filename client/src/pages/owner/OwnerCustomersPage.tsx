import { customerService } from "../../services/customerService";
import TABLE from "@/components/table";

interface CustomerItem {
  name?: string;
  email?: string;
  status?: string;
  createdAt?: string;
}

const OwnerCustomersPage = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customers</h2>
      <TABLE<CustomerItem>
        title="Customers List"
        showPagination
        service={customerService.list}
        columns={[{ title: "Name" }, { title: "Email" }, { title: "Status" }, { title: "Joined" }]}
        rows={(data) =>
          data?.map((item) => [
            item.name,
            item.email,
            item.status,
            item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
          ])
        }
      />
    </div>
  );
};

export default OwnerCustomersPage;
