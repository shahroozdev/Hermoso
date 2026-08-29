import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { useToastStore } from '../../store/toastStore';
import { adminService, type AdminRecord } from '@/services/adminService';
import { settingsService, type PlatformSettingsRecord } from '@/services/settingsService';
import ErrorBlock from '../../components/ErrorBlock';
import CreateAdminModal from '@/components/createAdmin';
import ActionsMenu from '@/components/ActionsMenu';
import OwnerCredentialsModal from '@/components/OwnerCredentialsModal';

const DEFAULT_TOGGLES: PlatformSettingsRecord = {
  aiSkinScan: true,
  eventBookings: true,
  pushNotifications: true,
  selfRegistration: true,
  maintenanceMode: false
};

const AdminSettingsPage = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const { showToast } = useToastStore();
  const [actionError, setActionError] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminRecord | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newAdminCredentials, setNewAdminCredentials] = useState<{
    email?: string;
    password?: string;
    generated?: boolean;
  } | null>(null);
  const invalidate = useInvalidate();
  const settingsReq = useApi(() => settingsService.get(), ['platform-settings']);
  const loadedSettings = (settingsReq.data as { data?: PlatformSettingsRecord } | null)?.data;
  const [localToggles, setLocalToggles] = useState<PlatformSettingsRecord | null>(null);
  const toggles = localToggles ?? loadedSettings ?? DEFAULT_TOGGLES;

  const adminsReq = useApi(() => adminService.list({ search: adminSearch }), ['admins', adminSearch]);
  const admins = (adminsReq.data as { data?: AdminRecord[] } | null)?.data || [];

  const setToggle = (key: keyof PlatformSettingsRecord) => {
    setLocalToggles((prev) => ({ ...(prev ?? DEFAULT_TOGGLES), [key]: !(prev ?? DEFAULT_TOGGLES)[key] }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await settingsService.update(toggles);
      showToast('Settings saved successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAdminStatus = async (admin: AdminRecord) => {
    setActionError('');
    const isSuspended = admin.status === 'suspended' || admin.status === 'inactive';
    try {
      await adminService.updateStatus(admin._id, isSuspended ? 'active' : 'suspended');
      invalidate(['admins']);
      showToast(isSuspended ? 'Admin activated.' : 'Admin suspended.');
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
          <button className="ha-topbar-btn primary" style={{ width: '100%', marginTop: 14 }} onClick={saveSettings} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
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
              <div style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  className="ha-input"
                  placeholder="Search admins by name or email..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                />
              </div>

              {actionError ? (
                <div style={{ marginBottom: 10 }}>
                  <ErrorBlock text={actionError} />
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
                            <ActionsMenu
                              items={[
                                { label: 'Edit', onClick: () => setEditAdmin(admin) },
                                ...(admin.role === 'super_admin'
                                  ? []
                                  : [
                                      {
                                        label: isSuspended ? 'Activate' : 'Suspend',
                                        danger: !isSuspended,
                                        onClick: () => {
                                          if (isSelf) return;
                                          toggleAdminStatus(admin);
                                        },
                                      },
                                    ]),
                              ]}
                            />
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

      {inviteModalOpen && (
        <CreateAdminModal
          onClose={() => setInviteModalOpen(false)}
          onCreated={(_admin, credentials) => {
            setNewAdminCredentials(credentials?.generated ? credentials : null);
            invalidate(['admins']);
            if (!credentials?.generated) showToast('Admin invited successfully.');
          }}
        />
      )}

      {editAdmin && (
        <CreateAdminModal
          admin={editAdmin}
          onClose={() => setEditAdmin(null)}
          onCreated={() => {
            invalidate(['admins']);
            showToast('Admin updated successfully.');
          }}
        />
      )}

      {newAdminCredentials?.generated && (
        <OwnerCredentialsModal
          email={newAdminCredentials.email}
          password={newAdminCredentials.password}
          onClose={() => setNewAdminCredentials(null)}
        />
      )}
    </>
  );
};

export default AdminSettingsPage;

