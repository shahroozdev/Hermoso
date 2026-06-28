import { useEffect, useState } from 'react';
import { z } from 'zod';
import Form from '../../components/Form';
import FormInput from '../../components/FormInput';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const phoneSchema = z
  .union([
    z.string().regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format'),
    z.literal('')
  ])
  .optional();

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: phoneSchema,
  city: z.string().optional(),
  country: z.string().optional(),
  bankAccount: z.string().optional()
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password must match',
    path: ['confirmPassword']
  });

const emptyProfileDefaults = {
  name: '',
  phone: '',
  city: '',
  country: '',
  bankAccount: ''
};

const emptyPasswordDefaults = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [, setLoading] = useState(true);
  const [profileDefaults, setProfileDefaults] = useState(emptyProfileDefaults);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileFormKey, setProfileFormKey] = useState(0);
  const [passwordFormKey, setPasswordFormKey] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setProfileError('');
      try {
        const result = await authService.getProfile();
        const data = result.data;
        updateUser(data);
        setProfileDefaults({
          name: data.name || '',
          phone: data.phone || '',
          city: data.location?.city || '',
          country: data.location?.country || '',
          bankAccount: data.bankAccount || ''
        });
        setProfileEmail(data.email || '');
        setProfileFormKey((value) => value + 1);
      } catch (err: unknown) {
        setProfileError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [updateUser]);

  const onProfileSubmit = async (data) => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const result = await authService.updateProfile({
        name: data.name,
        phone: data.phone || '',
        city: data.city || '',
        country: data.country || '',
        bankAccount: data.bankAccount || ''
      });

      updateUser(result.data);
      setProfileDefaults({
        name: result.data.name || '',
        phone: result.data.phone || '',
        city: result.data.location?.city || '',
        country: result.data.location?.country || '',
        bankAccount: result.data.bankAccount || ''
      });
      setProfileEmail(result.data.email || '');
      setProfileSuccess('Profile updated successfully');
      setProfileFormKey((value) => value + 1);
      return { success: false };
    } catch (err: unknown) {
      setProfileError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update profile');
      throw err;
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const result = await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordFormKey((value) => value + 1);
      return result;
    } catch (err: unknown) {
      setPasswordError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to change password');
      throw err;
    } finally {
      setSavingPassword(false);
    }
  };

  // if (loading) {
  //   return <div className="mx-auto max-w-3xl shell-panel rounded-2xl p-6">Loading profile...</div>;
  // }

  return (
    <div className="mx-auto container space-y-6">
      <section className="shell-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold">My Profile</h2>
        <p className="mt-1 text-sm text-muted">Update your account details. Email stays read-only.</p>

        {profileError ? <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{profileError}</div> : null}
        {profileSuccess ? <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileSuccess}</div> : null}

        <Form
          key={profileFormKey}
          schema={profileSchema}
          defaultValues={profileDefaults}
          onSubmit={onProfileSubmit}
          className="mt-5 grid gap-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              name="name"
              label="Full Name"
              placeholder="Enter your full name"
              required
            />
            <div className="ha-form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                className="ha-input"
                value={profileEmail}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              name="phone"
              label="Phone"
              placeholder="Enter your phone number"
            />
            <div className="ha-form-group">
              <label htmlFor="profile-role">Role</label>
              <input
                id="profile-role"
                className="ha-input capitalize"
                value={user?.role.replace('_', ' ') || ''}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              name="city"
              label="City"
              placeholder="Enter your city"
            />
            <FormInput
              name="country"
              label="Country"
              placeholder="Enter your country"
            />
          </div>

          <FormInput
            name="bankAccount"
            label="Bank Account"
            placeholder="Enter your bank account"
          />

          <div>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900"
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </Form>
      </section>

      <section className="shell-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold">Change Password</h3>
        <p className="mt-1 text-sm text-muted">Use your current password to set a new one.</p>

        {passwordError ? <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{passwordError}</div> : null}
        {passwordSuccess ? <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordSuccess}</div> : null}

        <Form
          key={passwordFormKey}
          schema={passwordSchema}
          defaultValues={emptyPasswordDefaults}
          onSubmit={onPasswordSubmit}
          className="mt-5 grid gap-4"
        >
          <FormInput
            name="currentPassword"
            type="password"
            label="Current Password"
            placeholder="Enter current password"
            required
          />
          <FormInput
            name="newPassword"
            type="password"
            label="New Password"
            placeholder="Enter new password"
            required
          />
          <FormInput
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Confirm new password"
            required
          />

          <div>
            <button
              type="submit"
              className="rounded-xl border bg-[var(--accent-2)] border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900"
              disabled={savingPassword}
            >
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </Form>
      </section>
    </div>
  );
};

export default ProfilePage;
