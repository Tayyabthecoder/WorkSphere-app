import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ArrowRight, 
  LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { BrandLogo } from '../common/BrandLogo';

interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About Us', href: '/about' },
  { label: 'Pricing', href: '/pricing', badge: 'Free' },
  { label: 'Blogs', href: '/blog' },
  { label: 'Contact Us', href: '/contact' },
];

export const MarketingHeader: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-xs border-b border-slate-200/80' 
          : 'bg-white/70 backdrop-blur-sm border-b border-slate-200/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo to="/" variant="full" size="md" theme="light" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 shadow-2xs">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? 'text-[#003629] bg-white shadow-xs font-bold border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-[#006C4B] border border-emerald-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Cluster */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#003629] hover:bg-[#1B4D3E] text-white text-xs font-bold shadow-xs transition-all hover:shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#64F9BC]" />
              <span>Workspace</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#003629] hover:bg-[#1B4D3E] text-white font-bold text-xs transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 border border-emerald-500/20"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#64F9BC] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-[#003629] font-bold border border-emerald-200/60'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-[#006C4B]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#003629] text-white font-semibold shadow-xs"
              >
                <LayoutDashboard className="w-4 h-4 text-[#64F9BC]" />
                Go to Workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#003629] text-white font-bold text-sm shadow-xs active:scale-98 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-[#64F9BC]" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default MarketingHeader;
