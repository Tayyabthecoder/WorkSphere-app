import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  Clock,
  ArrowUpRight,
  Search,
  BookOpen,
  X,
  ChevronDown,
  Loader2,
  Calendar,
} from 'lucide-react';
import { fetchPublishedPosts, fetchBlogCategories, BlogPost, getAuthorDetails } from '../../api/blog';
import { STATIC_BLOG_POSTS } from '../../api/blogSeedData';

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

const DEFAULT_CATEGORIES = [
  'All Articles',
  'Engineering & Architecture',
  'Methodology & Agile',
  'Agency Operations',
  'Product Releases'
];

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load distinct categories once
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const catList = await fetchBlogCategories();
        if (isMounted && catList && catList.length > 0) {
          const merged = ['All Articles', ...Array.from(new Set([...catList, ...DEFAULT_CATEGORIES.slice(1)]))];
          setCategories(merged);
        }
      } catch {
        // Fall back to default categories
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch published posts whenever category or debouncedSearch changes
  useEffect(() => {
    let isMounted = true;
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        const res = await fetchPublishedPosts({
          category: selectedCategory !== 'All Articles' ? selectedCategory : undefined,
          search: debouncedSearch.trim() || undefined,
          limit: 30,
        });
        if (isMounted) {
          if (res?.data && res.data.length > 0) {
            setPosts(res.data);
          } else if (!debouncedSearch.trim() && selectedCategory === 'All Articles') {
            setPosts(STATIC_BLOG_POSTS);
          } else {
            // Filter STATIC_BLOG_POSTS locally if search/category was applied
            const filtered = STATIC_BLOG_POSTS.filter((p) => {
              const matchesCat = selectedCategory === 'All Articles' || p.category === selectedCategory;
              const q = debouncedSearch.trim().toLowerCase();
              const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
              return matchesCat && matchesQuery;
            });
            setPosts(filtered);
          }
        }
      } catch (err) {
        console.error('Failed to load published blog posts:', err);
        if (isMounted) {
          const filtered = STATIC_BLOG_POSTS.filter((p) => {
            const matchesCat = selectedCategory === 'All Articles' || p.category === selectedCategory;
            const q = debouncedSearch.trim().toLowerCase();
            const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
            return matchesCat && matchesQuery;
          });
          setPosts(filtered);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPosts();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, debouncedSearch]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Oct 2026';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <MarketingLayout>
      <div className="bg-[#FAFBF9] min-h-screen">
        
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
                Articles &amp; Insights
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

          {/* Articles Feed */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-6 animate-pulse"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-24 bg-slate-200 rounded-full" />
                      <div className="h-4 w-16 bg-slate-100 rounded" />
                    </div>
                    <div className="h-6 w-5/6 bg-slate-200 rounded" />
                    <div className="h-4 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-4/6 bg-slate-100 rounded" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                      <div className="h-3 w-32 bg-slate-100 rounded" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
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
                className="px-5 py-2 rounded-full bg-[#003629] text-white text-xs font-bold hover:bg-[#1B4D3E] transition-all cursor-pointer shadow-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const author = getAuthorDetails(post);
                const categoryName = typeof post.category === 'object' && post.category ? ((post.category as any).name || 'Engineering') : (post.category || 'Engineering');
                return (
                  <div
                    key={post.postId || post.slug}
                    onClick={() => navigate(`/blog/${post.slug}`)}
                    className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-6 group cursor-pointer"
                  >
                    <div className="space-y-4">
                      {/* Meta Header */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006C4B] border border-emerald-200/70">
                          {categoryName}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTimeMinutes || 5} min read
                        </span>
                      </div>

                      {/* Article Title */}
                      <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 group-hover:text-[#006C4B] transition-colors leading-snug">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author & Read prompt */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">
                          {author.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {author.role} · {formatDate(post.publishedAt || post.createdAt)}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#003629] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
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
