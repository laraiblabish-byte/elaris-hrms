import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const Login = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const { showToast } = useToast();

  const validate = () => {
    const errors = {};
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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
      showToast('Welcome back! Successfully signed in.', 'success');
    } catch (err) {
      let friendlyMessage = err.message || 'Failed to sign in';
      if (err.message?.includes('Invalid login credentials')) {
        friendlyMessage = 'Invalid email or password. Please verify and try again.';
      } else if (err.message?.includes('Email not confirmed')) {
        friendlyMessage = 'Email not confirmed. Please check your inbox to confirm your account.';
      }
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
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#676F9D]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#FFB17A]/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-[#2D3250] via-[#424769] to-[#2D3250] p-8 text-center text-white relative">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB17A] to-[#fca05f] text-[#2D3250] shadow-lg shadow-[#FFB17A]/30 mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Elaris<span className="text-[#FFB17A]">Solutions</span>
            </h1>
            <p className="mt-1 text-xs font-medium text-gray-300">
              Sign in to your HRMS & Payroll account
            </p>
          </div>

          <div className="p-8">
            {errorMsg && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
                <p className="leading-snug">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="name@elaris.com"
                icon={Mail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                error={fieldErrors.email}
                required
                autoComplete="email"
              />

              <div className="w-full">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    icon={Lock}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    error={fieldErrors.password}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-[#424769] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#2D3250] focus:ring-[#FFB17A]"
                    defaultChecked
                  />
                  <span>Keep me signed in</span>
                </label>
                <span className="text-[#676F9D] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                loading={loading}
                className="w-full mt-2 font-bold text-base shadow-md"
              >
                Sign In
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="font-bold text-[#424769] hover:text-[#2D3250] hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-[#676F9D]/80">
          &copy; {new Date().getFullYear()} Elaris Solutions. Enterprise HR & Payroll Security.
        </p>
      </div>
    </div>
  );
};

