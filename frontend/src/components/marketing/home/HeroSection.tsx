import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-12 pb-12 md:pt-16 md:pb-14 overflow-hidden bg-white">
      {/* Subtle, soft ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-50/70 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Top Copy (Spacious, bold, Linear-style typography) */}
        <div className="max-w-4xl mx-auto text-center space-y-7">
          
          {/* Minimalist Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[#006C4B]">WorkSphere 2.0</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">The Unified Work Operating System</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Large Bold Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-[-0.035em] leading-[1.06]">
            Project management, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003629] via-[#006C4B] to-emerald-500">
              without the clutter.
            </span>
          </h1>

          {/* Clean Sub-headline */}
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-normal leading-relaxed tracking-tight">
            A unified workspace for fast-moving teams. Switch effortlessly between Agile sprints, Gantt timelines, and budget oversight — completely free with dedicated tenant data isolation.
          </p>

          {/* High-Conversion Clean CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#003629] hover:bg-[#1B4D3E] text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-98"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-[#64F9BC]" />
            </Link>

            <a
              href="#methodology"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm transition-all shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>See Interactive Demo</span>
            </a>
          </div>

          {/* Minimalist Trust Indicator */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Free Forever Tier
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              No Credit Card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Instant Subdomain Setup
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HeroSection;
