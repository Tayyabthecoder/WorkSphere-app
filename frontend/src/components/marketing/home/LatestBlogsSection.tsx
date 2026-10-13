import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, ArrowUpRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
}

const latestPosts: BlogPost[] = [
  {
    id: 'hybrid-project-management',
    title: 'Why Hybrid Project Management is Replacing Dogmatic Scrum in 2026',
    excerpt: 'How modern tech companies balance executive milestone commitments with autonomous engineering two-week sprint velocity.',
    category: 'Methodology',
    readTime: '6 min read',
    date: 'Oct 8, 2026',
    author: 'Alex Chen',
    authorRole: 'Senior PM'
  },
  {
    id: 'saas-tool-fragmentation',
    title: 'The Hidden Cost of SaaS Tool Fragmentation: A Case Study',
    excerpt: 'Calculating the real productivity tax and financial overhead of managing disconnected apps for tasks, timesheets, and budgets.',
    category: 'Productivity',
    readTime: '4 min read',
    date: 'Oct 3, 2026',
    author: 'Carlos Mendez',
    authorRole: 'Agency Founder'
  },
  {
    id: 'multi-tenant-architecture',
    title: 'Architecting Logical Multi-Tenant SaaS with MERN and TypeScript',
    excerpt: 'A deep dive into schema-level tenant data isolation, JWT refresh rotations, and RBAC route protection in WorkSphere.',
    category: 'Engineering',
    readTime: '8 min read',
    date: 'Sep 27, 2026',
    author: 'Core Platform Team',
    authorRole: 'Architecture'
  }
];

export const LatestBlogsSection: React.FC = () => {
  return (
    <section className="py-14 md:py-18 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        
        {/* Section Header (Centered) */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
            Latest Articles & Insights
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
            Thinking in systems & execution.
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto">
            Perspectives on modern project delivery, engineering scalability, and operational clarity.
          </p>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latestPosts.map((post) => (
            <Link
              key={post.id}
              to="/blog"
              className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-6 group"
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
                  <div className="text-[11px] text-slate-400">{post.date}</div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#003629] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Centered Link */}
        <div className="text-center pt-2">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#006C4B] hover:text-[#003629] group transition-colors"
          >
            <span>View all articles</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default LatestBlogsSection;
