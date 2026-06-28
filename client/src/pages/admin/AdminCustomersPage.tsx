import AdminPageSkeleton from '../../components/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { customerService } from '../../services/customerService';
import { bookingService } from '../../services/bookingService';

const AdminCustomersPage = () => {
  const customersReq = useApi(() => customerService.list({ page: 1, limit: 100 }), []);
  const bookingsReq = useApi(() => bookingService.list({ page: 1, limit: 500 }), []);

  if (customersReq.loading || bookingsReq.loading) return <AdminPageSkeleton variant="table" />;
  if (customersReq.error) return <ErrorBlock text={customersReq.error} />;
  if (bookingsReq.error) return <ErrorBlock text={bookingsReq.error} />;

  const customers = customersReq.data?.data || [];
  const bookings = bookingsReq.data?.data || [];

  const byCustomer = new Map();
  for (const b of bookings) {
    const id = b.customerId?._id;
    if (!id) continue;
    if (!byCustomer.has(id)) {
      byCustomer.set(id, {
        bookings: 0,
        totalSpent: 0,
        cities: {},
        eventCount: 0
      });
    }
    const row = byCustomer.get(id);
    row.bookings += 1;
    row.totalSpent += Number(b.price || 0);
    const city = b.salonId?.location?.city || 'Unknown';
    row.cities[city] = (row.cities[city] || 0) + 1;
    if ((b.serviceId?.name || '').toLowerCase().includes('bridal') || (b.serviceId?.name || '').toLowerCase().includes('package')) row.eventCount += 1;
  }

  const rows = customers.map((c, idx) => {
    const agg = byCustomer.get(c._id) || { bookings: 0, totalSpent: 0, cities: {}, eventCount: 0 };
    const city = Object.keys(agg.cities).sort((a, b) => agg.cities[b] - agg.cities[a])[0] || 'Unknown';
    const aiScans = Math.max(0, Math.round(agg.bookings * 0.35));
    const joined = new Date(c.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const isFlagged = c.status === 'suspended' || c.status === 'inactive';
    const isVip = agg.totalSpent >= 80000;
    return {
      id: c._id,
      name: c.name,
      email: c.email,
      city,
      joined,
      bookings: agg.bookings,
      aiScans,
      totalSpent: Math.round(agg.totalSpent),
      status: isFlagged ? 'flagged' : isVip ? 'vip' : 'active',
      icon: ['🧑', '💅', '✨', '⚠️'][idx % 4]
    };
  });

  const total = rows.length;
  const returning = rows.filter((r) => r.bookings > 1).length;
  const aiUsers = rows.filter((r) => r.aiScans > 0).length;
  const flagged = rows.filter((r) => r.status === 'flagged').length;

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card"><div className="ha-kpi-label">Total Customers</div><div className="ha-kpi-val">{total.toLocaleString()}</div><div className="ha-kpi-change up">Registered accounts</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Returning Customers</div><div className="ha-kpi-val">{returning.toLocaleString()}</div><div className="ha-kpi-change up">{total ? Math.round((returning / total) * 100) : 0}% retention</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">AI Scan Users</div><div className="ha-kpi-val">{aiUsers.toLocaleString()}</div><div className="ha-kpi-change up">{total ? Math.round((aiUsers / total) * 100) : 0}% adoption</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Flagged Accounts</div><div className="ha-kpi-val white">{flagged}</div><div className="ha-kpi-change" style={{ color: 'var(--rose)' }}>Needs review</div></div>
      </div>

      <div className="ha-card">
        <div className="ha-card-title">Customer Accounts</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ha-salon-table">
            <thead>
              <tr>
                <th>Customer</th><th>City</th><th>Joined</th><th>Bookings</th><th>AI Scans</th><th>Total Spent</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="ha-salon-cell">
                      <div className="ha-salon-av">{r.icon}</div>
                      <div>
                        <div className="ha-salon-name">{r.name}</div>
                        <div className="ha-salon-sub">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.city}</td>
                  <td>{r.joined}</td>
                  <td>{r.bookings}</td>
                  <td>{r.aiScans}</td>
                  <td className="ha-money">PKR {r.totalSpent.toLocaleString()}</td>
                  <td>
                    <span className={r.status === 'active' ? 'ha-pill ha-pill-active' : r.status === 'vip' ? 'ha-pill ha-pill-vip' : 'ha-pill ha-pill-suspended'}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="ha-actions">
                      <button className="ha-act-btn">View</button>
                      <button className="ha-act-btn">Flag</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminCustomersPage;


