import React from 'react';
import { BrandLogo } from '../common/BrandLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 sm:px-6 bg-surface-canvas text-text-primary selection:bg-brand-mint selection:text-brand-evergreen relative">
      {/* Subtle brand ambient glow */}
      <div
        className="fixed top-0 inset-x-0 h-80 pointer-events-none opacity-80"
        style={{
          background: 'radial-gradient(ellipse at 50% -15%, rgba(52, 211, 153, 0.12), transparent 65%)',
        }}
      />

      {/* Brand Header */}
      <div className="relative mb-8 text-center">
        <BrandLogo to="/" variant="compact" size="lg" />
      </div>

      {/* Floating Card Container */}
      <div className="relative w-full max-w-[420px]">
        {children}
      </div>

      {/* Minimal Footer */}
      <div className="relative mt-10 text-center text-xs text-text-muted">
        &copy; {new Date().getFullYear()} WorkSphere, Inc. All rights reserved.
      </div>
    </div>
  );
};

export default AuthLayout;
