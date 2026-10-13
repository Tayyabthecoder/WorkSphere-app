import React, { useState } from 'react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import { 
  Kanban, 
  Clock, 
  DollarSign, 
  Globe, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  GitBranch, 
  Zap, 
  BarChart3, 
  Laptop, 
  Briefcase, 
  Target, 
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
  question: string;
  answer: string;
}

const servicesFaqs: FaqItem[] = [
  {
    question: 'Can different teams within one organization use different project frameworks?',
    answer: 'Yes. WorkSphere is methodology-agnostic. Software squads can run 2-week Scrum sprints, marketing and agency teams can run continuous Kanban boards, and leadership can track high-level cross-functional milestones on Gantt timelines.'
  },
  {
    question: 'How does the external Client Portal preserve internal workspace confidentiality?',
    answer: 'Client Portals rely on cryptographically signed, tokenized read-only links with granular visibility rules. External stakeholders only see client-approved milestones, burndown velocity, and deliverables—never internal team chatter, hourly costs, or unreviewed backlog items.'
  },
  {
    question: 'Does WorkSphere track agency billable hours, rates, and budgets?',
    answer: 'Yes. Team members can launch real-time task timers or submit weekly timesheets. You can define billable hourly rates per seat or role, monitor live spend against fixed contract caps, and receive automated margin warnings.'
  },
  {
    question: 'Can our organization migrate active workloads from Jira, Asana, or ClickUp?',
    answer: 'Yes. WorkSphere includes native CSV schema importers and automated task mapping that retain task hierarchies, custom priorities, assignees, and sprint tags from legacy platforms.'
  }
];

interface RoleSolution {
  id: string;
  role: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  painPoint: string;
  solution: string;
  keyFeatures: string[];
  metrics: string;
}

const roleSolutions: RoleSolution[] = [
  {
    id: 'software',
    role: 'Software & Product Squads',
    badge: 'Agile & Scrum',
    icon: Laptop,
    tagline: 'High sprint velocity, story points, and backlog grooming without Jira bloat.',
    description: 'Empower autonomous engineering squads to plan 2-week iterations, estimate story point poker, and track burndown velocity without getting bogged down in complex administrative configuration.',
    painPoint: 'Clunky enterprise ticketing tools slow down standups and create friction for developers.',
    solution: 'Lightweight Agile boards with 1-click sprint rollovers, real-time WIP limits, and focused "My Work" developer views.',
    keyFeatures: [
      'Interactive sprint backlogs & story point poker',
      'Automated sprint burndown & velocity analytics',
      'Customizable WIP limits & swimlane boards',
      'Distraction-free personal task dashboard'
    ],
    metrics: '50% faster sprint planning'
  },
  {
    id: 'agencies',
    role: 'Agencies & Consultancies',
    badge: 'Billable Governance',
    icon: Briefcase,
    tagline: 'Task-level timer tracking, client budget defense, and 1-click invoice exports.',
    description: 'Designed specifically for client service agencies. Track billable hours directly inside assigned cards, enforce client budget caps before cost overruns happen, and generate client-ready invoice reports.',
    painPoint: 'Hours lost across separate time tracking apps lead to unbilled client work and invoice disputes.',
    solution: 'Integrated active timers with billable hourly rate cards and automated timesheet approvals.',
    keyFeatures: [
      '1-click active timers inside assigned cards',
      'Billable vs non-billable labor rates per member',
      'Live budget burn tracking with 80% threshold warnings',
      'Instant CSV and PDF invoice record exports'
    ],
    metrics: '$5k+ saved annually on SaaS'
  },
  {
    id: 'engineering',
    role: 'Engineering & Contractors',
    badge: 'Deterministic Waterfall',
    icon: GitBranch,
    tagline: 'Deterministic Gantt milestones, dependency links, and critical path governance.',
    description: 'Engineered for hardware contracts, infrastructure, and deliverable-driven client engagements. Visualize predecessor-successor task links, calculate critical path slack, and enforce manager approval gates.',
    painPoint: 'Missing a single prerequisite task delays entire project delivery by weeks.',
    solution: 'Interactive Gantt timeline with strict dependency constraints and automated critical path slack calculation.',
    keyFeatures: [
      'Drag-and-drop Gantt timeline with dependency links',
      'Automated critical path slack detection',
      'Phase-gated manager approvals for milestone completion',
      'Fixed-date baseline delivery tracking'
    ],
    metrics: 'Zero hidden dependency delays'
  },
  {
    id: 'leadership',
    role: 'Executive PMOs & Leadership',
    badge: 'Portfolio Health',
    icon: BarChart3,
    tagline: 'Cross-project portfolio rollups and team capacity without manual status slides.',
    description: 'Give directors and stakeholders real-time transparency across all active projects. Monitor team capacity heatmaps, identify resource bottlenecks early, and view automated rollup reports.',
    painPoint: 'PMs spend 8+ hours every week manually assembling status slides for executive leadership.',
    solution: 'Unified multi-project portfolio dashboard with live health indicators and capacity forecasting.',
    keyFeatures: [
      'Cross-organization portfolio health overview',
      'Weekly team workload & capacity heatmaps',
      'Automated milestone status rollups',
      'External tokenized read-only Client Portal'
    ],
    metrics: '8h/week saved per manager'
  }
];

export const ServicesPage: React.FC = () => {
  const [activeRoleTab, setActiveRoleTab] = useState<string>('software');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentRole = roleSolutions.find((r) => r.id === activeRoleTab) || roleSolutions[0];
  const CurrentRoleIcon = currentRole.icon;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <MarketingLayout>
      {/* 1. Hero Section */}
      <section className="relative pt-14 pb-14 md:pt-18 md:pb-16 bg-white overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-50/70 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#006C4B] font-bold">Platform Services & Capabilities</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">End-to-End Delivery</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-[-0.035em] leading-[1.08] max-w-4xl mx-auto">
            Complete operational infrastructure, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003629] via-[#006C4B] to-emerald-500">
              without SaaS fragmentation.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            WorkSphere eliminates data silos by uniting Agile sprint execution, interactive Gantt timelines, task timers, and budget margin defense inside dedicated tenant-isolated workspaces.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#003629] hover:bg-[#1B4D3E] text-white font-bold text-xs shadow-xs transition-all active:scale-95 border border-emerald-500/20"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64F9BC]" />
            </Link>
            <a
              href="#pillars"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs transition-all"
            >
              <span>Explore 4 Core Pillars</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Four Core Service Pillars */}
      <section id="pillars" className="py-14 md:py-18 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
              Core Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
              The 4 Pillars of WorkSphere Platform
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Four robust service modules designed to provide seamless operational clarity across every phase of delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    Pillar 01
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-slate-900">
                  Multi-Methodology Project Engine
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Never force engineers into rigid Gantt charts or client managers into code backlogs. WorkSphere bridges Agile Scrum sprints, Waterfall milestones, and dense list spreadsheets into a synchronized data core.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time sprint velocity & automated burndown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Gantt dependencies with critical path slack detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant view switching: Board, Timeline, List & Calendar</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-[#006C4B] inline-flex items-center gap-1">
                  Supports Agile, Waterfall & Hybrid frameworks <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    Pillar 02
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-slate-900">
                  Time Governance & Financial Budgeting
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Track hours directly on cards without expensive third-party subscriptions. Establish project budget caps, monitor real-time burn rates, and receive proactive warnings before margin erosion occurs.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1-click live task timer with billable classification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hourly bill & cost rate cards per team member</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Proactive 80% budget alerts & 1-click invoice export</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-[#006C4B] inline-flex items-center gap-1">
                  Replaces Toggl & Harvest with zero setup fees <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B]">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    Pillar 03
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-slate-900">
                  Tokenized Client Portal & External Sharing
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Share milestone completion and sprint deliverables with clients securely. Generate tokenized, read-only portal URLs that require zero user registration while completely isolating internal squad discussions.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tokenized zero-login external URL sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time milestone progress & deliverable sign-offs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Strict filtering hides internal tickets & team comments</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-[#006C4B] inline-flex items-center gap-1">
                  Transparent client collaboration built-in <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    Pillar 04
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-slate-900">
                  Multi-Tenancy & Data Privacy Architecture
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every organization provisions its own branded workspace at your-company.worksphere.app. Enjoy peace of mind with schema-level tenant data isolation, JWT refresh rotations, and 5-tier role-based access control.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated branded subdomains with custom logo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Schema-level logical database isolation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>5-tier RBAC: Admin, PM, Member, Client & Viewer</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-[#006C4B] inline-flex items-center gap-1">
                  Enterprise security standards at zero cost <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Solutions by Role (Interactive Tabs) */}
      <section id="roles" className="py-14 md:py-18 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
              Role-Tailored Workflows
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
              Tailored for every team member
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Discover how WorkSphere adapts seamlessly to developers, project managers, agency owners, and executive leadership.
            </p>
          </div>

          {/* Tab Selector Bar (Widened) */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 bg-slate-200/70 rounded-2xl border border-slate-200/90 shadow-2xs max-w-5xl lg:max-w-6xl w-full justify-between gap-1.5 overflow-x-auto">
              {roleSolutions.map((role) => {
                const RoleIcon = role.icon;
                const isActive = activeRoleTab === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRoleTab(role.id)}
                    className={`flex-1 py-3.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-[#003629] shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <RoleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{role.role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Showcase Card for Active Tab */}
          <div className="bg-white p-7 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
                <CurrentRoleIcon className="w-3.5 h-3.5" />
                <span>{currentRole.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 leading-tight">
                {currentRole.tagline}
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {currentRole.description}
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800">The Problem: </span>
                  <span className="text-slate-500">{currentRole.painPoint}</span>
                </div>
                <div>
                  <span className="font-bold text-[#006C4B]">WorkSphere Solution: </span>
                  <span className="text-slate-700">{currentRole.solution}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {currentRole.keyFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <div className="space-y-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Measured Impact</span>
                <div className="text-3xl sm:text-4xl font-display font-extrabold text-[#003629]">
                  {currentRole.metrics}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Ready Template</span>
                  <span className="text-emerald-600">Pre-configured</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Instant setup with pre-populated custom views, rate presets, and workflow rules.
                </p>
                <Link
                  to="/register"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#003629] hover:bg-[#1B4D3E] text-white text-xs font-bold shadow-xs transition-all"
                >
                  <span>Deploy This Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64F9BC]" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. The Consolidated Stack (Redesigned Linear-Style Architecture Grid) */}
      <section className="py-14 md:py-20 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
              The Consolidated Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
              One unified platform. <br className="hidden sm:inline" />
              Four replaced subscriptions.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Stop juggling siloed point-solutions and brittle webhook integrations. WorkSphere replaces fragmented subscriptions and context-switching with a single synchronized workspace.
            </p>
          </div>

          {/* 4-Card Comparison Architecture Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Jira replacement */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B] transition-transform group-hover:scale-105">
                    <Kanban className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60 line-through">
                    Jira ($15/mo)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#006C4B]">
                    Agile Execution
                  </span>
                  <h3 className="text-lg font-display font-bold text-slate-900">
                    Sprint Boards & Velocity
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Interactive sprint backlogs, story point poker, and automated burndown tracking without slow, bloated ticket configuration.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero complex plugin setups</span>
              </div>
            </div>

            {/* Card 2: Asana replacement */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B] transition-transform group-hover:scale-105">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60 line-through">
                    Asana ($25/mo)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#006C4B]">
                    Timeline Governance
                  </span>
                  <h3 className="text-lg font-display font-bold text-slate-900">
                    Interactive Gantt Charts
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Predecessor-successor dependency links, critical path slack detection, and milestone approvals synced in real time.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Real-time critical path sync</span>
              </div>
            </div>

            {/* Card 3: Toggl & Harvest replacement */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B] transition-transform group-hover:scale-105">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60 line-through">
                    Toggl ($12/mo)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#006C4B]">
                    Time Tracking
                  </span>
                  <h3 className="text-lg font-display font-bold text-slate-900">
                    Active Task Timers
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  1-click timers inside assigned cards, billable vs non-billable splits, and automated weekly timesheet generation.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>No manual timesheet pasting</span>
              </div>
            </div>

            {/* Card 4: Spreadsheets replacement */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#006C4B] transition-transform group-hover:scale-105">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60 line-through">
                    Excel (Manual)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#006C4B]">
                    Financial Control
                  </span>
                  <h3 className="text-lg font-display font-bold text-slate-900">
                    Budget Margin Defense
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Automated labor rate calculations, proactive 80% budget alerts, and 1-click itemized invoice exports.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Automated margin calculation</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Frictionless Launch (Redesigned Stepped Roadmap Flow) */}
      <section className="py-14 md:py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
              Frictionless Launch
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
              From zero to execution in 3 minutes.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              No sales conversations, no multi-day procurement delays, and zero credit card requirements.
            </p>
          </div>

          {/* Stepped Process Cards with Visual Mockups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006C4B] font-display font-extrabold flex items-center justify-center text-sm shadow-2xs">
                    01
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    &lt; 60 seconds
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold text-slate-900">
                  Claim Branded Subdomain
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Choose your organization’s private namespace with schema-level database isolation and custom workspace branding.
                </p>

                {/* Simulated Artifact */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-700">
                  <span className="text-slate-900 font-bold">your-org<span className="text-slate-400">.worksphere.app</span></span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-sans font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Isolated
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Self-service tenant provisioning with instant DNS routing.
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006C4B] font-display font-extrabold flex items-center justify-center text-sm shadow-2xs">
                    02
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    Instant Switch
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold text-slate-900">
                  Select Delivery Preset
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Start with Agile Scrum, deterministic Waterfall Gantt, or an executive Hybrid model. Switch perspectives anytime.
                </p>

                {/* Simulated Artifact */}
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-1 text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-white font-bold text-[#003629] shadow-2xs border border-slate-200/60">
                    Agile
                  </span>
                  <span className="px-2 py-1 text-slate-500 font-medium">Waterfall</span>
                  <span className="px-2 py-1 text-slate-500 font-medium">Hybrid</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Data automatically synchronizes across boards, timelines & lists.
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006C4B] font-display font-extrabold flex items-center justify-center text-sm shadow-2xs">
                    03
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006C4B] border border-emerald-200">
                    Ready to Ship
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold text-slate-900">
                  Invite Squad & Deliver
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Add team members with 5-tier access control. Start tracking time, managing budgets, and executing with total clarity.
                </p>

                {/* Simulated Artifact */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800">5-Tier RBAC Access</span>
                  <span className="text-xs font-bold text-emerald-600">Client Portal On</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Secure external collaboration with zero risk to internal data.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. Frequently Asked Questions Accordion */}
      <section className="py-16 md:py-24 pb-20 md:pb-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#006C4B]">
              Quick Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Common questions about our specialized solutions, role tailoring, and external client portals.
            </p>
          </div>

          <div className="space-y-3">
            {servicesFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
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
        </div>
      </section>
    </MarketingLayout>
  );
};

export default ServicesPage;
