import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import LoadingBlock from "../../components/LoadingBlock";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { salonService } from "../../services/salonService";

const SalonListPage = () => {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const { data, loading, error } = useApi(
    () =>
      salonService.list({
        page: 1,
        limit: 50,
        search,
        ...(cityFilter !== "all" ? { city: cityFilter, search } : { search }),
      }),
    [search, cityFilter],
  );

  const rows = useMemo(() => {
    return (data?.data || []).map((salon) => [
      <Link
        key={salon._id}
        className="font-semibold text-primary underline-offset-2 hover:underline"
        to={`/customer/booking?salonId=${salon._id}`}
      >
        {salon.name}
      </Link>,
      salon.location?.city || "-",
      salon.address,
      // `${salon.commissionRate}%`
    ]);
  }, [data]);
  const cities = useMemo(() => {
    return [
      "all",
      ...new Set(
        (data?.data || []).map((s) => s.location?.city).filter(Boolean),
      ),
    ];
  }, [data]);
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
          {/* <input
            className="rounded border p-2"
            placeholder="Location filter available in API query"
            disabled
          />
          <input
            className="rounded border p-2"
            placeholder="Service filter available in booking flow"
            disabled
          /> */}
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
      <div className="ha-card-title">All Salons & Clinics</div>
      {error ? <ErrorBlock text={error} /> : null}
      <DataTable
        loading={loading}
        columns={["Salon", "City", "Address"]}
        rows={rows}
      />
    </div>
  );
};

export default SalonListPage;
