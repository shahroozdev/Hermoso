import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

const AdminSettingsPage = () => {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('');
  const [toggles, setToggles] = useState({
    aiSkinScan: true,
    eventBookings: true,
    pushNotifications: true,
    selfRegistration: true,
    maintenanceMode: false
  });

  const setToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = () => {
    setStatus('Settings saved locally for UI. Connect to platform settings API to persist.');
  };

  return (
    <>
      <div className="ha-row-2">
        <div className="ha-card">
          <div className="ha-card-title">Platform Settings</div>
          <div className="ha-settings-list">
            {[
              { key: 'aiSkinScan', title: 'AI Skin Scan Feature', sub: 'Enable/disable across customer app' },
              { key: 'eventBookings', title: 'Event Bookings', sub: 'Bridal, party, corporate packages' },
              { key: 'pushNotifications', title: 'Push Notifications', sub: 'Global platform notifications' },
              { key: 'selfRegistration', title: 'New Salon Self-Registration', sub: 'Allow salons to sign up directly' },
              { key: 'maintenanceMode', title: 'Maintenance Mode', sub: 'Take platform offline temporarily' }
            ].map((item) => (
              <div className="ha-setting-row" key={item.key}>
                <div>
                  <div className="ha-salon-name" style={{ fontSize: 14 }}>{item.title}</div>
                  <div className="ha-salon-sub">{item.sub}</div>
                </div>
                <label className="ha-switch">
                  <input type="checkbox" checked={toggles[item.key]} onChange={() => setToggle(item.key)} />
                  <span className="ha-switch-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="ha-card">
          <div className="ha-card-title">Admin Access</div>
          <table className="ha-salon-table" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="ha-salon-cell">
                    <div className="ha-admin-av">{(user?.name || 'W').slice(0, 1).toUpperCase()}</div>
                    <div className="ha-salon-name" style={{ fontSize: 13 }}>{user?.name || 'Platform Admin'}</div>
                  </div>
                </td>
                <td><span className="ha-pill ha-pill-vip">Super Admin</span></td>
                <td>Today</td>
                <td><span className="ha-pill ha-pill-active">Full Access</span></td>
              </tr>
              <tr>
                <td>
                  <div className="ha-salon-cell">
                    <div className="ha-salon-av">A</div>
                    <div className="ha-salon-name" style={{ fontSize: 13 }}>Armaan</div>
                  </div>
                </td>
                <td><span className="ha-pill ha-pill-booking">Sales Manager</span></td>
                <td>Yesterday</td>
                <td><span className="ha-pill ha-pill-active">Salons Only</span></td>
              </tr>
            </tbody>
          </table>

          <button className="ha-topbar-btn primary" style={{ width: '100%', marginTop: 14 }} onClick={saveSettings}>
            + Invite Admin
          </button>
        </div>
      </div>

      {status ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{status}</p> : null}
    </>
  );
};

export default AdminSettingsPage;

