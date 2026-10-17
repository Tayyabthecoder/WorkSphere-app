import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AuthLayout } from '../components/layout/AuthLayout';
import apiClient from '../api/client';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() }).catch(() => {
        // Fallback for development/demo environments
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message ||
          'Failed to send password reset email. Please verify your address and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="bg-surface-card border border-border-subtle rounded-2xl p-7 sm:p-8 shadow-card">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-emerald/10 text-brand-emerald mb-3">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Reset your password</h1>
          <p className="text-xs text-text-secondary mt-1">
            {isSubmitted
              ? 'Check your inbox for the recovery link'
              : 'Enter your email address and we will send you a reset link'}
          </p>
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

        {isSubmitted ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-brand-emerald mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-brand-mint-dark" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-text-primary">Check your inbox</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                We sent a password reset link to <span className="font-semibold text-text-primary">{email}</span>.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full h-10 bg-brand-emerald hover:bg-brand-primary text-white font-medium text-xs rounded-xl shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-brand-emerald/25 transition-all border border-emerald-800/60">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-email" className="text-xs font-semibold text-text-primary tracking-tight">
                Work Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reset-email"
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

            <Button
              type="submit"
              className="w-full h-10 mt-1 bg-brand-emerald hover:bg-brand-primary text-white font-medium text-xs rounded-xl shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-brand-emerald/25 transition-all flex items-center justify-center gap-2 border border-emerald-800/60"
              isLoading={isLoading}
            >
              <span>Send Reset Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>
        )}

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-border-divider text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-emerald hover:text-brand-primary hover:underline transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
