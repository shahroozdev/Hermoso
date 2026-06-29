import { useMemo, useState } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import CustomerDetailModal from '../../components/CustomerDetailModal';
import TABLE from '@/components/table';
import { useApi } from '../../hooks/useApi';
import { customerService } from '../../services/customerService';
import { useNavigate } from 'react-router-dom';

interface CustomerOverview {
  _id: string;
  name: string;
  email: string;
  status?: string;
  createdAt?: string;
  bookingsCount: number;
  totalSpent: number;
  eventCount: number;
}

const AdminCustomersPage = () => {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const kpiReq = useApi(() => customerService.getOverview({ page: 1, limit: 1 }), []);

  const kpi = useMemo(() => {
    const m = kpiReq.data?.meta;
    return {
      totalCustomers: m?.totalCustomers ?? 0,
      returningCustomers: m?.returningCustomers ?? 0,
      flaggedAccounts: m?.flaggedAccounts ?? 0,
      totalRevenue: m?.totalRevenue ?? 0,
    };
  }, [kpiReq.data]);

  const handleFlag = async (id: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await customerService.updateStatus(id, newStatus);
      navigate(0);
    } catch {
      alert('Failed to update customer status');
    }
  };

  if (kpiReq.loading) return <AdminPageSkeleton variant="table" />;
  if (kpiReq.error) return <ErrorBlock text={kpiReq.error} />;

  const icons = ['🧑', '💅', '✨', '⚠️'];

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card"><div className="ha-kpi-label">Total Customers</div><div className="ha-kpi-val">{kpi.totalCustomers.toLocaleString()}</div><div className="ha-kpi-change up">Registered accounts</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Returning Customers</div><div className="ha-kpi-val">{kpi.returningCustomers.toLocaleString()}</div><div className="ha-kpi-change up">{kpi.totalCustomers ? Math.round((kpi.returningCustomers / kpi.totalCustomers) * 100) : 0}% retention</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Total Revenue</div><div className="ha-kpi-val">PKR {kpi.totalRevenue.toLocaleString()}</div><div className="ha-kpi-change up">From bookings</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Flagged Accounts</div><div className="ha-kpi-val white">{kpi.flaggedAccounts}</div><div className="ha-kpi-change" style={{ color: 'var(--rose)' }}>Needs review</div></div>
      </div>

      <TABLE<CustomerOverview>
        title="Customer Accounts"
        showPagination
        service={customerService.getOverview}
        columns={[
          { title: 'Customer' },
          { title: 'Joined' },
          { title: 'Bookings' },
          { title: 'AI Scans' },
          { title: 'Total Spent' },
          { title: 'Status' },
          { title: 'Actions' },
        ]}
        rows={(data) =>
          data?.map((item, idx) => {
            const aiScans = Math.max(0, Math.round(item.bookingsCount * 0.35));
            const isFlagged = item.status === 'suspended' || item.status === 'inactive';
            const isVip = item.totalSpent >= 80000;
            const statusLabel = isFlagged ? 'flagged' : isVip ? 'vip' : 'active';
            const joined = item.createdAt
              ? new Date(item.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' })
              : '-';
            return [
              <div className="ha-salon-cell">
                <div className="ha-salon-av">{icons[idx % 4]}</div>
                <div>
                  <div className="ha-salon-name">{item.name}</div>
                  <div className="ha-salon-sub">{item.email}</div>
                </div>
              </div>,
              joined,
              item.bookingsCount,
              aiScans,
              <span className="ha-money">PKR {Math.round(item.totalSpent).toLocaleString()}</span>,
              <span className={statusLabel === 'active' ? 'ha-pill ha-pill-active' : statusLabel === 'vip' ? 'ha-pill ha-pill-vip' : 'ha-pill ha-pill-suspended'}>
                {statusLabel}
              </span>,
              <div className="ha-actions">
                <button className="ha-act-btn" onClick={() => setViewingId(item._id)}>View</button>
                <button className="ha-act-btn" onClick={() => handleFlag(item._id, item.status)}>
                  {isFlagged ? 'Unflag' : 'Flag'}
                </button>
              </div>,
            ];
          })
        }
      />

      {viewingId && (
        <CustomerDetailModal customerId={viewingId} onClose={() => setViewingId(null)} />
      )}
    </>
  );
};

export default AdminCustomersPage;


