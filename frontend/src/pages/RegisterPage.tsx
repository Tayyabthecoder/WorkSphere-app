import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.tenantId && !user.tenantId.startsWith('pending')) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, user?.tenantId, navigate]);

  // Validation rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (name.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      setIsLoading(false);
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid work email address.');
      setIsLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password must be at least 8 characters and include uppercase letters and numbers.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your confirmation password.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.post('/auth/signup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.data?.success) {
        setErrorMessage(res.data?.error?.message || 'Registration failed. Please check inputs and try again.');
        setIsLoading(false);
        return;
      }

      const { user: registeredUser, accessToken } = res.data.data;

      if (registeredUser && accessToken) {
        setAuth(registeredUser, accessToken);
      }

      navigate('/onboarding');
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      const msg = errorData?.message || err.response?.data?.message || err.message || 'An error occurred during account registration. Please try again.';
      const details = errorData?.details ? ` (${typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)})` : '';
      setErrorMessage(`${msg}${details}`);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="bg-surface-card border border-border-subtle rounded-2xl p-7 sm:p-8 shadow-card">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Create your account</h1>
          <p className="text-xs text-text-secondary mt-1">Get started with WorkSphere in less than a minute</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            key={errorMessage}
            className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2 animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Single-Screen Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-name" className="text-xs font-semibold text-text-primary tracking-tight">
              Full Name
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
                <User className="w-4 h-4" />
              </div>
              <input
                id="register-name"
                type="text"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-card border border-border text-xs text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 shadow-subtle"
              />
            </div>
          </div>

          {/* Work Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-email" className="text-xs font-semibold text-text-primary tracking-tight">
              Work Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-card border border-border text-xs text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 shadow-subtle"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-password" className="text-xs font-semibold text-text-primary tracking-tight">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-10 rounded-xl bg-surface-card border border-border text-xs text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 shadow-subtle"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <p className="text-[11px] text-text-muted mt-0.5">
                {isPasswordValid ? (
                  <span className="text-brand-emerald font-medium inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-brand-mint" /> Password meets requirements
                  </span>
                ) : (
                  'At least 8 characters with 1 uppercase letter and 1 number.'
                )}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-confirm-password" className="text-xs font-semibold text-text-primary tracking-tight">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-10 rounded-xl bg-surface-card border border-border text-xs text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 shadow-subtle"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                className="absolute right-3 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p className="text-[11px] mt-0.5">
                {passwordsMatch ? (
                  <span className="text-brand-emerald font-medium inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-brand-mint" /> Passwords match
                  </span>
                ) : (
                  <span className="text-status-error font-medium inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Passwords do not match
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 mt-2 bg-brand-emerald hover:bg-brand-primary text-white font-medium text-xs rounded-xl shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-brand-emerald/25 transition-all flex items-center justify-center gap-2 border border-emerald-800/60"
            isLoading={isLoading}
          >
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>

        {/* Terms Note */}
        <p className="text-center text-[11px] text-text-muted mt-4 leading-normal">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="text-brand-emerald underline hover:text-brand-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-brand-emerald underline hover:text-brand-primary">
            Privacy Policy
          </Link>
          .
        </p>

        {/* Switch Link */}
        <p className="text-center text-xs text-text-secondary mt-5 pt-4 border-t border-border-divider">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-emerald hover:text-brand-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
};

export default RegisterPage;
