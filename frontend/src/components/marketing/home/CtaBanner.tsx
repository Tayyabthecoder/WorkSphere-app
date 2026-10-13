import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

export const CtaBanner: React.FC = () => {
  const navigate = useNavigate();
  const [subdomain, setSubdomain] = useState('');

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanSubdomain) {
      navigate(`/onboarding?workspace=${encodeURIComponent(cleanSubdomain)}`);
    } else {
      navigate('/register');
    }
  };

  return (
    <section className="py-12 md:py-16 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Architectural, Minimalist Container with Soft Emerald Mint Surface */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50/90 via-emerald-50/50 to-teal-50/70 p-8 sm:p-12 lg:p-14 border border-emerald-200/80 text-center space-y-7 shadow-xs relative overflow-hidden">
          
          {/* Subtle Ambient Mint Glows */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-[#006C4B]">
              Instant Onboarding
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-[-0.035em] leading-[1.08]">
              Ready to work with total clarity?
            </h2>
            <p className="text-base sm:text-lg text-slate-500 font-normal leading-relaxed">
              Launch your organization’s dedicated sphere in 2 minutes. Free forever with unlimited projects, multi-methodology tracking, and complete tenant data isolation.
            </p>
          </div>

          {/* Minimalist Subdomain Form */}
          <form onSubmit={handleClaim} className="relative z-10 max-w-md mx-auto pt-2">
            <div className="flex items-center bg-white p-1.5 rounded-full border border-emerald-200/90 shadow-sm focus-within:border-[#006C4B] transition-colors">
              <div className="flex items-center flex-1 px-3 text-slate-800">
                <Building2 className="w-4 h-4 text-emerald-600/70 mr-2 shrink-0" />
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="your-company"
                  className="w-full bg-transparent text-sm font-medium focus:outline-hidden text-slate-900 placeholder-slate-400"
                  aria-label="Enter desired workspace subdomain"
                />
                <span className="text-xs text-slate-400 font-mono pl-1 select-none whitespace-nowrap">
                  .worksphere.app
                </span>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#003629] hover:bg-[#1B4D3E] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <span>Claim</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#64F9BC]" />
              </button>
            </div>
          </form>

          {/* Reassurance pills */}
          <div className="relative z-10 pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Zero Setup Fees
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Unlimited Projects
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Logical Tenant Isolation
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};

export default CtaBanner;
