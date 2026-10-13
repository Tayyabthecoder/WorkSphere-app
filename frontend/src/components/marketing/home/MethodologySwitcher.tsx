import React, { useState } from 'react';
import { 
  Zap, 
  GitBranch, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Target, 
  Flag,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

type MethodologyType = 'agile' | 'waterfall' | 'hybrid';

interface TabConfig {
  id: MethodologyType;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  highlights: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'agile',
    label: 'Agile / Scrum',
    badge: 'High Velocity',
    icon: Zap,
    tagline: 'Empower sprint velocity, story points, and standups without Jira complexity.',
    description: 'Designed for fast-moving product and software squads. Groom your product backlog, launch 2-week iterations, and track real-time burndown analytics.',
    highlights: [
      'Story point poker & estimation tracking',
      'Customizable WIP limits & swimlanes',
      'Automated sprint velocity analytics',
      'Built-in sprint retrospective notes'
    ]
  },
  {
    id: 'waterfall',
    label: 'Waterfall & Milestones',
    badge: 'Deterministic',
    icon: GitBranch,
    tagline: 'Pinpoint dependencies, critical paths, and phase approvals with clarity.',
    description: 'Built for structured contracts, hardware, and client agency projects. Map predecessor-successor task links, lock milestone deliverables, and monitor critical path slack.',
    highlights: [
      'Interactive Gantt timeline with dependency links',
      'Phase-gated manager approvals',
      'Automated critical path slack detection',
      'Fixed-date milestone delivery tracking'
    ]
  },
  {
    id: 'hybrid',
    label: 'Hybrid Portfolio',
    badge: 'Enterprise Best Practice',
    icon: Layers,
    tagline: 'Where executive milestone commitments meet agile sprint execution.',
    description: 'The standard for modern tech enterprises. Stakeholders track high-level milestone timelines while autonomous engineering teams deliver via rapid Scrum sprints.',
    highlights: [
      'Top-down milestone to sprint mapping',
      'Real-time team capacity heatmaps',
      'Executive KPI rollups without manual slides',
      'Unified cross-departmental alignment'
    ]
  }
];

export const MethodologySwitcher: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MethodologyType>('agile');

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const IconComponent = currentTab.icon;

  return (
    <section id="methodology" className="py-14 md:py-18 bg-slate-50/70 border-y border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
            <Layers className="w-3.5 h-3.5" />
            <span>Methodology Freedom</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
            One platform. Any methodology.
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Never force your engineers into a rigid spreadsheet or your client managers into complex developer backlog tooling. WorkSphere adapts to your workflow.
          </p>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-slate-200/70 rounded-2xl border border-slate-200/90 shadow-2xs max-w-3xl lg:max-w-4xl w-full justify-between gap-1.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#003629] shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TabIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Showcase Card (Light Card Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-md">
          
          {/* Left Column: Descriptions & Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
              <IconComponent className="w-3.5 h-3.5" />
              <span>{currentTab.badge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 leading-tight">
              {currentTab.tagline}
            </h3>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {currentTab.description}
            </p>

            {/* Checkmark Highlights */}
            <div className="space-y-3 pt-2">
              {currentTab.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#006C4B] shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#006C4B] hover:underline group"
              >
                <span>Try {currentTab.label} in WorkSphere</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Column: Simulated Light UI Dashboard */}
          <div className="lg:col-span-7 bg-[#F8FAFC] rounded-2xl p-5 sm:p-6 border border-slate-200 text-slate-900 shadow-xs min-h-[380px] flex flex-col justify-between">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-slate-700">
                  {activeTab === 'agile' && 'ACTIVE SPRINT 14 • 10 DAYS REMAINING'}
                  {activeTab === 'waterfall' && 'GANTT TIMELINE • CRITICAL PATH LOCKED'}
                  {activeTab === 'hybrid' && 'ENTERPRISE ROADMAP • 3 TIED SPRINTS'}
                </span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006C4B] border border-emerald-200">
                Interactive Preview
              </span>
            </div>

            {/* Dynamic Content by Active Tab */}
            <div className="py-6">
              {activeTab === 'agile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#006C4B] border border-emerald-200">5 STORY POINTS</span>
                        <span className="text-[11px] text-slate-500 font-medium">Dev Sprint</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">Tenant Isolated JWT Refresh Logic</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Assignee: Alex Chen</span>
                        <span className="text-emerald-700 font-bold">90% Done</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">8 STORY POINTS</span>
                        <span className="text-[11px] text-slate-500 font-medium">In Review</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">Automated Sprint Retrospective Export</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Assignee: Sarah J.</span>
                        <span className="text-amber-700 font-bold">Testing</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-[#006C4B]">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Velocity Acceleration</div>
                        <div className="text-[11px] text-slate-600">42 Story Points delivered this sprint</div>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-[#006C4B] px-2.5 py-1 rounded bg-white border border-emerald-200 shadow-2xs">
                      +18% vs Avg
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'waterfall' && (
                <div className="space-y-4">
                  {/* Phase 1 */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 text-emerald-600" />
                        Phase 1: Architecture & Scope Sign-off
                      </span>
                      <span className="text-emerald-700 font-bold text-[11px]">Approved ✓</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full w-full" />
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-[#006C4B]" />
                        Phase 2: Core Platform Development
                      </span>
                      <span className="text-[#006C4B] font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">CRITICAL PATH</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#006C4B] h-2 rounded-full w-3/4" />
                    </div>
                  </div>

                  {/* Phase 3 */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 opacity-85">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Phase 3: Client UAT & Security Audit
                      </span>
                      <span className="text-slate-500 text-[11px] font-medium">Pending Phase 2</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-slate-300 h-2 rounded-full w-1/4" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hybrid' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Q4 Enterprise Client Milestone</span>
                      <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Due Nov 30</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Linked to Sprint 13, Sprint 14, and Sprint 15 backlogs
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                        <div className="text-slate-500 font-medium">Sprint 13</div>
                        <div className="text-emerald-700 font-bold mt-0.5">100% Done</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px]">
                        <div className="text-slate-600 font-medium">Sprint 14</div>
                        <div className="text-[#006C4B] font-bold mt-0.5">78% Done</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                        <div className="text-slate-400 font-medium">Sprint 15</div>
                        <div className="text-slate-500 font-bold mt-0.5">Queued</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                    <span>Executive Status: <strong className="text-slate-900">On schedule with zero schedule variance</strong></span>
                    <span className="text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">Safe</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status bar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Automatic sync enabled</span>
              <span className="text-[#006C4B] font-bold">Real-time websocket telemetry</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default MethodologySwitcher;
