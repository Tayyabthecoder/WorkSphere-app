import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceSlug = searchParams.get('workspace') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await apiClient.post('/auth/login', {
        email,
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
    <div className="min-h-screen bg-surface-canvas flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-emerald flex items-center justify-center text-white shadow-bento-card">
              <Sparkles className="w-5 h-5 text-brand-mint" />
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">WorkSphere</span>
          </Link>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h2>
          <p className="text-xs text-text-secondary mt-1">
            {workspaceSlug ? (
              <span>
                Signing in to workspace:{' '}
                <span className="font-semibold text-brand-emerald">{workspaceSlug}</span>
              </span>
            ) : (
              'Sign in to access your project management workspace'
            )}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border border-border-subtle p-7">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Register Link */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Don&apos;t have a workspace yet?{' '}
          <Link to="/register" className="font-semibold text-brand-emerald hover:underline">
            Register a new organization
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
