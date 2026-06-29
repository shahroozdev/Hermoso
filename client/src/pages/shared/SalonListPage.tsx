import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TABLE from "@/components/table";
import { salonService } from "../../services/salonService";

export interface SalonItem {
  _id: string;
  name: string;
  location?: { city?: string };
  address?: string;
  avgRating?: number;
  totalReviews?: number;
  totalBookings?: number;
  totalRevenue?: number;
  commissionEarned?: number;
  status?: "approved" | "pending" | "suspended";
  isActive?: boolean;
  reviewsCount?: number;
  owner?:Record<string, string>;
  servicesCount?:number;
  bookingsCount?:number;
  revenue?:number;
  commissionRate?:number;
  active?:string
}

const SalonListPage = () => {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [cities, setCities] = useState<string[]>(["all"]);

  useEffect(() => {
    salonService.getCities().then((res) => {
      if (res?.data) setCities(["all", ...res.data]);
    });
  }, []);
  return (
    <div className="mx-auto container space-y-6 p-6">
      <div className="shell-panel rounded-2xl p-4">
        <h2 className="text-xl font-semibold">Find Salons</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            className="rounded border p-2"
            placeholder="Search salon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="ha-select"
            style={{ minWidth: 140, padding: "6px 10px" }}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            {cities.map((city: string) => (
              <option key={city} value={city}>
                {city === "all" ? "All Cities" : city}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TABLE<SalonItem>
        title="All Salons & Clinics"
        showPagination
        service={salonService.list}
        serviceParams={{ search, ...(cityFilter !== "all" ? { city: cityFilter, search } : { search }) }}
        columns={[{ title: "Salon" }, { title: "City" }, { title: "Address" }]}
        rows={(data) =>
          data?.map((salon) => [
            <Link
              key={salon._id}
              className="font-semibold text-primary underline-offset-2 hover:underline"
              to={`/customer/booking?salonId=${salon._id}`}
            >
              {salon.name}
            </Link>,
            salon.location?.city || "-",
            salon.address,
          ])
        }
      />
    </div>
  );
};

export default SalonListPage;
