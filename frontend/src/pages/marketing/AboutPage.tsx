import React, { useState } from 'react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  Layers,
  ShieldCheck,
  Target,
  Sparkles,
  CheckCircle2,
  Zap,
  ArrowRight,
  ArrowLeft,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Globe,
  Lock,
  Clock,
  BarChart3,
  Database,
  Users,
  Cpu,
  GitBranch,
  Building2,
  MapPin,
  ChevronDown
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const aboutFaqs: FaqItem[] = [
  {
    question: 'What motivated the creation of WorkSphere?',
    answer: 'We built WorkSphere out of frustration with legacy, bloated project management platforms that force teams into dogmatic workflows and charge excessive enterprise penalties for multi-tenancy and real-time state.'
  },
  {
    question: 'How does WorkSphere guarantee tenant data isolation?',
    answer: 'Every tenant is logically partitioned at the database schema level and isolated via unique subdomain routing. We enforce strict organizational boundary checks on every WebSocket event and API endpoint.'
  },
  {
    question: 'Is WorkSphere fully self-hostable in private VPC environments?',
    answer: 'Yes. In addition to our managed cloud SaaS, WorkSphere provides production-tested Docker Compose manifests and Kubernetes Helm charts for organizations requiring on-premise or private cloud deployment.'
  },
  {
    question: "What is WorkSphere's stance on user telemetry and data privacy?",
    answer: 'We believe your project data is strictly yours. WorkSphere never sells customer workspace telemetry, indexes confidential task descriptions for public AI models, or injects third-party tracking scripts into customer workspaces.'
  }
];

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  badgeColor?: string;
  badgeBg?: string;
  bannerGradient: string;
  avatarBg: string;
  location: string;
  bio: string;
  image?: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    email?: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    name: 'David Chen',
    role: 'Founder & CEO',
    initials: 'DC',
    bannerGradient: 'linear-gradient(135deg, #1e293b 0%, #006C4B 100%)',
    avatarBg: 'linear-gradient(135deg, #003629 0%, #006C4B 100%)',
    badgeColor: '#006C4B',
    badgeBg: 'rgba(0, 108, 75, 0.1)',
    location: 'San Francisco, CA',
    bio: 'Former enterprise PM lead who experienced the fragmentation crisis across 60+ accounts. Obsessed with software simplicity and unified execution.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    socials: {
      twitter: 'https://x.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      email: 'mailto:david@worksphere.io'
    }
  },
  {
    name: 'Elena Rostova',
    role: 'Co-Founder & CTO',
    initials: 'ER',
    bannerGradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    avatarBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    badgeColor: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.1)',
    location: 'London, UK',
    bio: 'Systems architect specialized in multi-tenant database isolation, WebSocket clustering, and sub-50ms API responsiveness at scale.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    socials: {
      twitter: 'https://x.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      email: 'mailto:elena@worksphere.io'
    }
  },
  {
    name: 'Marcus Thorne',
    role: 'Head of Product & Design',
    initials: 'MT',
    bannerGradient: 'linear-gradient(135deg, #047857 0%, #34d399 100%)',
    avatarBg: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    badgeColor: '#047857',
    badgeBg: 'rgba(4, 120, 87, 0.1)',
    location: 'Berlin, DE',
    bio: 'Crafts the sensory feel of WorkSphere. Believes complex project governance should feel as weightless and responsive as consumer craft software.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    socials: {
      twitter: 'https://x.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      email: 'mailto:marcus@worksphere.io'
    }
  },
  {
    name: 'Sarah Jenkins',
    role: 'Head of Security & Infra',
    initials: 'SJ',
    bannerGradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
    avatarBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    badgeColor: '#0284c7',
    badgeBg: 'rgba(2, 132, 199, 0.1)',
    location: 'New York, NY',
    bio: 'Security architect leading WorkSphere’s 99.99% uptime SLA, subdomain isolation boundaries, and AES-256 encrypted boundary defense protocols.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    socials: {
      twitter: 'https://x.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      email: 'mailto:sarah@worksphere.io'
    }
  },
  {
    name: 'Maya Patel',
    role: 'Lead Frontend Architect',
    initials: 'MP',
    bannerGradient: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
    avatarBg: 'linear-gradient(135deg, #10b981 0%, #006C4B 100%)',
    badgeColor: '#0f766e',
    badgeBg: 'rgba(15, 118, 110, 0.1)',
    location: 'Toronto, CA',
    bio: 'Builds responsive UI interactions, drag-and-drop Gantt timeline engines, and fluid Kanban workflows that power high-velocity squads.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    socials: {
      twitter: 'https://x.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      email: 'mailto:maya@worksphere.io'
    }
  }
];

const principles = [
  {
    icon: Sparkles,
    badge: 'Craft Over Bloat',
    title: 'Zero unnecessary complexity',
    description: 'We reject 200-field configuration forms and sluggish enterprise sludge. Every button, interaction, and keyboard shortcut is engineered for maximum execution velocity.'
  },
  {
    icon: GitBranch,
    badge: 'Methodology Freedom',
    title: 'No dogmatic workflow constraints',
    description: 'Software should adapt to your team, not the other way around. Switch between Scrum sprint cycles, Waterfall Gantt dependencies, and Kanban pipelines on demand.'
  },
  {
    icon: ShieldCheck,
    badge: 'Data Sovereignty',
    title: 'Isolated schemas by default',
    description: 'Every organization receives dedicated subdomain routing and schema-level data separation. Your internal data and client financials are strictly isolated.'
  },
  {
    icon: Users,
    badge: 'Radical Transparency',
    title: 'Kill opaque status summaries',
    description: 'Direct, permission-governed client portals eliminate the constant tax of drafting weekly update emails and manually exporting spreadsheet screenshots.'
  }
];

const scaleMetrics = [
  {
    value: '99.99%',
    label: 'Uptime Reliability SLA',
    description: 'Redundant multi-region infrastructure with automated cluster failover.'
  },
  {
    value: '< 45ms',
    label: 'Average Query Latency',
    description: 'Sub-second search indexing and snappy real-time WebSocket updates.'
  },
  {
    value: '100%',
    label: 'Tenant Isolation',
    description: 'Strict schema-level separation with custom subdomain verification.'
  },
  {
    value: '3 Mins',
    label: 'Zero to First Sprint',
    description: 'Instant workspace provisioning without lengthy sales onboarding.'
  }
];

export const AboutPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isHovered, setIsHovered] = React.useState<boolean>(false);
  const totalCards = teamMembers.length;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const nextSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  }, [totalCards]);

  const prevSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  }, [totalCards]);

  React.useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  const getCardPosClass = (idx: number) => {
    let diff = (idx - currentIndex + totalCards) % totalCards;
    if (diff > Math.floor(totalCards / 2)) {
      diff -= totalCards;
    }
    if (diff === 0) return 'pos-center';
    if (diff === -1) return 'pos-left';
    if (diff === 1) return 'pos-right';
    if (diff <= -2) return 'pos-far-left';
    return 'pos-far-right';
  };

  return (
    <MarketingLayout>
      <div className="bg-[#FAFBF9] min-h-screen">
        
        {/* 1. Purpose & Vision Hero */}
        <section className="pt-16 pb-14 md:pt-24 md:pb-18 border-b border-slate-200/80 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
              <Target className="w-3.5 h-3.5" />
              <span>Our Mission & Craft</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.12]">
              Democratizing enterprise-grade <br className="hidden sm:block" />
              <span className="text-[#006C4B]">project execution.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We engineered WorkSphere to eliminate the software fragmentation tax. High-velocity teams shouldn't have to stitch together four costly subscriptions just to plan sprints, track billables, and report to clients.
            </p>

            {/* Trust Pill Highlights */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Tenant Isolation
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Sub-50ms API Response
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                No Credit Card Required
              </span>
            </div>

          </div>
        </section>

        {/* 2. The Origin Story ("The Tool Fragmentation Crisis") */}
        <section className="py-14 md:py-20 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              <div className="lg:col-span-6 space-y-5">
                <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
                  The Origin Story
                </p>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
                  Why we engineered WorkSphere
                </h2>
                <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                  <p>
                    Every project lead and agency director knows the feeling: your software engineers live in complicated issue trackers, your client managers track billable hours in disconnected timer widgets, your executives ask for Gantt charts in presentation decks, and finance reconciles profitability in 15 fragile spreadsheets.
                  </p>
                  <p>
                    The result? <strong>Context switching, lost billable margins, and constant status meetings.</strong>
                  </p>
                  <p>
                    Instead of paying $60+ per user every month across four siloed tools, we built WorkSphere from the ground up as a unified work operating system — combining Agile sprint boards, interactive Gantt charts, live timesheets, and dedicated client portals into one clean, responsive workspace.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>The Legacy Tax vs. The WorkSphere Engine</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-700">The Fragmented Stack</span>
                      <span className="text-red-600 line-through font-mono">~$72/user/mo</span>
                    </div>
                    <p className="text-slate-500">
                      Jira (Dev) + Asana (Ops) + Toggl (Time) + Harvest (Invoicing) + Excel (Margin analysis).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#003629]">The WorkSphere Unified Engine</span>
                      <span className="text-emerald-700 font-mono">Single Platform</span>
                    </div>
                    <p className="text-slate-700">
                      Unified MERN architecture with dedicated tenant routing, multi-methodology views, and real-time synchronizer.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Zero data duplication</span>
                  <span className="font-semibold text-emerald-700">100% Real-Time Parity</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. Core Operating Principles */}
        <section className="py-14 md:py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
                Operating Values
              </p>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
                Principles that guide our craft
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                We believe enterprise software should feel as fast, tactile, and effortless as consumer applications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {principles.map((principle, idx) => {
                const IconComponent = principle.icon;
                return (
                  <div
                    key={idx}
                    className="p-7 sm:p-8 rounded-3xl bg-[#FAFBF9] border border-slate-200/90 shadow-2xs hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#006C4B]">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#006C4B]">
                        {principle.badge}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-display font-bold text-slate-900">
                        {principle.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* 4. Leadership Team Section (3D Coverflow Perspective Carousel) */}
        <section className="py-14 md:py-22 border-b border-slate-200/80 bg-slate-50/50 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B] uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>Leadership Team</span>
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
                The People Behind WorkSphere
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Meet our executive and engineering leaders driving the platform's vision, architecture, and multi-tenant infrastructure.
              </p>
            </div>

            {/* 3D Coverflow Carousel Stage */}
            <div className="team-carousel-wrapper">
              <button
                onClick={prevSlide}
                className="team-nav-btn team-prev-btn cursor-pointer"
                aria-label="Previous Team Member"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={nextSlide}
                className="team-nav-btn team-next-btn cursor-pointer"
                aria-label="Next Team Member"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>

              <div
                className="team-3d-stage"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {teamMembers.map((member, idx) => {
                  const posClass = getCardPosClass(idx);
                  return (
                    <div
                      key={idx}
                      className={`team-3d-card ${posClass}`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {/* Gradient Banner */}
                      <div
                        className="team-card-banner"
                        style={{ background: member.bannerGradient }}
                      />

                      {/* Avatar Wrapper with Floating Circular Box and Status Dot */}
                      <div className="team-avatar-wrapper">
                        <div
                          className="team-avatar-box font-display"
                          style={{ background: member.avatarBg }}
                        >
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-full h-full object-cover object-top rounded-full"
                              loading="lazy"
                            />
                          ) : (
                            <span>{member.initials}</span>
                          )}
                        </div>
                        <span className="status-dot" title="Active Team Lead" />
                      </div>

                      {/* Card Interior Body */}
                      <div className="team-card-body">
                        <h3 className="team-name font-display">
                          <span>{member.name}</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 inline-block" />
                        </h3>

                        <div>
                          <span
                            className="team-role-badge"
                            style={{
                              color: member.badgeColor,
                              backgroundColor: member.badgeBg
                            }}
                          >
                            {member.role}
                          </span>
                        </div>

                        <div className="team-location">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.location}</span>
                        </div>

                        <p className="team-bio font-normal">
                          {member.bio}
                        </p>

                        <div className="team-socials">
                          {member.socials.twitter && (
                            <a
                              href={member.socials.twitter}
                              target="_blank"
                              rel="noreferrer"
                              className="team-social-btn"
                              aria-label="Twitter/X"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Twitter className="w-4 h-4" />
                            </a>
                          )}
                          {member.socials.linkedin && (
                            <a
                              href={member.socials.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="team-social-btn"
                              aria-label="LinkedIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                          {member.socials.github && (
                            <a
                              href={member.socials.github}
                              target="_blank"
                              rel="noreferrer"
                              className="team-social-btn"
                              aria-label="GitHub"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {member.socials.email && (
                            <a
                              href={member.socials.email}
                              className="team-social-btn"
                              aria-label="Email"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controls Bar with Pagination Dots */}
              <div className="team-carousel-controls">
                <div className="team-dots-wrap">
                  {teamMembers.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurrentIndex(dotIdx)}
                      className={`team-dot ${dotIdx === currentIndex ? 'active' : ''} border-0 cursor-pointer`}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 5. Scale & Reliability by the Numbers */}
        <section className="py-14 md:py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
                Scale & Trust
              </p>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
                Architected for uncompromising reliability
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Enterprise teams demand rock-solid uptime, strict data boundaries, and zero lag.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {scaleMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAFBF9] p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2 text-center sm:text-left"
                >
                  <div className="text-3xl sm:text-4xl font-display font-extrabold text-[#003629]">
                    {metric.value}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {metric.label}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 6. Architectural Philosophy (Engineering Focus) */}
        <section className="py-14 md:py-20 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Engineering Architecture</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
                  Speed isn't an afterthought. It's the primary feature.
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Most project management platforms are bogged down by decades of legacy database models. WorkSphere is built on a high-throughput MERN foundation with real-time WebSocket state, sub-second search indexing, and automated index pruning.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-700">
                      <strong>Multi-Tenant Schema Isolation:</strong> Subdomain-verified tenant boundaries eliminate the risk of cross-organization data leakage.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-700">
                      <strong>Real-Time WebSocket Sync:</strong> Card drag-and-drops, sprint status transitions, and active timers reflect on peer screens within milliseconds.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-700">
                      <strong>Granular Role-Based Access Control:</strong> Distinct permission matrices for Admins, Project Managers, Team Members, and External Clients.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
                <h3 className="text-base font-display font-bold text-slate-900">
                  WorkSphere Core System Specifications
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Architecture</span>
                    <span className="font-bold text-slate-800">MERN + WebSocket Engine</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Tenant Routing</span>
                    <span className="font-bold text-emerald-700">[subdomain].worksphere.io</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Security Standard</span>
                    <span className="font-bold text-slate-800">AES-256 at Rest & TLS 1.3</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Data Redundancy</span>
                    <span className="font-bold text-slate-800">Multi-Region Hot Replicas</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-[#006C4B] font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Zero tracking or selling of customer workspace telemetry.</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 7. Frequently Asked Questions Accordion */}
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
                Common questions about WorkSphere's mission, security architecture, and engineering principles.
              </p>
            </div>

            <div className="space-y-3">
              {aboutFaqs.map((faq, idx) => {
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
      </div>
    </MarketingLayout>
  );
};

export default AboutPage;
