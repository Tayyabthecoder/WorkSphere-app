import React from 'react';
import { 
  Kanban, 
  Zap, 
  Clock, 
  DollarSign, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CapabilityCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge: string;
  description: string;
  highlights: string[];
}

const capabilities: CapabilityCard[] = [
  {
    icon: Kanban,
    title: 'Multi-View Orchestration',
    badge: 'Kanban & Gantt',
    description: 'Switch between drag-and-drop Kanban boards, interactive Gantt timelines, and dense spreadsheet lists. Updates sync across all perspectives in real time.',
    highlights: ['Interactive Gantt dependencies', 'Drag-and-drop card workflows', 'Unified portfolio overview']
  },
  {
    icon: Zap,
    title: 'Sprint Velocity & Backlogs',
    badge: 'Agile & Scrum',
    description: 'Plan 2-week iterations, groom product backlogs, and track story point delivery with automated sprint burndown analytics—without Jira complexity.',
    highlights: ['Story point estimation', 'Automated burndown metrics', 'WIP limits & sprint health']
  },
  {
    icon: Clock,
    title: 'Integrated Task Timers',
    badge: 'Time Governance',
    description: 'Track billable and non-billable hours directly inside assigned cards. Generate weekly timesheets and export itemized records for client reporting in one click.',
    highlights: ['1-click task timers', 'Billable vs non-billable rates', 'CSV & PDF timesheet export']
  },
  {
    icon: DollarSign,
    title: 'Real-Time Budget Margins',
    badge: 'Financial Oversight',
    description: 'Establish milestone budgets, track labor costs against actual expenses, and receive proactive warnings before the 80% budget threshold is reached.',
    highlights: ['Live budget burn rate', 'Proactive threshold warnings', 'Automated client invoicing']
  },
  {
    icon: Globe,
    title: 'Dedicated Branded Subdomains',
    badge: 'Multi-Tenancy',
    description: 'Provision your organization’s private workspace at your-company.worksphere.app with complete schema-level database isolation and custom branding.',
    highlights: ['Custom subdomain URLs', 'Strict logical data isolation', 'Self-service tenant onboarding']
  },
  {
    icon: ShieldCheck,
    title: 'Five-Tier Access Security',
    badge: 'Enterprise RBAC',
    description: 'Govern workspace access with precision. Configure roles from Super Admin and Org Admin down to Project Managers, Team Members, and Viewers.',
    highlights: ['Granular project permissions', 'Role-based route protection', 'Audit trail & activity log']
  }
];

export const CoreFeaturesBento: React.FC = () => {
  return (
    <section className="py-14 md:py-18 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        
        {/* Section Header (Linear / Stripe style) */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
            Product Capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
            Everything your team needs to execute.
          </h2>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            A cohesive suite of tools engineered to replace fragmented subscriptions and deliver complete operational clarity.
          </p>
        </div>

        {/* Modern 6-Card Grid (Spacious, Crisp, Linear-style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B] transition-transform group-hover:scale-105">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Highlights List */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {item.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Note */}
        <div className="text-center pt-4">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#006C4B] hover:text-[#003629] group transition-colors"
          >
            <span>Explore all features and workflows in detail</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default CoreFeaturesBento;
