import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  searchService,
  type GlobalSearchResult,
  type SearchBooking,
  type SearchCustomer,
  type SearchSalon,
} from "@/services/searchService";

const SEARCHABLE_ROLES = ["super_admin", "admin", "salon_owner", "staff"];

const emptyResults: GlobalSearchResult = { customers: [], bookings: [], salons: [] };

const Searchbar = () => {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const canSearch = role ? SEARCHABLE_ROLES.includes(role) : false;

  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult>(emptyResults);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canSearch) return;
    const query = searchValue.trim();

    const delayDebounce = setTimeout(async () => {
      if (query.length < 2) {
        setResults(emptyResults);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await searchService.global(query);
        setResults(res?.data || emptyResults);
      } catch {
        setResults(emptyResults);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchValue, canSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (path: string) => {
    setShowSuggestions(false);
    setSearchValue("");
    navigate(path);
  };

  const handleCustomerClick = (customer: SearchCustomer) =>
    goTo(`/admin/customers?search=${encodeURIComponent(customer.email || customer.name)}`);

  const handleBookingClick = (booking: SearchBooking) =>
    goTo(`/admin/bookings?customer=${encodeURIComponent(booking.customer?.name || "")}`);

  const handleSalonClick = (salon: SearchSalon) =>
    goTo(`/admin/salons?search=${encodeURIComponent(salon.name)}`);

  const hasResults = results.customers.length > 0 || results.bookings.length > 0 || results.salons.length > 0;
  const trimmedQuery = searchValue.trim();

  return (
    <div className="bg-[var(--surface-soft)] hidden md:block max-w-60 w-52 border border-border border-solid  z-10 relative p-1 rounded-xl  shadow-lg  sm:mx-auto mx-auto">
      <div className="grid grid-cols-12 sm:gap-2 gap-1">
        <div
          className=" col-span-12 flex items-center border-[1px] rounded-md border-none bg-[var(--surface-soft)] px-2 relative"
          ref={searchRef}
        >
          <svg
            viewBox="0 0 24 24"
            className=" h-4 w-4 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            fontSize={"24px"}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search clients, bookings"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className=" !bg-transparent text-xs text-[var(--text)] p-1 !outline-none !border-none placeholder:text-muted"
          />
          {showSuggestions && trimmedQuery.length > 1 && canSearch ? (
            <div className="absolute top-full left-0 right-0 bg-[var(--surface-soft)] border border-[var(--border)] text-left rounded-md shadow-lg z-20 mt-1 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-3 text-xs text-muted">Searching...</div>
              ) : hasResults ? (
                <>
                  {results.customers.length > 0 && (
                    <div>
                      <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Clients
                      </div>
                      {results.customers.map((customer) => (
                        <div
                          key={customer._id}
                          className="px-4 py-2 hover:bg-[var(--surface)] cursor-pointer"
                          onClick={() => handleCustomerClick(customer)}
                        >
                          <div className="text-xs font-medium text-[var(--text)]">{customer.name}</div>
                          <div className="text-[11px] text-muted">{customer.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.bookings.length > 0 && (
                    <div>
                      <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Bookings
                      </div>
                      {results.bookings.map((booking) => (
                        <div
                          key={booking._id}
                          className="px-4 py-2 hover:bg-[var(--surface)] cursor-pointer"
                          onClick={() => handleBookingClick(booking)}
                        >
                          <div className="text-xs font-medium text-[var(--text)]">
                            {booking.customer?.name || "Unknown"} · {booking.salon?.name || "-"}
                          </div>
                          <div className="text-[11px] text-muted">
                            {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : ""} {booking.status || ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.salons.length > 0 && (
                    <div>
                      <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Salons
                      </div>
                      {results.salons.map((salon) => (
                        <div
                          key={salon._id}
                          className="px-4 py-2 hover:bg-[var(--surface)] cursor-pointer"
                          onClick={() => handleSalonClick(salon)}
                        >
                          <div className="text-xs font-medium text-[var(--text)]">{salon.name}</div>
                          <div className="text-[11px] text-muted">{salon.location?.city}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-6 text-center text-muted">
                  <p className="text-sm">No results found</p>
                  <p className="text-xs mt-1">Try different keywords</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Searchbar;
