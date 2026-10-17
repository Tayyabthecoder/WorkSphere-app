import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Download,
  FileCheck2,
  ChevronDown,
  ArrowUp,
  History,
  ShieldCheck,
  Scale,
  Cookie,
  LucideIcon,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import { useActiveSection } from '../../../hooks/useActiveSection';

export interface TocItem {
  id: string;
  title: string;
}

export interface ChangelogItem {
  version?: string;
  date?: string;
  changes: string[];
}

interface PolicyPageLayoutProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  subtitle: string;
  version: string;
  lastRevised: string;
  effectiveDate: string;
  readingTimeMinutes?: number;
  tocItems: TocItem[];
  changelog?: ChangelogItem;
  sidebarExtra?: React.ReactNode;
  children: React.ReactNode;
}

export const PolicyPageLayout: React.FC<PolicyPageLayoutProps> = ({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  version,
  lastRevised,
  effectiveDate,
  readingTimeMinutes,
  tocItems,
  changelog,
  sidebarExtra,
  children,
}) => {
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const location = useLocation();

  const activeSectionId = useActiveSection(tocItems.map((item) => item.id));

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const legalNavLinks = [
    { to: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { to: '/terms', label: 'Terms of Service', icon: Scale },
    { to: '/cookies', label: 'Cookie Policy', icon: Cookie },
  ];

  return (
    <MarketingLayout>
      <div className="bg-[#FAFBF9] min-h-screen">
        {/* Header Hero Section */}
        <section className="py-14 md:py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
              <BadgeIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>{badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
              {title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
              <span>
                <strong>Last Revised:</strong> {lastRevised}
              </span>
              <span>&bull;</span>
              <span>
                <strong>Effective:</strong> {effectiveDate}
              </span>
              <span>&bull;</span>
              <span>
                <strong>Version:</strong> {version}
              </span>
              {readingTimeMinutes && (
                <>
                  <span>&bull;</span>
                  <span>
                    <strong>Estimated Read:</strong> ~{readingTimeMinutes} min
                  </span>
                </>
              )}
              <span>&bull;</span>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline underline-offset-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </section>

        {/* Mobile Sticky Section Selector */}
        <div className="lg:hidden sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-2.5 shadow-xs">
          <button
            type="button"
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
          >
            <span className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Jump to Section</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                mobileTocOpen ? 'rotate-180 text-emerald-700' : ''
              }`}
            />
          </button>

          {mobileTocOpen && (
            <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200 shadow-lg max-h-72 overflow-y-auto space-y-1">
              {tocItems.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setMobileTocOpen(false)}
                    className={`block py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {item.title}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Desktop Left Column: Sticky Table of Contents & Contact */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>On This Page</span>
                </div>
                <nav className="space-y-1 text-xs">
                  {tocItems.map((item) => {
                    const isActive = activeSectionId === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block py-1.5 px-2.5 rounded-lg transition-all duration-150 font-medium leading-relaxed ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-900 font-bold border-l-2 border-emerald-600 pl-2'
                            : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/60'
                        }`}
                      >
                        {item.title}
                      </a>
                    );
                  })}
                </nav>
              </div>

              {sidebarExtra}
            </aside>

            {/* Right Column: Complete Policy Content */}
            <main className="lg:col-span-9 bg-white p-6 sm:p-10 md:p-12 rounded-3xl border border-slate-200/90 shadow-2xs space-y-10">
              {/* Optional Changelog Card */}
              {changelog && changelog.changes.length > 0 && (
                <details className="group rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer bg-slate-50 hover:bg-slate-100/70 text-xs font-bold text-slate-800 list-none transition-colors">
                    <span className="flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" />
                      <span>
                        What changed in version {changelog.version || version}?
                      </span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                  </summary>
                  <div className="px-5 pb-4 pt-3 border-t border-slate-200/80 bg-white">
                    <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                      {changelog.changes.map((change, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              )}

              {/* Main Policy Content Sections */}
              {children}

              {/* Cross-Page Related Legal Documents Navigation Strip */}
              <div className="pt-8 border-t border-slate-200/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Related Legal Agreements & Policies
                  </span>
                  <span className="text-xs text-slate-400">
                    WorkSphere Transparency Center
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {legalNavLinks
                    .filter((link) => !location.pathname.startsWith(link.to))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 transition-colors">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-slate-400 group-hover:text-emerald-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                            &rarr;
                          </span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Back to Top Floating Button */}
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-30 p-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:scale-105 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </MarketingLayout>
  );
};

export default PolicyPageLayout;
