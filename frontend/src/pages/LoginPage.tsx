import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceSlug = searchParams.get('workspace') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.success) {
        const { user, accessToken } = res.data.data;
        setAuth(user, accessToken);

        const targetUrl = user.role === 'superAdmin' ? '/admin' : '/dashboard';
        navigate(targetUrl);
      } else {
        setErrorMessage(res.data?.error?.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="bg-surface-card border border-border-subtle rounded-2xl p-7 sm:p-8 shadow-card">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Welcome back</h1>
          <p className="text-xs text-text-secondary mt-1">
            Sign in to access your project management workspace
          </p>

          {workspaceSlug && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-brand-emerald text-xs font-medium">
              <span className="text-emerald-700/70">Workspace:</span>
              <span className="font-semibold text-brand-emerald">{workspaceSlug}</span>
            </div>
          )}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-xs font-semibold text-text-primary tracking-tight">
              Email Address
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-card border border-border text-xs text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 shadow-subtle"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-semibold text-text-primary tracking-tight">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
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
            <div className="flex justify-end mt-0.5">
              <Link
                to="/forgot-password"
                className="text-xs text-brand-emerald hover:text-brand-primary hover:underline font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 mt-1 bg-brand-emerald hover:bg-brand-primary text-white font-medium text-xs rounded-xl shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-brand-emerald/25 transition-all flex items-center justify-center gap-2 border border-emerald-800/60"
            isLoading={isLoading}
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-5 flex items-center gap-3">
          <hr className="flex-1 border-border-subtle" />
          <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">or</span>
          <hr className="flex-1 border-border-subtle" />
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          disabled
          className="mt-3.5 w-full h-10 px-3.5 flex items-center justify-between rounded-xl border border-border bg-surface-card hover:bg-surface-low text-xs text-text-muted cursor-not-allowed select-none transition-all shadow-subtle"
          title="Google SSO coming soon"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-medium text-text-primary">Continue with Google</span>
          </div>
          <span className="text-[10px] bg-surface-low border border-border text-text-muted font-medium px-1.5 py-0.5 rounded-md">
            Soon
          </span>
        </button>

        {/* Switch Link */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-emerald hover:text-brand-primary hover:underline">
            Register a new organization
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
};

export default LoginPage;
