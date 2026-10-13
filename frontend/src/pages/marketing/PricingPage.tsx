import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Zap,
  Building2,
  Clock,
  Layers,
  Lock,
  Minus,
  Check
} from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  highlighted?: boolean;
  priceMonthly: number;
  priceAnnual: number;
  priceSuffix: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Edition',
    badge: 'Free Forever',
    highlighted: false,
    priceMonthly: 0,
    priceAnnual: 0,
    priceSuffix: '/ user / month',
    description: 'For fast-moving squads, startups, and agile teams launching without friction.',
    features: [
      'Unlimited projects, tasks & subtasks',
      'Interactive Kanban, Gantt timeline & Sprints',
      'Task timers & weekly timesheet logging',
      'Basic project budget tracking & cost alerts',
      'Dedicated tenant subdomain (org.worksphere.app)',
      'Community & standard email support'
    ],
    ctaText: 'Start Free in 2 Mins',
    ctaLink: '/register'
  },
  {
    id: 'pro',
    name: 'Pro Edition',
    badge: 'Most Popular',
    highlighted: true,
    priceMonthly: 12,
    priceAnnual: 10,
    priceSuffix: '/ user / month',
    description: 'For scaling agencies and multi-team organizations needing client portals & deep automation.',
    features: [
      'Everything in Starter Edition',
      'External Client Portal with guest role permissions',
      'Manager timesheet approvals & billing export',
      'Automated webhook triggers & custom integrations',
      '100 GB encrypted document storage',
      'Priority SLA support (< 2-hour response)'
    ],
    ctaText: 'Get Started with Pro',
    ctaLink: '/register?plan=pro'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Tier',
    badge: 'Custom Architecture',
    highlighted: false,
    priceMonthly: 0,
    priceAnnual: 0,
    priceSuffix: 'Custom pricing',
    description: 'For high-scale organizations requiring custom SSO, dedicated infrastructure, and tailored SLAs.',
    features: [
      'Everything in Pro Edition',
      'SAML 2.0 / SSO & Active Directory integration',
      'Dedicated database cluster & multi-region hot replicas',
      '99.99% Uptime SLA with financial commitment',
      'Self-hosted on-premise Docker deployment option',
      'Dedicated Technical Account Manager & 24/7 hotline'
    ],
    ctaText: 'Contact Enterprise Team',
    ctaLink: '/contact?inquiry=enterprise'
  }
];

interface ComparisonCategory {
  title: string;
  icon: React.ElementType;
  items: {
    name: string;
    starter: string | boolean;
    pro: string | boolean;
    enterprise: string | boolean;
  }[];
}

const comparisonMatrix: ComparisonCategory[] = [
  {
    title: 'Core Work & Project Management',
    icon: Layers,
    items: [
      { name: 'Unlimited Projects & Tasks', starter: true, pro: true, enterprise: true },
      { name: 'Interactive Kanban Boards', starter: true, pro: true, enterprise: true },
      { name: 'Gantt Timeline Chart', starter: true, pro: true, enterprise: true },
      { name: 'Scrum Sprints & Backlog Management', starter: true, pro: true, enterprise: true },
      { name: 'Custom Task Tags & Priority Matrix', starter: true, pro: true, enterprise: true },
      { name: 'Sub-50ms Real-Time WebSocket Sync', starter: true, pro: true, enterprise: true }
    ]
  },
  {
    title: 'Time Tracking & Financial Control',
    icon: Clock,
    items: [
      { name: 'Task-Level Stopwatch Timers', starter: true, pro: true, enterprise: true },
      { name: 'Weekly Timesheet Submission', starter: true, pro: true, enterprise: true },
      { name: 'Manager Timesheet Approvals', starter: 'Basic', pro: 'Advanced Workflow', enterprise: 'Multi-Tier Approvals' },
      { name: 'Project Budget Cap Alerts', starter: true, pro: true, enterprise: true },
      { name: 'Invoice Generation & Billable Hours Export', starter: false, pro: 'PDF & CSV Export', enterprise: 'Custom ERP Sync' }
    ]
  },
  {
    title: 'Collaboration & Client Access',
    icon: Building2,
    items: [
      { name: 'Tenant Subdomain Routing', starter: 'Shared subdomain', pro: 'Shared subdomain', enterprise: 'Custom Domain (CNAME)' },
      { name: 'Role-Based Access Control (RBAC)', starter: 'Standard 4 Roles', pro: 'Custom Roles', enterprise: 'Granular Matrix' },
      { name: 'External Client Portal Access', starter: false, pro: 'Included', enterprise: 'Custom White-label' },
      { name: 'Document & File Storage', starter: '5 GB', pro: '100 GB', enterprise: 'Unlimited / Custom S3' },
      { name: 'Audit History Retention', starter: '30 Days', pro: '1 Year', enterprise: 'Unlimited Immutable' }
    ]
  },
  {
    title: 'Security & Enterprise Governance',
    icon: Lock,
    items: [
      { name: 'AES-256 at Rest & TLS 1.3 in Transit', starter: true, pro: true, enterprise: true },
      { name: 'Automated Multi-Region Backups', starter: 'Daily', pro: 'Hourly', enterprise: 'Continuous Hot Sync' },
      { name: 'SAML 2.0 / Okta / Azure AD SSO', starter: false, pro: false, enterprise: true },
      { name: 'Uptime SLA Guarantee', starter: '99.9% standard', pro: '99.9% prioritized', enterprise: '99.99% Financial SLA' },
      { name: 'Self-Hosted Docker Deployment', starter: false, pro: false, enterprise: true }
    ]
  }
];

interface CompetitorComparisonRow {
  feature: string;
  worksphere: string | boolean;
  jira: string | boolean;
  asana: string | boolean;
  monday: string | boolean;
  highlight?: boolean;
}

const competitorComparison: CompetitorComparisonRow[] = [
  {
    feature: 'Starting Plan',
    worksphere: '$0 Free Forever (Unlimited projects)',
    jira: 'Freemium (Max 10 users)',
    asana: 'Freemium (Limited features)',
    monday: 'Freemium (Max 2 users)',
    highlight: true
  },
  {
    feature: 'Real-Time State Sync',
    worksphere: '< 50ms WebSockets (Instant)',
    jira: 'Manual page refresh / polling',
    asana: 'Periodic polling (3–5s lag)',
    monday: 'Cloud polling (3–5s lag)',
    highlight: true
  },
  {
    feature: 'Multi-Methodology (Scrum, Kanban, Gantt)',
    worksphere: true,
    jira: 'Scrum/Kanban only (Gantt add-on)',
    asana: 'Lists & basic boards only',
    monday: 'Table-first boards only'
  },
  {
    feature: 'Interactive Gantt & Critical Path',
    worksphere: true,
    jira: 'Requires Advanced Roadmaps ($$)',
    asana: 'Requires Business plan ($24.99/mo)',
    monday: 'Requires Pro plan ($16/mo)'
  },
  {
    feature: 'Integrated Timesheets & Cost Margin Alerts',
    worksphere: true,
    jira: 'Requires paid plugins (Tempo $5+/mo)',
    asana: 'Requires Harvest integration',
    monday: 'Enterprise tier add-on'
  },
  {
    feature: 'External Client Portal (Zero Seat Cost)',
    worksphere: true,
    jira: 'Requires Jira Service Mgmt seats',
    asana: 'Strictly limited guest seats',
    monday: 'Paid viewer seats required'
  },
  {
    feature: 'Self-Hosted VPC Deployment (Docker / Helm)',
    worksphere: true,
    jira: 'Deprecated (Data Center $42k/yr+)',
    asana: false,
    monday: false,
    highlight: true
  },
  {
    feature: 'Tenant Data Isolation',
    worksphere: 'Subdomain schema isolation',
    jira: 'Shared multi-tenant database',
    asana: 'Shared multi-tenant database',
    monday: 'Shared multi-tenant database'
  },
  {
    feature: 'Interface Performance',
    worksphere: 'Sub-second interaction speed',
    jira: 'Heavy legacy enterprise latency',
    asana: 'Complex script overhead',
    monday: 'High browser memory footprint'
  }
];

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'Do I need a credit card to get started with the Starter edition?',
    answer: 'No. You can create your dedicated workspace and start executing sprints immediately with zero payment details. The Community Starter edition is free forever.'
  },
  {
    question: 'Do external clients count against our paid user seats?',
    answer: 'No. On the Pro edition, external clients invited with client portal access to review project deliverables and milestone status do not count as paid team seats.'
  },
  {
    question: 'Can I switch between monthly and annual billing at any time?',
    answer: 'Yes, absolutely. You can upgrade, downgrade, or adjust your billing cycle whenever needed from your organization settings. All billing changes are prorated immediately.'
  },
  {
    question: 'How is tenant data isolated across workspaces?',
    answer: 'WorkSphere enforces strict schema-level tenant boundaries. Every API request, database query, and real-time WebSocket event is validated against your unique workspace subdomain before execution.'
  },
  {
    question: 'Can we export all of our project data if we decide to leave?',
    answer: 'Yes. You retain full data sovereignty. You can export complete project boards, sprint records, time logs, and audit histories in structured JSON and CSV at any time.'
  },
  {
    question: 'Can WorkSphere be deployed on-premise for high-security environments?',
    answer: 'Yes. Our Enterprise tier includes self-hosted Docker container configurations with custom air-gapped deployment guidance and dedicated engineering assistance.'
  }
];

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <MarketingLayout>
      <div className="bg-[#FAFBF9]">
        
        {/* 1. Header Hero */}
        <section className="py-16 md:py-24 border-b border-slate-200/80 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Transparent & Predictable Pricing</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-[-0.035em] leading-[1.1]">
              Enterprise project power. <br className="hidden sm:inline" />
              Zero hidden feature tax.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Consolidate your entire product and agency workflow on a single high-performance MERN engine. No surprise seat limits, no forced upgrades for core tools.
            </p>

            {/* Trust Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Cancel Anytime
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% Tenant Isolation
              </span>
            </div>

          </div>
        </section>

        {/* 2. Pricing Tiers Cards Section */}
        <section className="py-14 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Billing Interval Toggle (In Pricing Section) */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-[#003629] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-[#003629] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight ${
                    billingCycle === 'annual'
                      ? 'bg-[#64F9BC] text-[#003629]'
                      : 'bg-emerald-100 text-[#006C4B]'
                  }`}
                >
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {pricingTiers.map((tier) => {
              const displayPrice = tier.id === 'enterprise' 
                ? 'Custom' 
                : tier.id === 'starter' 
                  ? '$0' 
                  : billingCycle === 'annual' 
                    ? `$${tier.priceAnnual}` 
                    : `$${tier.priceMonthly}`;

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-3xl p-8 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                    tier.highlighted
                      ? 'bg-white border-2 border-emerald-600 shadow-xl lg:-translate-y-2'
                      : 'bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Highlight pill */}
                  {tier.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs ${
                          tier.highlighted
                            ? 'bg-[#003629] text-[#64F9BC] border border-emerald-600/40'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {tier.highlighted && <Sparkles className="w-3 h-3 text-[#64F9BC]" />}
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                        {tier.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed min-h-[40px]">
                        {tier.description}
                      </p>
                    </div>

                    {/* Price Display */}
                    <div className="pt-2 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
                          {displayPrice}
                        </span>
                        {tier.id !== 'enterprise' && (
                          <span className="text-xs text-slate-500 font-medium">
                            {tier.priceSuffix}
                          </span>
                        )}
                      </div>
                      {tier.id === 'pro' && billingCycle === 'annual' && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                          Billed annually ($120/yr). Save $24 per seat.
                        </p>
                      )}
                      {tier.id === 'starter' && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                          Free forever for early adopters & startups.
                        </p>
                      )}
                      {tier.id === 'enterprise' && (
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">
                          Tailored contract for large-scale operations.
                        </p>
                      )}
                    </div>

                    {/* Inclusions list */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Included in this edition:
                      </p>
                      <ul className="space-y-3">
                        {tier.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-8 mt-6 border-t border-slate-100">
                    <Link
                      to={tier.ctaLink}
                      className={`w-full py-3.5 px-5 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                        tier.highlighted
                          ? 'bg-[#003629] hover:bg-[#1B4D3E] text-white shadow-sm hover:scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <span>{tier.ctaText}</span>
                      <ArrowRight className={`w-4 h-4 ${tier.highlighted ? 'text-[#64F9BC]' : 'text-slate-400'}`} />
                    </Link>
                  </div>

                </div>
              );
            })}

          </div>
        </section>

        {/* 3. Complete Feature Comparison Matrix */}
        <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 border-t border-slate-200/80">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
              Granular Inclusions
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
              Compare plans side by side
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every tier is engineered for speed, clean aesthetics, and zero fluff. Review the full breakdown below.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-200/80 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              <div className="col-span-6 sm:col-span-5">Features</div>
              <div className="col-span-2 sm:col-span-2 text-center">Starter</div>
              <div className="col-span-2 sm:col-span-3 text-center text-[#006C4B]">Pro</div>
              <div className="col-span-2 sm:col-span-2 text-center">Enterprise</div>
            </div>

            {/* Table Categories & Items */}
            <div className="divide-y divide-slate-100">
              {comparisonMatrix.map((cat, catIdx) => {
                const IconComponent = cat.icon;
                return (
                  <div key={catIdx} className="p-0">
                    
                    {/* Category Title Banner */}
                    <div className="bg-[#FAFBF9] px-6 py-3.5 flex items-center gap-2.5 border-y border-slate-200/60">
                      <IconComponent className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-display font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                        {cat.title}
                      </span>
                    </div>

                    {/* Category Rows */}
                    <div className="divide-y divide-slate-100">
                      {cat.items.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="grid grid-cols-12 px-6 py-4 items-center text-xs sm:text-sm hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="col-span-6 sm:col-span-5 font-medium text-slate-800 pr-2">
                            {row.name}
                          </div>

                          {/* Starter column */}
                          <div className="col-span-2 sm:col-span-2 text-center text-slate-600">
                            {typeof row.starter === 'boolean' ? (
                              row.starter ? (
                                <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs font-semibold">{row.starter}</span>
                            )}
                          </div>

                          {/* Pro column */}
                          <div className="col-span-2 sm:col-span-3 text-center text-slate-800 font-semibold bg-emerald-50/20 py-1 rounded-lg">
                            {typeof row.pro === 'boolean' ? (
                              row.pro ? (
                                <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs font-bold text-[#006C4B]">{row.pro}</span>
                            )}
                          </div>

                          {/* Enterprise column */}
                          <div className="col-span-2 sm:col-span-2 text-center text-slate-600">
                            {typeof row.enterprise === 'boolean' ? (
                              row.enterprise ? (
                                <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs font-semibold">{row.enterprise}</span>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* 4. Competitor Market Comparison Table */}
        <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 border-t border-slate-200/80">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#006C4B]">
              Market Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
              WorkSphere vs. Legacy Tools
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              See how WorkSphere delivers superior speed, multi-tenant privacy, and modern engineering ergonomics compared to traditional incumbents.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-4 px-6 w-2/5">Capabilities &amp; Architecture</th>
                    <th className="py-4 px-6 w-1/4 bg-emerald-50/80 border-x border-emerald-200/80 text-emerald-950">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">WorkSphere</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 normal-case tracking-normal">
                          Modern Standard
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-center text-slate-500 font-semibold">Atlassian Jira</th>
                    <th className="py-4 px-5 text-center text-slate-500 font-semibold">Asana</th>
                    <th className="py-4 px-5 text-center text-slate-500 font-semibold">Monday.com</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {competitorComparison.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {row.feature}
                      </td>
                      <td className="py-4 px-6 bg-emerald-50/30 border-x border-emerald-200/60 font-semibold text-emerald-950">
                        {typeof row.worksphere === 'boolean' ? (
                          row.worksphere ? (
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Included</span>
                            </div>
                          ) : (
                            <Minus className="w-4 h-4 text-slate-300" />
                          )
                        ) : (
                          <span className="text-xs font-bold text-[#006C4B]">
                            {row.worksphere}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center text-xs text-slate-600">
                        {typeof row.jira === 'boolean' ? (
                          row.jira ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span>{row.jira}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center text-xs text-slate-600">
                        {typeof row.asana === 'boolean' ? (
                          row.asana ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span>{row.asana}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center text-xs text-slate-600">
                        {typeof row.monday === 'boolean' ? (
                          row.monday ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span>{row.monday}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#FAFBF9] px-6 py-3.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Zero seat penalties for external clients on WorkSphere
              </span>
              <span className="hidden sm:inline font-mono">
                Verified based on standard publicly advertised SaaS plans
              </span>
            </div>
          </div>
        </section>

        {/* 5. Frequently Asked Questions Accordion */}
        <section className="py-16 md:py-24 pb-20 md:pb-28 bg-white border-t border-slate-200/80">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#006C4B]">
                Quick Answers
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-slate-600">
                Everything you need to know about billing, workspace provisioning, and tenant security.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/80 bg-white overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-bold text-slate-900">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-emerald-700' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-[#FAFBF9]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Have a customized compliance, SOC2, or invoicing requirement?{' '}
                <Link to="/contact" className="text-[#006C4B] font-bold underline hover:text-[#1B4D3E]">
                  Contact our solutions team
                </Link>
                .
              </p>
            </div>

          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default PricingPage;
