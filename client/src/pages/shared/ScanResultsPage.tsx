import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { scanService, type ScanHistoryItem, type SalonMatch } from '../../services/scanService';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import NoDataFound from '../../components/NoDataFound';

const DARK_CIRCLE_LABELS: Record<number, string> = {
  1: 'Pigmentation (brownish)',
  2: 'Vascular (bluish/purplish)',
  3: 'Structural (sunken/hollow)',
};

const DARK_CIRCLE_COLORS: Record<number, string> = {
  1: '#a855f7',
  2: '#3b82f6',
  3: '#f59e0b',
};

const ACNE_TYPE_COLORS: Record<string, string> = {
  active: '#ef4444',
  healing: '#f59e0b',
  hormonal: '#ec4899',
  none: '#94a3b8',
};

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const ScoreRing = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SCORE_COLOR(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-soft)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>{score}</span>
    </div>
  );
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="shell-panel rounded-2xl p-5 space-y-3">
    <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">{title}</h3>
    {children}
  </div>
);

const TreatmentTag = ({ label }: { label: string }) => (
  <span className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
    {label}
  </span>
);

const ScanResultsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scan, setScan] = useState<ScanHistoryItem | null>(null);
  const [matches, setMatches] = useState<SalonMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await scanService.getLatest();
        if (res.success) {
          setScan(res.data);
        } else {
          setError(res.message || 'No scan results found');
        }
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load scan results');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!scan?._id) return;
    const fetchMatches = async () => {
      setMatchesLoading(true);
      try {
        const res = await scanService.getMatches();
        if (res.success) setMatches(res.data?.matches || []);
      } catch {
        // silently fail
      } finally {
        setMatchesLoading(false);
      }
    };
    fetchMatches();
  }, [scan?._id]);

  if (loading) return <LoadingBlock text="Loading scan results..." />;
  if (error) return <ErrorBlock text={error} />;
  if (!scan) return <NoDataFound title="No Scan Found" description="Run an AI skin scan first to see your results." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="shell-panel rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Skin Analysis Report</h2>
            <p className="mt-1 text-sm text-muted">
              Scanned on {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Link
            to="/customer/scan"
            className="rounded-xl bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-[var(--bg)]"
          >
            New Scan
          </Link>
        </div>
      </div>

      {scan.summary ? (
        <div className="shell-panel rounded-2xl p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted">Summary</h3>
          <p className="text-sm leading-relaxed">{scan.summary}</p>
        </div>
      ) : null}

      {/* Overall Score (CR-07) */}
      {scan.overallSkinScore ? (
        <div className="shell-panel rounded-2xl p-6 flex items-center justify-center">
          <div className="text-center">
            <ScoreRing score={scan.overallSkinScore} size={140} />
            <p className="mt-2 text-sm font-semibold">Overall Skin Health Score</p>
          </div>
        </div>
      ) : null}

      {/* Skin Tone & Tanning (CR-08) */}
      {scan.skinTone ? (
        <SectionCard title="Skin Tone & Tanning">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Detected Tone</p>
              <p className="text-sm font-semibold capitalize">{scan.skinTone.tone}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Evenness</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${scan.skinTone.evenness}%` }} />
                </div>
                <span className="text-sm font-semibold">{scan.skinTone.evenness}%</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">Tanning Pattern</p>
          <p className="text-sm">{scan.skinTone.tanningPattern}</p>
          {scan.skinTone.recommendedTreatments?.length ? (
            <div className="flex flex-wrap gap-2">
              {scan.skinTone.recommendedTreatments.map((t) => <TreatmentTag key={t} label={t} />)}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Eyebrow Assessment (CR-09) */}
      {scan.eyebrows ? (
        <SectionCard title="Eyebrow Assessment">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted">Arch Shape</p>
              <p className="text-sm font-semibold capitalize">{scan.eyebrows.archShape}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Fullness</p>
              <p className="text-sm font-semibold">{scan.eyebrows.fullness}/5</p>
            </div>
            <div>
              <p className="text-xs text-muted">Symmetry</p>
              <p className="text-sm font-semibold">{scan.eyebrows.leftRightSymmetry}%</p>
            </div>
            <div>
              <p className="text-xs text-muted">Tail Length</p>
              <p className="text-sm font-semibold capitalize">{scan.eyebrows.tailLength}</p>
            </div>
          </div>
          {scan.eyebrows.recommendedTreatments?.length ? (
            <div className="flex flex-wrap gap-2">
              {scan.eyebrows.recommendedTreatments.map((t) => <TreatmentTag key={t} label={t} />)}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Hydration & Texture (CR-10) */}
      {scan.hydration ? (
        <SectionCard title="Hydration & Texture">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Hydration Level</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${scan.hydration.hydrationPercent}%` }} />
                </div>
                <span className="text-sm font-semibold">{scan.hydration.hydrationPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Texture Rating</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${scan.hydration.textureRating}%` }} />
                </div>
                <span className="text-sm font-semibold">{scan.hydration.textureRating}%</span>
              </div>
            </div>
          </div>
          {scan.hydration.dehydrationZones?.length ? (
            <p className="text-sm capitalize"><span className="text-xs text-muted">Dehydration Zones: </span>{scan.hydration.dehydrationZones.join(', ')}</p>
          ) : null}
          {scan.hydration.poreCondition ? (
            <p className="text-sm"><span className="text-xs text-muted">Pores: </span>{scan.hydration.poreCondition}</p>
          ) : null}
          {scan.hydration.recommendedTreatments?.length ? (
            <div className="flex flex-wrap gap-2">
              {scan.hydration.recommendedTreatments.map((t) => <TreatmentTag key={t} label={t} />)}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Dark Circles (CR-11) */}
      {scan.darkCircles ? (
        <SectionCard title="Dark Circles & Under-Eye">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Type</p>
              <p className="text-sm font-semibold" style={{ color: DARK_CIRCLE_COLORS[scan.darkCircles.type] }}>
                Type {scan.darkCircles.type} — {DARK_CIRCLE_LABELS[scan.darkCircles.type]}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Severity</p>
              <p className="text-sm font-semibold capitalize">{scan.darkCircles.severity}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Color Delta</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${scan.darkCircles.colorDelta}%`, backgroundColor: DARK_CIRCLE_COLORS[scan.darkCircles.type] }} />
                </div>
                <span className="text-sm font-semibold">{Math.round(scan.darkCircles.colorDelta)}%</span>
              </div>
            </div>
          </div>
          {scan.darkCircles.recommendedTreatments?.length ? (
            <div className="flex flex-wrap gap-2">
              {scan.darkCircles.recommendedTreatments.map((t) => <TreatmentTag key={t} label={t} />)}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Acne (CR-12) */}
      {scan.acne ? (
        <SectionCard title="Acne & Breakout Zones">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Overall Severity</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${scan.acne.overallSeverity}%` }} />
                </div>
                <span className="text-sm font-semibold">{scan.acne.overallSeverity}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Affected Zones</p>
              <p className="text-sm capitalize">
                {scan.acne.zones?.filter((z) => z.type !== 'none').map((z) => z.area).join(', ') || 'None detected'}
              </p>
            </div>
          </div>
          {scan.acne.zones?.filter((z) => z.type !== 'none').length ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {scan.acne.zones.filter((z) => z.type !== 'none').map((zone) => (
                <div key={zone.area} className="rounded-lg border border-[var(--border)] p-3">
                  <p className="text-xs font-semibold capitalize">{zone.area}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${zone.severity}%` }} />
                    </div>
                    <span className="text-xs font-medium">{zone.severity}%</span>
                  </div>
                  <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${ACNE_TYPE_COLORS[zone.type]}15`, color: ACNE_TYPE_COLORS[zone.type] }}>
                    {zone.type}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {scan.acne.recommendedTreatments?.length ? (
            <div className="flex flex-wrap gap-2">
              {scan.acne.recommendedTreatments.map((t) => <TreatmentTag key={t} label={t} />)}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Lip Pigmentation (CR-13) */}
      {scan.lipPigmentation ? (
        <SectionCard title="Lip Pigmentation">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Darkness Level</p>
              <p className="text-sm font-semibold capitalize">{scan.lipPigmentation.darknessLevel}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Melanin Index</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full bg-pink-600" style={{ width: `${scan.lipPigmentation.melaninIndex}%` }} />
                </div>
                <span className="text-sm font-semibold">{scan.lipPigmentation.melaninIndex}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Unevenness</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${scan.lipPigmentation.unevenness}%` }} />
                </div>
                <span className="text-sm font-semibold">{scan.lipPigmentation.unevenness}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Dryness Level</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${scan.lipPigmentation.drynessLevel}%` }} />
                </div>
                <span className="text-sm font-semibold">{scan.lipPigmentation.drynessLevel}%</span>
              </div>
            </div>
          </div>
          {scan.lipPigmentation.recommendedTreatments?.length ? (
            <div className="flex flex-wrap gap-2">
              {scan.lipPigmentation.recommendedTreatments.map((t) => <TreatmentTag key={t} label={t} />)}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Treatment Priority Plan (CR-14) */}
      {scan.treatmentPlan?.length ? (
        <SectionCard title="AI Treatment Priority Plan">
          <div className="space-y-3">
            {scan.treatmentPlan.sort((a, b) => a.priority - b.priority).map((item) => (
              <div key={item.priority} className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${item.priority === 1 ? 'bg-rose-500' : item.priority === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {item.priority}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.treatmentName}</p>
                      <p className="text-xs text-muted mt-0.5">{item.reason}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted">
                  <span>PKR {item.pkrPriceRange}</span>
                  <span>{item.estimatedDuration}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Diet & Nutrition Plan (CR-15) */}
      {scan.dietPlan ? (
        <SectionCard title="Diet & Nutrition Plan">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">Foods to Eat</p>
              <ul className="space-y-2">
                {scan.dietPlan.foodsToEat.map((item) => (
                  <li key={item.food} className="flex gap-2 text-xs">
                    <span className="mt-0.5 shrink-0 text-emerald-500">+</span>
                    <div>
                      <span className="font-medium">{item.food}</span>
                      <span className="text-muted"> — {item.reason}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Foods to Avoid</p>
              <ul className="space-y-2">
                {scan.dietPlan.foodsToAvoid.map((item) => (
                  <li key={item.food} className="flex gap-2 text-xs">
                    <span className="mt-0.5 shrink-0 text-rose-500">−</span>
                    <div>
                      <span className="font-medium">{item.food}</span>
                      <span className="text-muted"> — {item.reason}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-[var(--surface-soft)] p-3">
            <p className="text-xs text-muted">Daily Water Intake</p>
            <p className="text-sm font-semibold">{scan.dietPlan.dailyWaterIntake}</p>
          </div>
        </SectionCard>
      ) : null}

      {/* Matched Salons */}
      {matches.length ? (
        <div className="shell-panel rounded-2xl p-6">
          <h3 className="mb-1 text-lg font-semibold">Matched Salons</h3>
          <p className="mb-4 text-sm text-muted">Salons offering treatments aligned with your scan results</p>
          {matchesLoading ? (
            <p className="text-sm text-muted">Loading matches...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((match) => (
                <Link
                  key={match.salonId}
                  to={`/customer/salons/${match.salonId}`}
                  className="rounded-xl border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{match.name}</p>
                        {match.southAsianSpecialist && (
                          <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-600">Gold</span>
                        )}
                      </div>
                      <p className="text-xs text-muted">{match.city}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                      {match.matchPercent}% Match
                    </span>
                  </div>
                  {match.matchedServices?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {match.matchedServices.map((s, i) => (
                        <span key={i} className="rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                          {s} ✓
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="flex gap-3">
        <Link
          to="/customer/scan"
          className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-medium text-muted"
        >
          New Scan
        </Link>
        <Link
          to="/customer/progress"
          className="flex-1 rounded-xl bg-[var(--accent-2)] px-4 py-3 text-center text-sm font-semibold text-[var(--bg)]"
        >
          View Progress
        </Link>
      </div>
    </div>
  );
};

export default ScanResultsPage;
