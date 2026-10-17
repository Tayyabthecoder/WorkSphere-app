import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  const { user, isAuthenticated, setAuth } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // Password requirement checks
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

      // Authenticate session immediately
      if (registeredUser && accessToken) {
        setAuth(registeredUser, accessToken);
      }

      // Smoothly navigate directly to the Workspace Creation Wizard
      navigate('/onboarding');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'An error occurred during account registration. Please try again.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-emerald flex items-center justify-center text-white shadow-bento-card">
              <Sparkles className="w-5 h-5 text-brand-mint" />
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">WorkSphere</span>
          </Link>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Sign up for WorkSphere
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Create your account first, then configure your custom organization workspace.
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-lg border border-border-subtle p-6 sm:p-8">
          {/* Free Early Access Notice */}
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-950 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">WorkSphere is 100% Free For Now!</span>
              <p className="text-emerald-900 text-[11px] mt-0.5 leading-relaxed">
                {plan ? (
                  <>You selected the <strong className="font-semibold capitalize text-emerald-950">{plan}</strong> tier. </>
                ) : null}
                All Pro & Enterprise features are currently unlocked for all teams at zero cost. No credit card required.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[29px] text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time password requirement checklist */}
              <div className="mt-2 p-2.5 rounded-lg bg-surface-low/80 border border-border/60 text-[11px] flex flex-col gap-1">
                <span className="font-semibold text-text-secondary">Password requirements:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-text-muted">
                  <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-brand-emerald font-semibold' : ''}`}>
                    <Check className={`w-3 h-3 ${hasMinLength ? 'text-brand-mint' : 'text-text-muted/40'}`} />
                    8+ chars
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasUppercase ? 'text-brand-emerald font-semibold' : ''}`}>
                    <Check className={`w-3 h-3 ${hasUppercase ? 'text-brand-mint' : 'text-text-muted/40'}`} />
                    1 uppercase
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-brand-emerald font-semibold' : ''}`}>
                    <Check className={`w-3 h-3 ${hasNumber ? 'text-brand-mint' : 'text-text-muted/40'}`} />
                    1 number
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
              {confirmPassword && (
                <div className="mt-1 text-[11px]">
                  {passwordsMatch ? (
                    <span className="text-brand-emerald flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-status-error flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign Up & Create Workspace
            </Button>
          </form>

          {/* Value callout */}
          <div className="mt-5 pt-4 border-t border-border-divider flex items-center justify-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-4 h-4 text-brand-emerald" />
            <span>Enterprise-grade security • Zero setup fee</span>
          </div>
        </Card>

        {/* Existing account link */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-emerald hover:underline">
            Sign In here
          </Link>
        </p>

        {/* Legal Terms Note */}
        <p className="text-center text-[11px] text-text-muted mt-3">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline hover:text-text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
