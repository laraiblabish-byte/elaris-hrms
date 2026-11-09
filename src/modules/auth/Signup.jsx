import React, { useState } from 'react';
import { Mail, Lock, User, Briefcase, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const Signup = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('HR Admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const { signup } = useAuth();
  const { showToast } = useToast();

  const validate = () => {
    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validate()) return;
    setShowSignupConfirm(true);
  };

  const handleExecuteSignup = async () => {
    setShowSignupConfirm(false);
    try {
      setLoading(true);
      const data = await signup(email.trim(), password, {
        fullName: fullName.trim(),
        role: role,
      });

      // Check if user session was returned immediately or needs email confirmation
      if (data?.session) {
        showToast('Account created and logged in successfully!', 'success');
      } else {
        const msg = 'Account created successfully! Please check your email inbox to verify your account.';
        setSuccessMsg(msg);
        showToast(msg, 'success');
      }
    } catch (err) {
      const friendlyMessage = err.message || 'Failed to create account';
      setErrorMsg(friendlyMessage);
      showToast(friendlyMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2D3250] p-4 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#676F9D]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#FFB17A]/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2D3250] via-[#424769] to-[#2D3250] p-8 text-center text-white relative">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB17A] to-[#fca05f] text-[#2D3250] shadow-lg shadow-[#FFB17A]/30 mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Elaris<span className="text-[#FFB17A]">Solutions</span>
            </h1>
            <p className="mt-1 text-xs font-medium text-gray-300">
              Create your organization administrator account
            </p>
          </div>

          <div className="p-8">
            {errorMsg && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
                <p className="leading-snug">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
                <p className="leading-snug">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                placeholder="Sarah Jenkins"
                icon={User}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                error={fieldErrors.fullName}
                required
              />

              <Input
                label="Work Email"
                type="email"
                placeholder="sarah.jenkins@elaris.com"
                icon={Mail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                error={fieldErrors.email}
                required
              />

              <Select
                label="Organization Role"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 chars"
                    icon={Lock}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    error={fieldErrors.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-[#424769] cursor-pointer"
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  icon={Lock}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  error={fieldErrors.confirmPassword}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                loading={loading}
                className="w-full mt-4 font-bold text-base shadow-md"
              >
                Create Account
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-bold text-[#424769] hover:text-[#2D3250] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Up Confirmation Modal with 2 Buttons: Close or Confirm */}
      <ConfirmDialog
        isOpen={showSignupConfirm}
        onClose={() => setShowSignupConfirm(false)}
        onConfirm={handleExecuteSignup}
        title="Confirm Account Registration"
        message={`Please confirm creating an account for ${fullName.trim()} (${email.trim()}) with role "${role}".`}
        cancelText="Close"
        confirmText="Sign Up Confirm"
        variant="accent"
        loading={loading}
      />
    </div>
  );
};

