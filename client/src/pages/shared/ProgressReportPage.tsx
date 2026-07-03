import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { scanService, type ScanHistoryItem, type ScanImprovementsData } from '../../services/scanService';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import NoDataFound from '../../components/NoDataFound';

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const ProgressReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [improvements, setImprovements] = useState<ScanImprovementsData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const [histRes, imprRes] = await Promise.all([
          scanService.getHistory(),
          scanService.getImprovements(),
        ]);
        if (histRes.success) setHistory(histRes.data || []);
        if (imprRes.success) setImprovements(imprRes.data);
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingBlock text="Loading progress report..." />;
  if (error) return <ErrorBlock text={error} />;
  if (!history.length) return <NoDataFound title="No Scan History" description="Complete at least one AI skin scan to see your progress." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="shell-panel rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Progress Report</h2>
            <p className="mt-1 text-sm text-muted">
              {history.length} scan{history.length > 1 ? 's' : ''} completed
              {improvements?.scansCount && improvements.scansCount > 1
                ? ` · Tracking over ${improvements.scansCount} scans`
                : ''}
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

      {improvements?.overallImprovement ? (
        <div className="shell-panel rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Overall Skin Health Trend
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">First scan</span>
                <span className="font-semibold" style={{ color: SCORE_COLOR(improvements.overallImprovement.before) }}>
                  {improvements.overallImprovement.before}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${improvements.overallImprovement.before}%`, backgroundColor: SCORE_COLOR(improvements.overallImprovement.before) }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Latest scan</span>
                <span className="font-semibold" style={{ color: SCORE_COLOR(improvements.overallImprovement.after) }}>
                  {improvements.overallImprovement.after}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${improvements.overallImprovement.after}%`, backgroundColor: SCORE_COLOR(improvements.overallImprovement.after) }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted">Change</p>
              <p className={`text-2xl font-bold ${improvements.overallImprovement.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {improvements.overallImprovement.positive ? '+' : ''}{improvements.overallImprovement.delta}
              </p>
              <p className="text-xs text-muted">points</p>
            </div>
          </div>
          {improvements.firstScanAt && improvements.latestScanAt ? (
            <p className="mt-4 text-xs text-muted text-center">
              From {new Date(improvements.firstScanAt).toLocaleDateString()} to{' '}
              {new Date(improvements.latestScanAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      ) : improvements?.scansCount && improvements.scansCount > 1 ? (
        <div className="shell-panel rounded-2xl p-6 text-center">
          <p className="text-sm text-muted">Improvement data unavailable for current scans.</p>
        </div>
      ) : (
        <div className="shell-panel rounded-2xl p-6 text-center">
          <p className="text-sm text-muted">Complete at least 2 scans to see your improvement trends.</p>
        </div>
      )}

      <div className="shell-panel rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">Scan History</h3>
        <div className="divide-y divide-[var(--border)]">
          {history.map((item) => (
            <div key={item._id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">
                  {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-muted">
                  {item.skinTone?.tone ? (
                    <span className="capitalize">{item.skinTone.tone}</span>
                  ) : (
                    `${item.metrics?.length || 0} metrics`
                  )}
                  {item.treatmentPlan?.length ? ` · ${item.treatmentPlan.length} treatments recommended` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: SCORE_COLOR(item.overallSkinScore) }}>
                  {item.overallSkinScore}%
                </p>
                <p className="text-[10px] text-muted">Skin Score</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to="/customer/scan"
          className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-medium text-muted"
        >
          New Scan
        </Link>
        <Link
          to="/customer/scan-results"
          className="flex-1 rounded-xl bg-[var(--accent-2)] px-4 py-3 text-center text-sm font-semibold text-[var(--bg)]"
        >
          Latest Results
        </Link>
      </div>
    </div>
  );
};

export default ProgressReportPage;
