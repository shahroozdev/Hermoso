import GenericModal from '@/components/GenericModal';
import { useMemo, useState } from "react";
import AdminPageSkeleton from "../../components/skeletons/AdminPageSkeleton";
import ErrorBlock from "../../components/ErrorBlock";
import TABLE from "@/components/table";
import RangeFilter from "@/components/form/RangeFilter";
import { useApi } from "../../hooks/useApi";
import { useInvalidate } from "../../hooks/useInvalidate";
import { salonService } from "../../services/salonService";
import { settingsService } from "../../services/settingsService";
import { useToastStore } from "../../store/toastStore";
import { paisaToRupees, rupeesToPaisa } from "../../utils/money";

interface RevenueItem {
  name: string;
  bookingsCount?: number;
  grossRevenueInPaisa?: number;
  commissionRate?: number;
  platformRevenueInPaisa?: number;
  salonNetRevenueInPaisa?: number;
}

const DEFAULT_RATES = {
  defaultRate: 10,
  vipRate: 8,
  eventRate: 12,
  promoRate: 0,
};

const COMMISSION_FIELDS: { key: keyof typeof DEFAULT_RATES; title: string; sub: string }[] = [
  { key: "defaultRate", title: "Default Commission", sub: "Applied to new salons" },
  { key: "vipRate", title: "VIP Salons Rate", sub: "Top 10% by revenue" },
  { key: "eventRate", title: "Event Bookings Rate", sub: "Bridal, party packages" },
  { key: "promoRate", title: "Launch Promo Rate", sub: "First 50 salons · 3 months" },
];

// Value is expected in paisa; formats the rupee amount compactly (1.2M, 45K).
const compactMoney = (valueInPaisa: number) => {
  const n = paisaToRupees(valueInPaisa);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

const AdminRevenuePage = () => {
  const [showCommission, setShowCommission] = useState(false);
  const [comparisons, setComparisons] = useState<Record<string, string>>({});
  // `ratesOverride` holds the user's in-progress edits; until they touch a field,
  // the displayed rates are derived straight from the loaded settings (no effect
  // needed to sync state — see `rates` below).
  const [ratesOverride, setRatesOverride] = useState<
    typeof DEFAULT_RATES | null
  >(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToastStore();
  const invalidate = useInvalidate();

  const [search, setSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [bookingsMin, setBookingsMin] = useState("");
  const [bookingsMax, setBookingsMax] = useState("");
  const [grossMin, setGrossMin] = useState("");
  const [grossMax, setGrossMax] = useState("");
  const [commissionMin, setCommissionMin] = useState("");
  const [commissionMax, setCommissionMax] = useState("");
  const [platformMin, setPlatformMin] = useState("");
  const [platformMax, setPlatformMax] = useState("");

  const statsReq = useApi(
    () => salonService.getRevenueStats(),
    ["revenue-stats"],
  );
  const settingsReq = useApi(
    () => settingsService.get(),
    ["platform-settings"],
  );

  const loadedRates = useMemo(() => {
    const commissionRules = settingsReq.data?.data?.commissionRules;
    if (!commissionRules) return DEFAULT_RATES;
    return {
      defaultRate: commissionRules.defaultRate ?? DEFAULT_RATES.defaultRate,
      vipRate: commissionRules.vipRate ?? DEFAULT_RATES.vipRate,
      eventRate: commissionRules.eventRate ?? DEFAULT_RATES.eventRate,
      promoRate: commissionRules.promoRate ?? DEFAULT_RATES.promoRate,
    };
  }, [settingsReq.data]);

  const rates = ratesOverride ?? loadedRates;

  const kpi = useMemo(
    () => ({
      totalGMVInPaisa: statsReq.data?.data?.totalGMVInPaisa ?? 0,
      platformCommissionInPaisa:
        statsReq.data?.data?.platformCommissionInPaisa ?? 0,
      pendingPayouts: statsReq.data?.data?.pendingPayouts ?? 0,
      pendingPayoutAmountInPaisa:
        statsReq.data?.data?.pendingPayoutAmountInPaisa ?? 0,
      avgBookingValueInPaisa: statsReq.data?.data?.avgBookingValueInPaisa ?? 0,
    }),
    [statsReq.data],
  );

  const hasActiveFilters = Boolean(
    search ||
    bookingsMin ||
    bookingsMax ||
    grossMin ||
    grossMax ||
    commissionMin ||
    commissionMax ||
    platformMin ||
    platformMax,
  );

  const clearFilters = () => {
    setComparisons({});
    setSearch("");
    setBookingsMin("");
    setBookingsMax("");
    setGrossMin("");
    setGrossMax("");
    setCommissionMin("");
    setCommissionMax("");
    setPlatformMin("");
    setPlatformMax("");
  };

  const saveRules = async () => {
    setSaving(true);
    try {
      await settingsService.update({ commissionRules: rates });
      invalidate(["platform-settings"]);
      setRatesOverride(null);
      setShowCommission(false);
      showToast("Commission rules saved successfully.");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save commission rules";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (statsReq.loading || settingsReq.loading)
    return <AdminPageSkeleton variant="split" />;
  if (statsReq.error) return <ErrorBlock text={statsReq.error} />;
  if (settingsReq.error) return <ErrorBlock text={settingsReq.error} />;

  return (
    <div className="ha-revenue-page">
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Total GMV This Month</div>
          <div className="ha-kpi-val">{compactMoney(kpi.totalGMVInPaisa)}</div>
          <div className="ha-kpi-change up">PKR · live platform volume</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Platform Commission</div>
          <div className="ha-kpi-val">
            {compactMoney(kpi.platformCommissionInPaisa)}
          </div>
          <div className="ha-kpi-change up">PKR · across salons</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Payouts Pending</div>
          <div className="ha-kpi-val white">{kpi.pendingPayouts}</div>
          <div className="ha-kpi-change" style={{ color: "var(--amber)" }}>
            PKR {compactMoney(kpi.pendingPayoutAmountInPaisa)} due
          </div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Avg Booking Value</div>
          <div className="ha-kpi-val">
            {paisaToRupees(kpi.avgBookingValueInPaisa).toLocaleString()}
          </div>
          <div className="ha-kpi-change up">PKR per booking</div>
        </div>
      </div>

      <div className="ha-revenue-body">
        <div className="ha-card ha-commission-overview">
          <div className="ha-commission-overview-header">
            <div>
              <div className="ha-card-title" style={{ marginBottom: 4 }}>Commission Rate Controls</div>
              <p className="text-xs text-muted">Platform commission applied per booking category</p>
            </div>
            <button className="ha-act-btn" onClick={() => setShowCommission(true)}>Edit Commission Rates</button>
          </div>
          <div className="ha-commission-tiles">
            {COMMISSION_FIELDS.map((field) => (
              <div key={field.key} className="ha-commission-tile">
                <div className="ha-commission-tile-label">{field.title}</div>
                <div className="ha-commission-tile-value">{loadedRates[field.key]}%</div>
                <div className="ha-commission-tile-sub">{field.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {showCommission && (
          <GenericModal
            title="Edit Commission Rates"
            wide
            onClose={() => { if (!saving) { setShowCommission(false); setRatesOverride(null); } }}
            footer={
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  className="ha-btn-secondary"
                  onClick={() => { setShowCommission(false); setRatesOverride(null); }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="ha-topbar-btn primary" style={{ width: "auto" }} onClick={saveRules} disabled={saving}>
                  {saving ? "Saving..." : "Save Commission Rules"}
                </button>
              </div>
            }
          >
            <p className="text-xs text-muted" style={{ marginBottom: 4 }}>
              These rates apply platform-wide and take effect immediately after saving.
            </p>
            <div className="ha-commission-edit-grid">
              {COMMISSION_FIELDS.map((field) => (
                <div key={field.key} className="ha-commission-edit-row">
                  <div className="ha-commission-edit-info">
                    <div className="ha-salon-name" style={{ fontSize: 13 }}>{field.title}</div>
                    <div className="ha-salon-sub">{field.sub}</div>
                  </div>
                  <div className="ha-commission-edit-control">
                    <input
                      className="ha-input"
                      type="number"
                      min="0"
                      max="100"
                      aria-label={field.title}
                      value={rates[field.key]}
                      onChange={(e) =>
                        setRatesOverride((prev) => ({
                          ...(prev ?? loadedRates),
                          [field.key]: Number(e.target.value || 0),
                        }))
                      }
                    />
                    <span className="ha-commission-edit-suffix">%</span>
                  </div>
                </div>
              ))}
            </div>
          </GenericModal>
        )}
        <div className="ha-card ha-revenue-records" style={{ paddingBottom: 0 }}>
          <div className="ha-card-title">Revenue by Salon This Month</div>

          <div className="ha-filter-bar"
          >
            <input
              type="text"
              className="ha-input"
              style={{ maxWidth: 320 }}
              placeholder="Search salons by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="ha-btn-secondary"
              onClick={() => setShowMoreFilters((v) => !v)}
            >
              {showMoreFilters ? "Hide Filters" : "More Filters"}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="ha-btn-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          {showMoreFilters && (
            <div
              className="ha-card"
              style={{ marginBottom: 12, background: "var(--surface-soft)" }}
            >
              <div className="ha-filter-grid"
              >
                <RangeFilter operator={comparisons.bookingsOp} onOperator={op => setComparisons(prev => ({...prev, bookingsOp: op}))}
                  label="Bookings"
                  min={bookingsMin}
                  max={bookingsMax}
                  onMin={setBookingsMin}
                  onMax={setBookingsMax}
                />
                <RangeFilter operator={comparisons.grossOp} onOperator={op => setComparisons(prev => ({...prev, grossOp: op}))}
                  label="Gross PKR"
                  min={grossMin}
                  max={grossMax}
                  onMin={setGrossMin}
                  onMax={setGrossMax}
                />
                <RangeFilter operator={comparisons.commissionOp} onOperator={op => setComparisons(prev => ({...prev, commissionOp: op}))}
                  label="Commission %"
                  min={commissionMin}
                  max={commissionMax}
                  onMin={setCommissionMin}
                  onMax={setCommissionMax}
                />
                <RangeFilter operator={comparisons.platformOp} onOperator={op => setComparisons(prev => ({...prev, platformOp: op}))}
                  label="Platform Earned"
                  min={platformMin}
                  max={platformMax}
                  onMin={setPlatformMin}
                  onMax={setPlatformMax}
                />
              </div>
            </div>
          )}

          <TABLE<RevenueItem>
            noBorder
            showPagination
            queryKey={["admin-revenue"]}
            service={salonService.revenue}
            serviceParams={{
              ...comparisons,
              search,
              ...(bookingsMin ? { bookingsMin } : {}),
              ...(bookingsMax ? { bookingsMax } : {}),
              ...(grossMin
                ? { grossMin: rupeesToPaisa(Number(grossMin)) }
                : {}),
              ...(grossMax
                ? { grossMax: rupeesToPaisa(Number(grossMax)) }
                : {}),
              ...(commissionMin ? { commissionMin } : {}),
              ...(commissionMax ? { commissionMax } : {}),
              ...(platformMin
                ? { platformMin: rupeesToPaisa(Number(platformMin)) }
                : {}),
              ...(platformMax
                ? { platformMax: rupeesToPaisa(Number(platformMax)) }
                : {}),
            }}
            columns={[
              { title: "Salon" },
              { title: "Bookings" },
              { title: "Gross PKR" },
              { title: "Commission %" },
              { title: "Platform Earned" },
            ]}
            rows={(data) =>
              data?.map((item) => [
                <span className="ha-salon-name" style={{ fontSize: 14 }}>
                  {item.name}
                </span>,
                item.bookingsCount ?? 0,
                <span className="ha-money">
                  {compactMoney(Number(item.grossRevenueInPaisa ?? 0))}
                </span>,
                `${Number(item.commissionRate ?? 0)}%`,
                <span style={{ color: "var(--green)", fontWeight: 700 }}>
                  {compactMoney(Number(item.platformRevenueInPaisa ?? 0))}
                </span>,
              ])
            }
          />
        </div>


      </div>
    </div>
  );
};

export default AdminRevenuePage;
