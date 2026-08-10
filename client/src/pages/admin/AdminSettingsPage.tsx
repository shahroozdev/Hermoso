import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { adminService, type AdminRecord } from '@/services/adminService';
import ErrorBlock from '../../components/ErrorBlock';
import CreateAdminModal from '@/components/createAdmin';

const AdminSettingsPage = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [status, setStatus] = useState('');
  const [actionError, setActionError] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newAdminCredentials, setNewAdminCredentials] = useState<{
    email?: string;
    password?: string;
    generated?: boolean;
  } | null>(null);
  const invalidate = useInvalidate();
  const [toggles, setToggles] = useState({
    aiSkinScan: true,
    eventBookings: true,
    pushNotifications: true,
    selfRegistration: true,
    maintenanceMode: false
  });

  const adminsReq = useApi(() => adminService.list(), ['admins']);
  const admins = (adminsReq.data as { data?: AdminRecord[] } | null)?.data || [];

  const setToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = () => {
    setStatus('Settings saved locally for UI. Connect to platform settings API to persist.');
  };

  const toggleAdminStatus = async (admin: AdminRecord) => {
    setActionError('');
    const isSuspended = admin.status === 'suspended' || admin.status === 'inactive';
    try {
      await adminService.updateStatus(admin._id, isSuspended ? 'active' : 'suspended');
      invalidate(['admins']);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update admin status');
    }
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
          <button className="ha-topbar-btn primary" style={{ width: '100%', marginTop: 14 }} onClick={saveSettings}>
            Save Changes
          </button>
        </div>

        <div className="ha-card">
          <div className="ha-card-title">Admin Access</div>

          {!isSuperAdmin ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Only a super admin can view or manage admin accounts.
            </p>
          ) : (
            <>
              {actionError ? (
                <div style={{ marginBottom: 10 }}>
                  <ErrorBlock text={actionError} />
                </div>
              ) : null}

              {newAdminCredentials?.generated ? (
                <div className="ha-form-hint" style={{ marginBottom: 12 }}>
                  Admin created with generated login: {newAdminCredentials.email} /{' '}
                  {newAdminCredentials.password}
                </div>
              ) : null}

              {adminsReq.error ? (
                <ErrorBlock text={adminsReq.error} />
              ) : (
                <table className="ha-salon-table" style={{ minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th>Admin</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Access</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => {
                      const isSuspended = admin.status === 'suspended' || admin.status === 'inactive';
                      const isSelf = admin._id === user?._id;
                      return (
                        <tr key={admin._id}>
                          <td>
                            <div className="ha-salon-cell">
                              <div className="ha-admin-av">{(admin.name || 'A').slice(0, 1).toUpperCase()}</div>
                              <div>
                                <div className="ha-salon-name" style={{ fontSize: 13 }}>{admin.name}</div>
                                <div className="ha-salon-sub">{admin.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="ha-pill ha-pill-vip">
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                          </td>
                          <td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '-'}</td>
                          <td>
                            <span className={isSuspended ? 'ha-pill ha-pill-suspended' : 'ha-pill ha-pill-active'}>
                              {isSuspended ? 'Suspended' : 'Full Access'}
                            </span>
                          </td>
                          <td>
                            {admin.role === 'super_admin' ? (
                              <span className="ha-salon-sub">-</span>
                            ) : (
                              <button
                                className={isSuspended ? 'ha-act-btn' : 'ha-act-btn danger'}
                                disabled={isSelf}
                                title={isSelf ? "You can't change your own access" : undefined}
                                onClick={() => toggleAdminStatus(admin)}
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <button
                className="ha-topbar-btn primary"
                style={{ width: '100%', marginTop: 14 }}
                onClick={() => setInviteModalOpen(true)}
              >
                + Invite Admin
              </button>
            </>
          )}
        </div>
      </div>

      {status ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{status}</p> : null}

      {inviteModalOpen && (
        <CreateAdminModal
          onClose={() => setInviteModalOpen(false)}
          onCreated={(_admin, credentials) => {
            setNewAdminCredentials(credentials || null);
            invalidate(['admins']);
          }}
        />
      )}
    </>
  );
};

export default AdminSettingsPage;

