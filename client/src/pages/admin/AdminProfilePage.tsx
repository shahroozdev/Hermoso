import { useAuthStore } from '../../store/authStore';

const AdminProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="ha-card" style={{ maxWidth: 720 }}>
      <div className="ha-card-title">Profile</div>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <div className="ha-kpi-label">Name</div>
          <div style={{ fontSize: 14 }}>{user?.name || '-'}</div>
        </div>
        <div>
          <div className="ha-kpi-label">Email</div>
          <div style={{ fontSize: 14 }}>{user?.email || '-'}</div>
        </div>
        <div>
          <div className="ha-kpi-label">Role</div>
          <div style={{ fontSize: 14 }}>{user?.role || '-'}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
