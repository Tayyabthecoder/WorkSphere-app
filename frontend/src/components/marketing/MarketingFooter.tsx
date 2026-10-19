import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Disc as Discord, 
  Heart
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="bg-emerald-50/60 text-slate-600 border-t border-emerald-200/70 pt-14 pb-10 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-12 border-b border-emerald-200/70">
          
          {/* Brand & Identity (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-5">
            <BrandLogo to="/" variant="full" size="md" theme="light" />

            <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
              The unified project management platform for high-velocity teams. Run Agile sprints, Gantt timelines, and financial governance with zero friction.
            </p>

            {/* Live Operational Status */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/90 border border-emerald-200/80 text-xs text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-slate-800">All Systems Operational</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono text-[11px]">99.98% Uptime</span>
            </div>

            {/* Social Channels */}
            <div className="flex items-center gap-2.5 pt-1">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white hover:bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-slate-600 hover:text-[#003629] shadow-2xs transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white hover:bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-slate-600 hover:text-[#003629] shadow-2xs transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white hover:bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-slate-600 hover:text-[#003629] shadow-2xs transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="https://discord.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white hover:bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-slate-600 hover:text-[#003629] shadow-2xs transition-colors"
                aria-label="Discord"
              >
                <Discord className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Column (Direct real pages) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Services & Solutions
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Articles & Insights
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Capabilities Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Core Capabilities
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/services" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Agile Sprint Boards
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Interactive Gantt
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Task Timers & Tracking
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Budget & Expense Control
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Dedicated Subdomains
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Tenant Data Isolation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/privacy" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-slate-600 hover:text-[#006C4B] transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>© 2026 WorkSphere Platform Inc. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-slate-600">
            <Link to="/contact" className="hover:text-[#006C4B] transition-colors">
              Help Center & Support
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/login" className="hover:text-[#006C4B] transition-colors">
              Client Portal
            </Link>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-600">
              Crafted with <Heart className="w-3 h-3 text-emerald-600 fill-emerald-600" /> for fast teams
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default MarketingFooter;
