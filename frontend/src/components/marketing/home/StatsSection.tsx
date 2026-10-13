import React from 'react';

interface MetricItem {
  value: string;
  label: string;
  caption: string;
}

const metrics: MetricItem[] = [
  {
    value: '80%',
    label: 'Less reporting overhead',
    caption: 'Automated Gantt rollups replace hours of manual status slide creation.'
  },
  {
    value: '< 5m',
    label: 'Self-service onboarding',
    caption: 'Provision your dedicated branded workspace in minutes without a sales call.'
  },
  {
    value: '3-in-1',
    label: 'Methodology flexibility',
    caption: 'Seamlessly run Agile sprints, Waterfall milestones, and Hybrid portfolios.'
  },
  {
    value: '100%',
    label: 'Tenant data isolation',
    caption: 'Logical schema-level multi-tenancy ensures absolute organizational privacy.'
  }
];

export const StatsSection: React.FC = () => {
  return (
    <section className="py-12 md:py-16 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subtle, confident header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
            Proven Team Impact
          </p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
            Built for speed, clarity, and trust
          </h2>
        </div>

        {/* Horizontal Typographic Flow (No boxy clutter) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {metrics.map((item, idx) => (
            <div key={idx} className="flex flex-col space-y-2 border-l-2 border-slate-150 pl-5">
              <div className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {item.value}
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {item.label}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                {item.caption}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
