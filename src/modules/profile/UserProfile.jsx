import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, KeyRound, Calendar, CheckCircle2, Save, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatDate } from '../../utils/formatters';

export const UserProfile = () => {
  const { user, profile, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [role, setRole] = useState(profile?.role || user?.user_metadata?.role || 'HR Admin');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync state whenever profile or user loads/updates
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
    if (profile?.role) {
      setRole(profile.role);
    } else if (user?.user_metadata?.role) {
      setRole(user.user_metadata.role);
    }
  }, [profile, user]);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name cannot be empty', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({ fullName: fullName.trim(), role });
      showToast('Profile information updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully!', 'success');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Profile Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2D3250] via-[#424769] to-[#2D3250] p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Sparkles className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB17A] to-[#fca05f] text-3xl font-black text-[#2D3250] shadow-xl shadow-[#FFB17A]/25">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {displayName}
              </h1>
              <span className="rounded-full bg-[#FFB17A]/20 border border-[#FFB17A]/40 px-3 py-1 text-xs font-bold text-[#FFB17A]">
                {profile?.role || 'HR Admin'}
              </span>
            </div>
            <p className="text-sm text-gray-300 flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4 text-[#FFB17A]" />
              {user?.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Joined: {formatDate(user?.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Authenticated Session Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information Card */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#2D3250] flex items-center gap-2">
              <User className="w-5 h-5 text-[#FFB17A]" />
              Personal & Role Details
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Update your display name and administrative credentials
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              icon={User}
              required
            />

            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              icon={Mail}
              helperText="Primary email linked to enterprise credentials"
            />

            <Select
              label="Assigned Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'HR Admin', label: 'HR Administrator' },
                { value: 'HR Manager', label: 'HR Manager' },
                { value: 'Payroll Officer', label: 'Payroll Specialist' },
                { value: 'Department Head', label: 'Department Head' },
                { value: 'Employee', label: 'Standard Employee' },
              ]}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={savingProfile}
                icon={Save}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#2D3250] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#FFB17A]" />
              Security & Password
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ensure your account is using a strong password
            </p>
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password (min. 6 chars)"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="accent"
                loading={savingPassword}
                icon={KeyRound}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

