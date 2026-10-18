import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export const BlogConversionCta: React.FC = () => {
  return (
    <section className="my-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003629] via-[#002B21] to-[#001D16] text-white p-8 sm:p-12 border border-emerald-800/60 shadow-xl">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>High-Velocity Project Delivery</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
          Accelerate your squad's engineering cadence with WorkSphere.
        </h3>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
          Orchestrate multi-tenant Kanban boards, real-time sprint velocity charts, and sub-50ms state synchronization across distributed teams.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant real-time WebSocket updates</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Logical multi-tenant data isolation</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#00221A] text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 transition-all cursor-pointer"
          >
            <span>Start Free 14-Day Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/features"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            Explore Platform Features
          </Link>
        </div>

        <p className="text-[11px] text-slate-400">
          No credit card required &bull; Instant workspace setup &bull; Full platform features included
        </p>
      </div>
    </section>
  );
};

export default BlogConversionCta;
