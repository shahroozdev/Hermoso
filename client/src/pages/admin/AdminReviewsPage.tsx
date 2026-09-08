import { useMemo, useState } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import TABLE from '@/components/table';
import SearchableSelect from '@/components/form/SearchableSelect';
import ConfirmModal from '@/components/ConfirmModal';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { useToastStore } from '../../store/toastStore';
import { reviewService } from '../../services/reviewService';
import { downloadCsv } from '@/utils';

interface ReviewItem {
  _id: string;
  customerId?: { name?: string };
  salonId?: { name?: string; location?: { city?: string } };
  rating?: number;
  comment?: string;
  reply?: string;
  status?: string;
}

const stars = (rating: number) => {
  const full = Math.max(0, Math.min(5, Number(rating || 0)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

const AdminReviewsPage = () => {
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
  const statsReq = useApi(() => reviewService.getStats(), ["review-stats"]);

  const [customerFilter, setCustomerFilter] = useState('');
  const [salonFilter, setSalonFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmModerateAll, setConfirmModerateAll] = useState(false);
  const [moderatingAll, setModeratingAll] = useState(false);

  const stats = useMemo(() => ({
    averageRating: statsReq.data?.data?.averageRating ?? 0,
    totalReviews: statsReq.data?.data?.totalReviews ?? 0,
    flaggedCount: statsReq.data?.data?.flaggedCount ?? 0,
    approvedPercentage: statsReq.data?.data?.approvedPercentage ?? 0,
  }), [statsReq.data]);

  const hasActiveFilters = Boolean(customerFilter || salonFilter || ratingFilter !== 'all' || statusFilter !== 'all' || search);

  const clearFilters = () => {
    setCustomerFilter('');
    setSalonFilter('');
    setRatingFilter('all');
    setStatusFilter('all');
    setSearch('');
  };

  const filterParams = {
    ...(customerFilter ? { customer: customerFilter } : {}),
    ...(salonFilter ? { salon: salonFilter } : {}),
    ...(ratingFilter !== 'all' ? { rating: ratingFilter } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
  };

  const moderate = async (id: string, status: string) => {
    try {
      await reviewService.moderate(id, status as 'approved' | 'flagged' | 'deleted');
      invalidate();
      showToast('Review status updated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to moderate review', 'error');
    }
  };

  const handleModerateAll = async () => {
    setModeratingAll(true);
    try {
      const res = await reviewService.moderateAll();
      invalidate();
      showToast(`Approved ${res?.data?.modifiedCount ?? 0} pending review(s).`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to moderate reviews', 'error');
    } finally {
      setModeratingAll(false);
      setConfirmModerateAll(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await reviewService.list({ limit: 1000, ...filterParams });
      const items: ReviewItem[] = res?.data || [];
      const rows = [
        ["Customer", "Salon", "Rating", "Review", "Status"],
        ...items.map((r) => [
          r.customerId?.name || "Unknown",
          r.salonId?.name || "-",
          String(r.rating ?? 0),
          r.comment || "",
          r.status || "",
        ]),
      ];
      downloadCsv(`hermoso-reviews-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to export reviews", "error");
    }
  };

  if (statsReq.loading) return <AdminPageSkeleton variant="table" />;
  if (statsReq.error) return <ErrorBlock text={statsReq.error} />;

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card"><div className="ha-kpi-label">Platform Avg Rating</div><div className="ha-kpi-val">{stats.averageRating}</div><div className="ha-kpi-change up">Across all salons</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Total Reviews</div><div className="ha-kpi-val">{stats.totalReviews.toLocaleString()}</div><div className="ha-kpi-change up">Live review volume</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Flagged Reviews</div><div className="ha-kpi-val white">{stats.flaggedCount}</div><div className="ha-kpi-change" style={{ color: 'var(--rose)' }}>Needs moderation</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">AI-Verified Reviews</div><div className="ha-kpi-val">{stats.approvedPercentage}%</div><div className="ha-kpi-change up">Authentic signals</div></div>
      </div>

      <div className="ha-card">
        <div className="ha-card-title">
          Review Moderation Queue
          <span style={{ display: "inline-flex", gap: 8 }}>
            <button className="ha-act-btn" onClick={handleExport}>Export</button>
            <button
              className="ha-topbar-btn primary"
              disabled={moderatingAll}
              onClick={() => setConfirmModerateAll(true)}
            >
              {moderatingAll ? "Moderating..." : "Moderate All"}
            </button>
          </span>
        </div>

        <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="text" className="ha-input" style={{ maxWidth: 220 }} placeholder="Search review text..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <input type="text" className="ha-input" style={{ maxWidth: 180 }} placeholder="Filter by customer..." value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} />
          <input type="text" className="ha-input" style={{ maxWidth: 180 }} placeholder="Filter by salon..." value={salonFilter} onChange={(e) => setSalonFilter(e.target.value)} />
          <span style={{ minWidth: 130, display: "inline-block" }}>
            <SearchableSelect
              value={ratingFilter}
              onChange={setRatingFilter}
              options={[
                { value: "all", label: "All Ratings" },
                { value: "5", label: "5 stars" },
                { value: "4", label: "4 stars" },
                { value: "3", label: "3 stars" },
                { value: "2", label: "2 stars" },
                { value: "1", label: "1 star" },
              ]}
            />
          </span>
          <span style={{ minWidth: 150, display: "inline-block" }}>
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "flagged", label: "Flagged" },
                { value: "deleted", label: "Removed" },
              ]}
            />
          </span>
          {hasActiveFilters && (
            <button type="button" className="ha-btn-secondary" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>

        <TABLE<ReviewItem>
          noBorder
          queryKey={["admin-reviews"]}
          showPagination
          service={reviewService.list}
          serviceParams={filterParams}
          columns={[
            { title: 'Customer' },
            { title: 'Salon' },
            { title: 'Rating' },
            { title: 'Review' },
            { title: 'Status' },
            { title: 'Actions' },
          ]}
          rows={(data) =>
            data?.map((item) => [
              item.customerId?.name || 'Unknown',
              item.salonId?.name || '-',
              <span style={{ color: Number(item.rating) >= 4 ? 'var(--gold-light)' : 'var(--rose)' }}>{stars(Number(item.rating || 0))}</span>,
              <div>
                <div className="ha-salon-name" style={{ fontSize: 13 }}>{item.comment || 'No comment'}</div>
                {item.reply ? <div className="ha-salon-sub">Reply: {item.reply}</div> : null}
              </div>,
              <span className={item.status === 'flagged' ? 'ha-pill ha-pill-suspended' : 'ha-pill ha-pill-active'}>{item.status}</span>,
              <div className="ha-actions">
                <button className="ha-act-btn" onClick={() => moderate(item._id, 'approved')}>Approve</button>
                <button className="ha-act-btn danger" onClick={() => moderate(item._id, 'deleted')}>Remove</button>
                <button className="ha-act-btn" onClick={() => moderate(item._id, 'flagged')}>Investigate</button>
              </div>,
            ])
          }
        />
      </div>

      {confirmModerateAll && (
        <ConfirmModal
          title="Moderate All Pending Reviews"
          message="Approve all currently pending reviews? This cannot be undone."
          confirmLabel="Approve All"
          onConfirm={handleModerateAll}
          onCancel={() => setConfirmModerateAll(false)}
        />
      )}
    </>
  );
};

export default AdminReviewsPage;
