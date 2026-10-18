import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  Clock,
  Calendar,
  ArrowLeft,
  Share2,
  Check,
  Tag,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Loader2,
  List,
  Sparkles,
  Eye,
  Heart,
} from 'lucide-react';
import {
  fetchPostBySlug,
  fetchPublishedPosts,
  clapPost,
  BlogPost,
  getAuthorDetails,
} from '../../api/blog';
import { STATIC_BLOG_POSTS } from '../../api/blogSeedData';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import BlogConversionCta from '../../components/marketing/BlogConversionCta';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [claps, setClaps] = useState<number>(0);
  const [hasClapped, setHasClapped] = useState<boolean>(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize claps from post data
  useEffect(() => {
    if (post) {
      setClaps(post.clapsCount || 0);
    }
  }, [post]);

  const handleClap = async () => {
    if (!slug) return;
    setClaps((prev) => prev + 1);
    setHasClapped(true);
    try {
      await clapPost(slug);
    } catch {
      // Optimistic state remains smooth
    }
  };

  // Sync window scroll to reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = (window.scrollY / scrollHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch article data
  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    const loadArticle = async () => {
      try {
        setIsLoading(true);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
          const data = await fetchPostBySlug(slug);
          if (!isMounted) return;
          if (data && data.title) {
            // Seamlessly redirect to canonical slug if accessed via an older slug from slugHistory
            if (
              (data as any).redirectedFrom &&
              (data as any).canonicalSlug &&
              (data as any).canonicalSlug !== slug
            ) {
              navigate(`/blog/${(data as any).canonicalSlug}`, { replace: true });
            }
            setPost(data);
          } else {
            throw new Error('Empty post data');
          }
        } catch (apiErr) {
          // Fall back gracefully to static seed data if API is offline or not yet seeded
          const fallback = STATIC_BLOG_POSTS.find((p) => p.slug === slug);
          if (fallback) {
            if (!isMounted) return;
            setPost(fallback);
          } else {
            throw apiErr;
          }
        }

        // Fetch related posts from same category
        try {
          const relatedRes = await fetchPublishedPosts({ limit: 4 });
          if (isMounted && relatedRes?.data) {
            setRelatedPosts(relatedRes.data.filter((p) => p.slug !== slug).slice(0, 2));
          }
        } catch {
          // Fall back to static related posts
          if (isMounted) {
            setRelatedPosts(STATIC_BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2));
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load blog post:', err);
        const fallback = STATIC_BLOG_POSTS.find((p) => p.slug === slug);
        if (fallback) {
          setPost(fallback);
          setRelatedPosts(STATIC_BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2));
        } else {
          setError(err.response?.data?.error?.message || 'Article could not be found.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadArticle();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Dynamic Document Title
  useEffect(() => {
    if (post?.title) {
      const originalTitle = document.title;
      document.title = `${post.title} | WorkSphere Engineering Dispatches`;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [post?.title]);

  // Inject Google Rich Results JSON-LD Structured Data
  useEffect(() => {
    if (!post) return;
    const authorDetails = getAuthorDetails(post);
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: post.title,
      description: post.excerpt,
      image: post.coverImageUrl || 'https://worksphere.io/og-image.png',
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt || post.publishedAt || post.createdAt,
      author: {
        '@type': 'Person',
        name: authorDetails.name,
        jobTitle: authorDetails.role,
      },
      publisher: {
        '@type': 'Organization',
        name: 'WorkSphere',
        url: 'https://worksphere.io',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [post]);

  // Process HTML content: sanitize and inject anchor IDs for Table of Contents
  const { processedContent, tocItems } = useMemo(() => {
    if (!post?.content) return { processedContent: '', tocItems: [] };
    const clean = sanitizeHtml(post.content);

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return { processedContent: clean, tocItems: [] };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(clean, 'text/html');
      const headings = doc.querySelectorAll('h2, h3');
      const items: TocItem[] = [];

      headings.forEach((el, index) => {
        const text = el.textContent?.trim() || '';
        if (!text) return;
        const anchorId =
          text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[\s_]+/g, '-') || `section-${index}`;

        el.id = anchorId;
        items.push({
          id: anchorId,
          text,
          level: el.tagName.toLowerCase() === 'h2' ? 2 : 3,
        });
      });

      return {
        processedContent: doc.body.innerHTML,
        tocItems: items,
      };
    } catch {
      return { processedContent: clean, tocItems: [] };
    }
  }, [post?.content]);

  // Code Block Copy Button Injection
  useEffect(() => {
    if (!contentRef.current) return;
    const preBlocks = contentRef.current.querySelectorAll('pre');

    preBlocks.forEach((pre) => {
      if (pre.querySelector('.code-copy-btn')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy-btn';
      btn.setAttribute('aria-label', 'Copy code snippet');
      btn.innerHTML = `
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Copy</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = pre.querySelector('code');
        const textToCopy = (code || pre).textContent || '';
        if (navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy);
          btn.classList.add('copied');
          btn.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span class="text-emerald-400 font-semibold">Copied!</span>
          `;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Copy</span>
            `;
          }, 2000);
        }
      });

      pre.appendChild(btn);
    });
  }, [processedContent]);

  // Active Heading Intersection Observer for TOC Spy
  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -60% 0%', threshold: 0 }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveHeadingId(id);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      post?.title || 'WorkSphere Engineering Dispatch'
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.href
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recent';
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

  const getInitials = (name?: string): string => {
    if (!name || typeof name !== 'string') return 'WS';
    const clean = name.trim();
    if (!clean) return 'WS';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'WS';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase() || 'WS';
  };

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="bg-[#FAFBF9] min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
          <Loader2 className="w-8 h-8 text-[#006C4B] animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Retrieving article dispatch...</p>
        </div>
      </MarketingLayout>
    );
  }

  if (error || !post) {
    return (
      <MarketingLayout>
        <div className="bg-[#FAFBF9] min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Article Not Found</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            The article you're seeking may have been moved, renamed, or is currently unpublished.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#003629] text-white text-xs font-bold hover:bg-[#1B4D3E] transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles &amp; Insights
          </Link>
        </div>
      </MarketingLayout>
    );
  }

  const author = getAuthorDetails(post);
  const readMinutes = post.readTimeMinutes || (post as any).readTime || 5;
  const categoryName =
    typeof post.category === 'object' && post.category
      ? (post.category as any).name || 'Engineering & Architecture'
      : post.category || 'Engineering & Architecture';

  return (
    <MarketingLayout>
      {/* Scroll Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-[#006C4B] z-50 transition-all duration-75 ease-out shadow-xs pointer-events-none"
        style={{ width: `${readingProgress}%` }}
      />

      <div className="bg-[#FAFBF9] min-h-screen">
        {/* Progress / Breadcrumb Bar */}
        <div className="border-b border-slate-200/80 bg-white sticky top-16 z-20 backdrop-blur-md bg-white/90">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006C4B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Articles</span>
            </Link>

            {/* Social Share Strip */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={shareOnTwitter}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 transition-colors cursor-pointer"
                title="Share on X / Twitter"
              >
                <span>X / Twitter</span>
              </button>

              <button
                type="button"
                onClick={shareOnLinkedIn}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 transition-colors cursor-pointer"
                title="Share on LinkedIn"
              >
                <span>LinkedIn</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Article Header */}
        <header className="pt-10 sm:pt-14 pb-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-bold px-3 py-1 rounded-full bg-emerald-50 text-[#006C4B] border border-emerald-200/80">
              {categoryName}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {typeof readMinutes === 'number' ? `${readMinutes} min read` : readMinutes}
            </span>
            {typeof post.viewsCount === 'number' && post.viewsCount > 0 && (
              <>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-500 flex items-center gap-1 font-medium">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {post.viewsCount} {post.viewsCount === 1 ? 'read' : 'reads'}
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.18]">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {post.excerpt}
          </p>

          {/* Author Strip */}
          <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#003629] text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-emerald-200">
                {getInitials(author.name)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{author.name}</div>
                <div className="text-xs text-slate-500">{author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-[11px] font-semibold text-[#006C4B] border border-emerald-200/60">
                <BookOpen className="w-3 h-3 text-[#006C4B]" />
                <span>Verified Dispatch</span>
              </div>
            </div>
          </div>

          {/* Optional Cover Image */}
          {post.coverImageUrl && (
            <div className="pt-4">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-72 sm:h-96 object-cover rounded-2xl border border-slate-200 shadow-sm"
              />
            </div>
          )}
        </header>

        {/* Article Body with Table of Contents Grid */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Article Content Column */}
            <div className={`${tocItems.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8`}>
              <div className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl border border-slate-200/90 shadow-2xs">
                {processedContent ? (
                  <div
                    ref={contentRef}
                    className="prose-blog max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
                ) : (
                  <p className="text-slate-500 italic">No content available for this post.</p>
                )}

                {/* Article Reactions & Tags Strip */}
                <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {post.tags && post.tags.length > 0 ? (
                      <>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                          <Tag className="w-3.5 h-3.5" />
                          Topics:
                        </span>
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">WorkSphere Technical Publication</span>
                    )}
                  </div>

                  {/* Interactive Clap Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleClap}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        hasClapped
                          ? 'bg-emerald-600 text-white shadow-emerald-600/25 scale-105'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-[#006C4B] border border-emerald-200/80 hover:scale-102'
                      }`}
                      title="Applaud this technical article"
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform ${
                          hasClapped ? 'fill-white' : 'text-emerald-700'
                        }`}
                      />
                      <span>
                        {claps} {claps === 1 ? 'Clap' : 'Claps'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Conversion CTA Component */}
              <BlogConversionCta />

              {/* Author Bio Box */}
              <div className="bg-gradient-to-br from-slate-900 to-[#00281F] text-white p-7 sm:p-8 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    About the Author
                  </span>
                  <h3 className="text-lg font-bold text-white">{author.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {author.name} serves as {author.role} at WorkSphere, focusing on high-density multi-tenant system design, agile workflows, and sub-50ms distributed state synchronization.
                  </p>
                </div>
                <Link
                  to="/about"
                  className="shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all"
                >
                  Learn About Team
                </Link>
              </div>
            </div>

            {/* Sticky Table of Contents Sidebar */}
            {tocItems.length > 0 && (
              <aside className="hidden lg:block lg:col-span-4 sticky top-32 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <List className="w-4 h-4 text-emerald-600" />
                    <span>Table of Contents</span>
                  </div>

                  <nav className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                    {tocItems.map((item) => {
                      const isActive = activeHeadingId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => scrollToHeading(item.id)}
                          className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs leading-snug transition-colors cursor-pointer block truncate ${
                            item.level === 3 ? 'pl-5 text-[11px]' : 'font-medium'
                          } ${
                            isActive
                              ? 'bg-emerald-50 text-[#006C4B] font-bold border-l-2 border-[#006C4B]'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                          title={item.text}
                        >
                          {item.text}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Compact Trial Box in TOC Sidebar */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#006C4B]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try WorkSphere</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Build agile Kanban boards with sub-50ms real-time state sync.
                  </p>
                  <Link
                    to="/register"
                    className="block text-center w-full py-1.5 rounded-lg bg-[#003629] hover:bg-[#1B4D3E] text-white text-[11px] font-bold transition-all shadow-xs"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </aside>
            )}

          </div>

          {/* Related Articles Strip */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">
                  Related Engineering Dispatches
                </h3>
                <Link
                  to="/blog"
                  className="text-xs font-bold text-[#006C4B] hover:text-[#003629] flex items-center gap-1 transition-colors"
                >
                  View all articles
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((rel) => {
                  const relAuthor = getAuthorDetails(rel);
                  const relRead = rel.readTimeMinutes || (rel as any).readTime || 5;
                  const relCategory =
                    typeof rel.category === 'object' && rel.category
                      ? (rel.category as any).name || 'Engineering'
                      : rel.category || 'Engineering';
                  return (
                    <Link
                      key={rel.postId || rel.slug}
                      to={`/blog/${rel.slug}`}
                      className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#006C4B] border border-emerald-200/70">
                          {relCategory}
                        </span>
                        <h4 className="text-base font-bold font-display text-slate-900 group-hover:text-[#006C4B] transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                          {rel.excerpt}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>{relAuthor.name}</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {typeof relRead === 'number' ? `${relRead} min` : relRead}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </MarketingLayout>
  );
};

export default BlogPostPage;
