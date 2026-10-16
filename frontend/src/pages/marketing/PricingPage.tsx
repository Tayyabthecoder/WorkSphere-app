import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Building2,
  Clock,
  Layers,
  Lock,
  Minus,
  Check,
  X
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
    ctaLink: '/register?plan=starter'
  },
  {
    id: 'pro',
    name: 'Pro Edition',
    badge: 'Free for Now',
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
    ctaText: 'Get Started Free (Pro)',
    ctaLink: '/register?plan=pro'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Tier',
    badge: 'Free for Now',
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
    ctaText: 'Access Free (Enterprise)',
    ctaLink: '/register?plan=enterprise'
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
    worksphere: '$0 Free Forever (All tiers free for now)',
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
    question: 'Is WorkSphere really free for now?',
    answer: 'Yes! During our public launch, WorkSphere is completely free of charge for all teams. You get unrestricted access to all features (including Pro and Enterprise capabilities) with no credit card required and no automatic billing.'
  },
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
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedTierForFreeNotice, setSelectedTierForFreeNotice] = useState<PricingTier | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handlePlanClick = (tier: PricingTier) => {
    setSelectedTierForFreeNotice(tier);
  };

  return (
    <MarketingLayout>
      <div className="bg-[#FAFBF9]">
        
        {/* 1. Header Hero */}
        <section className="py-16 md:py-24 border-b border-slate-200/80 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Public Launch • 100% Free For Now</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-[-0.035em] leading-[1.1]">
              Enterprise project power. <br className="hidden sm:inline" />
              Free for all teams for now.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Consolidate your entire product and agency workflow on a single high-performance MERN engine. WorkSphere is currently 100% free during our public launch—unlock all Pro and Enterprise features with zero fees.
            </p>

            {/* Trust Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% Free For Now
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All Features Unlocked
              </span>
            </div>

          </div>
        </section>

        {/* 2. Pricing Tiers Cards Section */}
        <section className="py-14 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Prominent Early Access Banner */}
          <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    Platform is Free for Now!
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-200 text-emerald-900">
                    Early Access
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Looking to purchase a plan? All tiers and features are currently free for all teams. No credit card or billing required.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handlePlanClick(pricingTiers[1])}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#003629] text-white text-xs font-bold hover:bg-[#004D3A] transition-colors cursor-pointer shadow-xs"
            >
              See Free Details
            </button>
          </div>

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
              const displayRegularPrice = tier.id === 'enterprise' 
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
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
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
                          $0
                        </span>
                        {tier.id === 'pro' && (
                          <span className="text-sm text-slate-400 line-through font-medium">
                            {displayRegularPrice}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-[#006C4B]">
                          {tier.id === 'starter' ? 'Free forever' : 'Free for now'}
                        </span>
                      </div>
                      {tier.id === 'pro' && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                          Full Pro features unlocked at zero cost during public launch.
                        </p>
                      )}
                      {tier.id === 'starter' && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                          Free forever for early adopters & startups.
                        </p>
                      )}
                      {tier.id === 'enterprise' && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                          Full enterprise capabilities unlocked with zero contract.
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

                  {/* Action CTA Button */}
                  <div className="pt-8 mt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handlePlanClick(tier)}
                      className={`w-full py-3.5 px-5 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                        tier.highlighted
                          ? 'bg-[#003629] hover:bg-[#1B4D3E] text-white shadow-sm hover:scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <span>{tier.ctaText}</span>
                      <ArrowRight className={`w-4 h-4 ${tier.highlighted ? 'text-[#64F9BC]' : 'text-slate-400'}`} />
                    </button>
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
              <div className="col-span-2 sm:col-span-2 text-center">Starter (Free)</div>
              <div className="col-span-2 sm:col-span-3 text-center text-[#006C4B]">Pro (Free for now)</div>
              <div className="col-span-2 sm:col-span-2 text-center">Enterprise (Free for now)</div>
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

            {/* Table Footer */}
            <div className="bg-[#FAFBF9] px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                All tiers include 256-bit AES encryption & isolated tenant namespaces
              </span>
              <button
                type="button"
                onClick={() => handlePlanClick(pricingTiers[1])}
                className="text-[#006C4B] font-bold hover:underline cursor-pointer"
              >
                Claim Free Pro Access &rarr;
              </button>
            </div>

          </div>
        </section>

        {/* 4. Competitor Comparison Section */}
        <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 border-t border-slate-200/80">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
              Market Value & Total Cost of Ownership
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
              WorkSphere vs. Legacy Tools
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Why high-velocity teams choose WorkSphere over bloated, fragmented point solutions with punitive per-seat licensing.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 text-slate-500">Feature / Capability</th>
                    <th className="py-4 px-6 text-[#003629] bg-emerald-100/60 font-extrabold border-x border-emerald-300/60">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#006C4B]" />
                        <span>WorkSphere</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-center text-slate-500 font-semibold">Jira</th>
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

      {/* 6. "Platform is Free for Now" Modal Dialog */}
      {selectedTierForFreeNotice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedTierForFreeNotice(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedTierForFreeNotice(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge & Title */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Early Access • 100% Free Public Launch</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
                WorkSphere is Free For Now!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You selected the <strong className="text-slate-900">{selectedTierForFreeNotice.name}</strong>. Great news! During our public launch, the entire platform is completely free to use—no purchase, credit card, or payment details required.
              </p>
            </div>

            {/* Plan Card Callout */}
            <div className="p-4 rounded-2xl bg-[#FAFBF9] border border-slate-200/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Selected Tier
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {selectedTierForFreeNotice.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {selectedTierForFreeNotice.description}
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="text-lg font-black text-[#006C4B]">$0 / Free</div>
                {selectedTierForFreeNotice.id === 'pro' && (
                  <div className="text-[10px] text-slate-400 line-through">
                    Normally $12/user
                  </div>
                )}
              </div>
            </div>

            {/* Unlocked Benefits list */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What you get at zero cost:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Full feature access:</strong> Kanban boards, Gantt timelines, Sprints & Backlogs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>External Client Portal:</strong> Share real-time deliverables with zero seat fees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Timesheet & Budget Tracking:</strong> Track billables, burn rates, and project margins.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>No Payment Required:</strong> Instant setup with no credit card or invoice commitments.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  const targetPlan = selectedTierForFreeNotice.id;
                  setSelectedTierForFreeNotice(null);
                  navigate(`/register?plan=${targetPlan}`);
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-[#003629] hover:bg-[#004D3A] text-white font-bold text-xs sm:text-sm text-center shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim Free Access & Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedTierForFreeNotice(null)}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Back to Plans
              </button>
            </div>

          </div>
        </div>
      )}

    </MarketingLayout>
  );
};

export default PricingPage;
