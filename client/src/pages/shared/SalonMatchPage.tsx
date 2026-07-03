import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scanService, type SalonMatch } from '../../services/scanService';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import NoDataFound from '../../components/NoDataFound';

type FilterType = 'all' | 'clinics' | 'salons' | 'open' | 'nearby';

const SalonMatchPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<SalonMatch[]>([]);
  const [allMatches, setAllMatches] = useState<SalonMatch[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [skinConditions, setSkinConditions] = useState<string[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await scanService.getMatches();
        if (res.success && res.data?.matches) {
          setAllMatches(res.data.matches);
          setMatches(res.data.matches);

          // Extract unique skin conditions from matched services (CR-21)
          const conditions = new Set<string>();
          res.data.matches.forEach((match: SalonMatch) => {
            match.matchedServices?.forEach((service) => {
              conditions.add(service);
            });
          });
          setSkinConditions(Array.from(conditions));
        } else {
          setError(res.message || 'No matched salons found. Complete a skin scan first.');
        }
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load matched salons');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // CR-22: Filter by treatment type
  const applyFilter = (filter: FilterType) => {
    setActiveFilter(filter);
    let filtered = [...allMatches];

    switch (filter) {
      case 'clinics':
        filtered = filtered.filter((m) => m.name.toLowerCase().includes('clinic') || m.name.toLowerCase().includes('derma'));
        break;
      case 'salons':
        filtered = filtered.filter((m) => !m.name.toLowerCase().includes('clinic') && !m.name.toLowerCase().includes('derma'));
        break;
      case 'open':
        // In a real app, this would check actual business hours
        filtered = filtered.filter((m) => m.matchPercent > 60);
        break;
      case 'nearby':
        // In a real app, this would use geolocation
        filtered = filtered.slice(0, 5);
        break;
      case 'all':
      default:
        // No filtering
        break;
    }

    setMatches(filtered);
  };

  const handleBooking = (salonId: string, matchedServices: string[]) => {
    // CR-20: Navigate to booking with pre-selected treatments
    navigate('/customer/booking', {
      state: {
        salonId,
        preSelectedTreatments: matchedServices,
        fromAiScan: true,
      },
    });
  };

  if (loading) return <LoadingBlock text="Finding your perfect match..." />;
  if (error) return <ErrorBlock text={error} />;
  if (!matches.length && activeFilter === 'all') {
    return (
      <NoDataFound
        title="No Matches Yet"
        description="Complete an AI skin scan to get personalized salon recommendations."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="shell-panel rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">AI Matched Salons</h2>
            <p className="mt-1 text-sm text-muted">
              {allMatches.length} salon{allMatches.length !== 1 ? 's' : ''} matched to your skin analysis
            </p>
          </div>
          <Link
            to="/customer/scan-results"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-muted hover:border-[var(--accent)] transition-colors"
          >
            View Scan Results
          </Link>
        </div>
      </div>

      {/* CR-21: Skin Condition Chips Header */}
      {skinConditions.length > 0 && (
        <div className="shell-panel rounded-2xl p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Your Skin Concerns</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {skinConditions.map((condition) => (
              <span
                key={condition}
                className="shrink-0 rounded-full bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] border border-[var(--accent)]/20"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CR-22: Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'clinics', label: 'Clinics' },
          { key: 'salons', label: 'Salons' },
          { key: 'open', label: 'High Match' },
          { key: 'nearby', label: 'Top 5' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => applyFilter(filter.key as FilterType)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-[var(--accent-2)] text-[var(--bg)]'
                : 'border border-[var(--border)] text-muted hover:border-[var(--accent)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Matched Salons List */}
      {matches.length === 0 ? (
        <div className="shell-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-muted">No salons match the selected filter.</p>
          <button
            onClick={() => applyFilter('all')}
            className="mt-3 text-sm font-semibold text-[var(--accent)] underline underline-offset-2"
          >
            Show All
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((match) => (
            <div
              key={match.salonId}
              className="shell-panel rounded-2xl p-5 space-y-4 hover:border-[var(--accent)] transition-colors"
            >
              {/* Salon Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{match.name}</h3>
                    {/* CR-23: South Asian Specialist Badge */}
                    {match.southAsianSpecialist && (
                      <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-600 border border-yellow-500/20">
                        ⭐ Gold Specialist
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{match.city}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 1l2 4.2 4.6.6-3.3 3.2.8 4.6L8 11.2 3.9 13.6l.8-4.6L1.4 5.8l4.6-.6L8 1z" />
                    </svg>
                    <span>{match.rating?.toFixed(1) || 'New'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-600">
                    {match.matchPercent}%
                  </span>
                  <p className="text-[10px] text-muted mt-0.5">Match</p>
                </div>
              </div>

              {/* CR-19: Why Matched - Treatment Tags */}
              {match.matchedServices && match.matchedServices.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Why This Match?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matchedServices.map((service, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                        </svg>
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link
                  to={`/customer/salons/${match.salonId}`}
                  className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-center text-sm font-medium text-muted hover:border-[var(--accent)] transition-colors"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleBooking(match.salonId, match.matchedServices || [])}
                  className="flex-1 rounded-xl bg-[var(--accent-2)] px-4 py-2 text-center text-sm font-semibold text-[var(--bg)]"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div className="shell-panel rounded-2xl p-6 text-center">
        <p className="text-sm text-muted mb-3">Not seeing what you need?</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/customer/salons"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-muted"
          >
            Browse All Salons
          </Link>
          <Link
            to="/customer/scan"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-muted"
          >
            Re-scan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SalonMatchPage;
