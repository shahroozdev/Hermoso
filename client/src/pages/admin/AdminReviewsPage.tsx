import { useMemo } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import TABLE from '@/components/table';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { reviewService } from '../../services/reviewService';

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
  const statsReq = useApi(() => reviewService.getStats(), ["review-stats"]);

  const stats = useMemo(() => ({
    averageRating: statsReq.data?.data?.averageRating ?? 0,
    totalReviews: statsReq.data?.data?.totalReviews ?? 0,
    flaggedCount: statsReq.data?.data?.flaggedCount ?? 0,
    approvedPercentage: statsReq.data?.data?.approvedPercentage ?? 0,
  }), [statsReq.data]);

  const moderate = async (id: string, status: string) => {
    try {
      await reviewService.moderate(id, status as 'approved' | 'flagged' | 'deleted');
      invalidate();
    } catch {
      alert('Failed to moderate review');
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

      <TABLE<ReviewItem>
        title="Review Moderation Queue"
        queryKey={["admin-reviews"]}
        showPagination
        service={reviewService.list}
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
    </>
  );
};

export default AdminReviewsPage;


