import React, { useState, useMemo } from 'react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  Clock,
  ArrowUpRight,
  Search,
  BookOpen,
  X,
  ChevronDown
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const blogFaqs: FaqItem[] = [
  {
    question: 'How frequently are new engineering and architecture articles published?',
    answer: 'Our engineering and product teams publish deep-dives bi-weekly, covering real-world patterns in distributed state, agile delivery methodologies, and scalable multi-tenant architecture.'
  },
  {
    question: 'Are the architectural solutions described in the articles implemented in WorkSphere?',
    answer: 'Yes. Every engineering dispatch—from our sub-50ms WebSocket synchronization to our tenant schema isolation patterns—reflects production code and architecture deployed directly within WorkSphere.'
  },
  {
    question: 'Can community members submit guest articles or engineering case studies?',
    answer: 'We welcome technical contributions and production case studies from engineering leads and agile teams. Reach out to our editorial team via our contact page or community Discord.'
  },
  {
    question: 'Is there an RSS feed or email digest available?',
    answer: 'Yes. You can subscribe to our RSS feed or connect via our developer community to receive immediate notifications when new technical deep-dives and release notes are posted.'
  }
];

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  featured?: boolean;
  tags?: string[];
}

const categories = [
  'All Articles',
  'Engineering & Architecture',
  'Methodology & Agile',
  'Agency Operations',
  'Product Releases'
];

const blogPosts: BlogPost[] = [
  {
    id: 'post-0',
    slug: 'architecting-sub-50ms-multi-tenant-state-mern-websockets',
    title: 'Architecting Sub-50ms Multi-Tenant State with MERN and Real-Time WebSockets',
    excerpt: 'How WorkSphere eliminates cross-tenant data bleed while streaming instant card drag-and-drops, active sprint timers, and task dependencies to peer screens in milliseconds.',
    category: 'Engineering & Architecture',
    readTime: '8 min read',
    date: 'Oct 11, 2026',
    author: 'Elena Rostova',
    authorRole: 'VP of Engineering',
    tags: ['WebSockets', 'MERN Stack', 'Multi-Tenancy']
  },
  {
    id: 'post-1',
    slug: 'why-schema-level-isolation-beats-database-per-tenant',
    title: 'Why Schema-Level Isolation Beats Database-Per-Tenant for Modern SaaS Scale',
    excerpt: 'An in-depth analysis of logical tenant partitioning, connection pool overhead, and multi-region replica routing for 10,000+ organizations.',
    category: 'Engineering & Architecture',
    readTime: '7 min read',
    date: 'Oct 9, 2026',
    author: 'Marcus Thorne',
    authorRole: 'Principal Architect',
    tags: ['Database', 'Architecture', 'Security']
  },
  {
    id: 'post-2',
    slug: 'why-hybrid-project-management-is-replacing-dogmatic-scrum',
    title: 'Why Hybrid Project Management is Replacing Dogmatic Scrum in 2026',
    excerpt: 'Modern engineering squads are ditching rigid ceremony rituals in favor of milestone-anchored sprint cadences and continuous Kanban flows.',
    category: 'Methodology & Agile',
    readTime: '6 min read',
    date: 'Oct 7, 2026',
    author: 'Sarah Jenkins',
    authorRole: 'Head of Product',
    tags: ['Agile', 'Scrum', 'Kanban']
  },
  {
    id: 'post-3',
    slug: 'hidden-cost-of-saas-tool-fragmentation-agency-audit',
    title: 'The Hidden Cost of SaaS Tool Fragmentation: A 50-Agency Audit',
    excerpt: 'We audited 50 digital agencies and discovered teams lose an average of $43.50 per seat and 4.2 hours a week jumping between disparate tools.',
    category: 'Agency Operations',
    readTime: '5 min read',
    date: 'Oct 4, 2026',
    author: 'Maya Patel',
    authorRole: 'Customer Operations',
    tags: ['SaaS ROI', 'Productivity', 'Finance']
  },
  {
    id: 'post-4',
    slug: 'zero-lag-kanban-optimizing-compound-indexes-mongodb',
    title: 'Zero-Lag Kanban: Optimizing Compound Indexes for 50,000+ Active Tasks',
    excerpt: 'Deep dive into MongoDB query plan analyzers, partial index clustering, and state delta caching for fluid board drag-and-drops.',
    category: 'Engineering & Architecture',
    readTime: '6 min read',
    date: 'Sep 29, 2026',
    author: 'David Chen',
    authorRole: 'Founder & CEO',
    tags: ['Performance', 'MongoDB', 'UI Latency']
  },
  {
    id: 'post-5',
    slug: 'stop-leaking-billable-hours-live-timers-vs-timesheets',
    title: 'Stop Leaking Billable Hours: Moving from Retrospective Timesheets to Live Timers',
    excerpt: 'Retrospective Friday guesswork causes up to 18% of client project revenue leakage. Here is how modern teams capture real billables automatically.',
    category: 'Agency Operations',
    readTime: '4 min read',
    date: 'Sep 24, 2026',
    author: 'Carlos Mendez',
    authorRole: 'Agency Founder',
    tags: ['Timesheets', 'Budgets', 'Billing']
  },
  {
    id: 'post-6',
    slug: 'worksphere-release-interactive-gantt-timelines-client-portals',
    title: 'WorkSphere 2.4 Release: Interactive Gantt Timelines & Client Portals',
    excerpt: 'Introducing two-way milestone dependency snapping, critical path highlighting, and zero-seat-cost external client access permissions.',
    category: 'Product Releases',
    readTime: '3 min read',
    date: 'Sep 18, 2026',
    author: 'Sarah Jenkins',
    authorRole: 'Head of Product',
    tags: ['Product Update', 'Gantt', 'Portals']
  }
];

export const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Filtered posts calculation
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All Articles' || post.category === selectedCategory;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.authorRole.toLowerCase().includes(query) ||
        (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <MarketingLayout>
      <div className="bg-[#FAFBF9]">
        
        {/* Compact Editorial Header & Articles Feed */}
        <section className="pt-10 sm:pt-14 pb-12 md:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          
          {/* Top Bar: Title & Search in a sleek responsive layout */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006C4B]">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>WorkSphere Dispatch</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
                Articles & Insights
              </h1>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl font-normal leading-relaxed">
                Perspectives on high-velocity project execution, modern software architecture, and agile craft.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80 relative shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#006C4B] shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#003629] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto space-y-4 shadow-2xs">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">No articles found</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                We couldn't find any articles matching "{searchQuery}" in {selectedCategory}. Try resetting your search filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Articles');
                }}
                className="px-5 py-2 rounded-full bg-[#003629] text-white text-xs font-bold hover:bg-[#1B4D3E] transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-6 group cursor-pointer"
                >
                  <div className="space-y-4">
                    {/* Meta Header */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006C4B] border border-emerald-200/70">
                        {post.category}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTime}
                      </span>
                    </div>

                    {/* Article Title */}
                    <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 group-hover:text-[#006C4B] transition-colors leading-snug">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Author & Read prompt */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{post.author}</div>
                      <div className="text-[11px] text-slate-400">{post.authorRole} · {post.date}</div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#003629] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* Frequently Asked Questions Accordion */}
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
                Common questions about our technical publication, engineering dispatches, and guest contributions.
              </p>
            </div>

            <div className="space-y-3">
              {blogFaqs.map((faq, idx) => {
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

export default BlogPage;
