import { Router, Request, Response, NextFunction } from 'express';
import { BlogPostModel, IBlogPost } from '../models/BlogPost.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { escapeRegex } from '../utils/regex.js';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Estimate reading time: ~200 words per minute. */
function calcReadTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Build a URL-safe slug from a title, appending a short unique suffix. */
function buildSlug(title: string, suffix?: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
  return suffix ? `${base}-${suffix}` : base;
}

/** Guarantee authorName and authorRole are clean strings and never objects */
function normalizePost(p: any) {
  if (!p) return p;
  const post = typeof p.toObject === 'function' ? p.toObject() : { ...p };
  let authorName = 'WorkSphere Editorial';
  let authorRole = 'Editorial Contributor';
  let authorAvatarUrl = undefined;

  if (post.author && typeof post.author === 'object') {
    if (typeof post.author.name === 'string') authorName = post.author.name;
    if (typeof post.author.role === 'string') authorRole = post.author.role;
    if (typeof post.author.avatarUrl === 'string') authorAvatarUrl = post.author.avatarUrl;
  } else if (typeof post.author === 'string' && post.author.trim()) {
    authorName = post.author.trim();
  }

  if (typeof post.authorName === 'string' && post.authorName.trim()) {
    authorName = post.authorName.trim();
  }
  if (typeof post.authorRole === 'string' && post.authorRole.trim()) {
    authorRole = post.authorRole.trim();
  }

  let category = 'Engineering & Architecture';
  if (post.category && typeof post.category === 'object') {
    category = (post.category as any).name || 'Engineering & Architecture';
  } else if (typeof post.category === 'string' && post.category.trim()) {
    category = post.category.trim();
  }

  return {
    ...post,
    category,
    authorName,
    authorRole,
    authorAvatarUrl,
    clapsCount: typeof post.clapsCount === 'number' ? post.clapsCount : 0,
    viewsCount: typeof post.viewsCount === 'number' ? post.viewsCount : 0,
  };
}

// ─── Seed Initial Posts Helper ────────────────────────────────────────────────

const INITIAL_SEED_POSTS = [
  {
    slug: 'architecting-sub-50ms-multi-tenant-state-mern-websockets',
    title: 'Architecting Sub-50ms Multi-Tenant State with MERN and Real-Time WebSockets',
    excerpt: 'How WorkSphere eliminates cross-tenant data bleed while streaming instant card drag-and-drops, active sprint timers, and task dependencies to peer screens in milliseconds.',
    category: 'Engineering & Architecture',
    tags: ['WebSockets', 'MERN Stack', 'Multi-Tenancy', 'Performance'],
    authorName: 'Elena Rostova',
    authorRole: 'VP of Engineering',
    readTimeMinutes: 8,
    publishedAt: new Date('2026-10-11T10:00:00.000Z'),
    content: `
      <h2>The Challenge: Low Latency Without Multi-Tenant Data Bleed</h2>
      <p>Modern agile squads expect instantaneous updates. When an engineer moves a story across a Kanban board or begins logging time against an active sprint task, every peer in the workspace should observe that state shift without triggering manual browser refreshes.</p>
      <p>However, running a multi-tenant SaaS introduces a non-negotiable security requirement: <strong>absolute isolation</strong>. One tenant's WebSocket channel must never receive event frames destined for another company, regardless of peak throughput.</p>
      
      <h3>1. Tenant-Scoped Room Partitioning</h3>
      <p>In WorkSphere, each connected WebSocket client negotiates an authenticated handshake verified via JWT. Once authenticated, the connection is joined exclusively to room identifiers prefixed by the validated <code>tenantId</code>:</p>
      <pre><code>// Socket connection handler with tenant isolation
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.tenantId) {
    return next(new Error('Unauthorized socket connection'));
  }
  socket.data.tenantId = decoded.tenantId;
  socket.data.userId = decoded.userId;
  next();
});

socket.on('join_board', ({ boardId }) => {
  // Enforce compound room key to prevent cross-tenant joining
  const scopedRoom = \`\${socket.data.tenantId}:board:\${boardId}\`;
  socket.join(scopedRoom);
});</code></pre>

      <h3>2. Optimistic UI with Idempotent Replay</h3>
      <p>By combining client-side optimistic UI state rollbacks with server-side monotonic change versions, frontend state transitions appear within <strong>16ms</strong> on the local screen, while peer clients synchronize in under <strong>45ms</strong> on standard broadband.</p>

      <blockquote>
        "Architectural simplicity wins over premature distributed complexity. By partitioning rooms directly on tenant IDs and leveraging Redis pub/sub backplanes, we maintain sub-50ms sync even under 100,000 concurrent updates."
      </blockquote>

      <h3>3. Monotonic Sequence Verification</h3>
      <p>Every payload transmitted across the gateway carries a progressive version number. If a client observes a sequence gap—such as when returning from sleep mode—it drops pending delta updates and issues a delta query for catch-up syncing.</p>
    `,
  },
  {
    slug: 'why-schema-level-isolation-beats-database-per-tenant',
    title: 'Why Schema-Level Isolation Beats Database-Per-Tenant for Modern SaaS Scale',
    excerpt: 'An in-depth analysis of logical tenant partitioning, connection pool overhead, and multi-region replica routing for 10,000+ organizations.',
    category: 'Engineering & Architecture',
    tags: ['Database', 'Architecture', 'Security', 'MongoDB'],
    authorName: 'Marcus Thorne',
    authorRole: 'Principal Architect',
    readTimeMinutes: 7,
    publishedAt: new Date('2026-10-09T14:30:00.000Z'),
    content: `
      <h2>The Multi-Tenancy Conundrum</h2>
      <p>When engineering high-density multi-tenant software, founders and architects routinely confront a classic fork in the road: <em>database-per-tenant</em> versus <em>schema-level logical isolation</em>.</p>
      <p>While database-per-tenant appears conceptually neat on paper, it introduces severe resource bloat at scale:</p>
      <ul>
        <li><strong>Connection Pool Exhaustion:</strong> Maintaining 10-20 open connection pool sockets across 10,000 tenant databases demands hundreds of thousands of idle connections.</li>
        <li><strong>Operational Friction:</strong> Executing schema migrations, backups, and index rebuilding across thousands of distinct databases creates operational bottlenecks.</li>
        <li><strong>Memory Overhead:</strong> Buffer pool memory gets fragmented across cold and hot tenant databases instead of pooling dynamically where workload demand is highest.</li>
      </ul>

      <h3>WorkSphere's Compound Index Pattern</h3>
      <p>By embedding <code>tenantId</code> as the leftmost prefix in compound indexes across MongoDB collections, queries benefit from targeted index scans:</p>
      <pre><code>TaskSchema.index({ tenantId: 1, projectId: 1, status: 1 });
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });</code></pre>
      <p>Every database query passes through our tenant boundary middleware, guaranteeing that queries always include the authenticated user's <code>tenantId</code>.</p>
    `,
  },
  {
    slug: 'why-hybrid-project-management-is-replacing-dogmatic-scrum',
    title: 'Why Hybrid Project Management is Replacing Dogmatic Scrum in 2026',
    excerpt: 'Modern engineering squads are ditching rigid ceremony rituals in favor of milestone-anchored sprint cadences and continuous Kanban flows.',
    category: 'Methodology & Agile',
    tags: ['Agile', 'Scrum', 'Kanban', 'Productivity'],
    authorName: 'Sarah Jenkins',
    authorRole: 'Head of Product',
    readTimeMinutes: 6,
    publishedAt: new Date('2026-10-07T09:15:00.000Z'),
    content: `
      <h2>Beyond the Dogma of Two-Week Sprints</h2>
      <p>For more than a decade, technology teams treated strict Scrum ceremonies as gospel: rigid 14-day sprint boundaries, velocity point estimates, story poker, and lengthy retrospective rituals.</p>
      <p>Yet in 2026, high-velocity engineering organizations are embracing a <strong>hybrid model</strong> that blends the best aspects of Waterfall roadmapping with Kanban continuous delivery:</p>

      <h3>Key Characteristics of Hybrid Agile</h3>
      <ol>
        <li><strong>Milestone-Anchored Delivery:</strong> High-level initiatives anchor to firm release milestones and client expectations (Gantt and critical paths).</li>
        <li><strong>Continuous Backlog Flow:</strong> Day-to-day execution flows through fluid Kanban swimlanes without artificial sprint freeze cutoffs.</li>
        <li><strong>Async Retrospectives:</strong> Teams document learnings iteratively in shared living documents rather than sitting through 2-hour synchronous retros.</li>
      </ol>
      <p>By unifying Gantt timelines with Kanban boards in WorkSphere, teams get executive predictability alongside developer autonomy.</p>
    `,
  },
  {
    slug: 'hidden-cost-of-saas-tool-fragmentation-agency-audit',
    title: 'The Hidden Cost of SaaS Tool Fragmentation: A 50-Agency Audit',
    excerpt: 'We audited 50 digital agencies and discovered teams lose an average of $43.50 per seat and 4.2 hours a week jumping between disparate tools.',
    category: 'Agency Operations',
    tags: ['SaaS ROI', 'Productivity', 'Finance', 'Agency'],
    authorName: 'Maya Patel',
    authorRole: 'Customer Operations',
    readTimeMinutes: 5,
    publishedAt: new Date('2026-10-04T11:00:00.000Z'),
    content: `
      <h2>The Tab Tax in Modern Agencies</h2>
      <p>Every digital agency owner knows the feeling: one SaaS for task tracking, another for time tracking, another for client invoicing, a fourth for document sharing, and a fifth for Gantt timelines.</p>
      <p>Our operational audit of 50 agencies revealed staggering invisible costs:</p>
      <ul>
        <li><strong>Context-Switching Overhead:</strong> Average team member loses 4.2 hours weekly re-orienting across disparate browser tabs.</li>
        <li><strong>Subscription Bloat:</strong> Average toolchain cost exceeds $120/seat/month for features that often duplicate one another.</li>
        <li><strong>Data Desynchronization:</strong> 1 in 4 client invoices contained billable hour discrepancies due to disconnected timesheets and project milestones.</li>
      </ul>
      <p>Consolidating your operational toolchain eliminates friction and provides complete financial transparency from task kickoff to client invoicing.</p>
    `,
  },
  {
    slug: 'zero-lag-kanban-optimizing-compound-indexes-mongodb',
    title: 'Zero-Lag Kanban: Optimizing Compound Indexes for 50,000+ Active Tasks',
    excerpt: 'Deep dive into MongoDB query plan analyzers, partial index clustering, and state delta caching for fluid board drag-and-drops.',
    category: 'Engineering & Architecture',
    tags: ['Performance', 'MongoDB', 'UI Latency', 'Database'],
    authorName: 'David Chen',
    authorRole: 'Founder & CEO',
    readTimeMinutes: 6,
    publishedAt: new Date('2026-09-29T16:45:00.000Z'),
    content: `
      <h2>Why Kanban Boards Get Sluggish</h2>
      <p>A Kanban board displaying 20 columns across 50,000 tasks can easily become an indexing nightmare if queries trigger full collection scans or unindexed sort phases.</p>
      <h3>Index Selectivity & Sorting Order</h3>
      <p>MongoDB query execution requires that equality matches precede range filters, which in turn precede sort operations. To achieve zero-lag column sorting:</p>
      <pre><code>TaskSchema.index({
  tenantId: 1,
  projectId: 1,
  status: 1,
  order: 1
});</code></pre>
      <p>With this index strategy in place, reordering a card within a column takes less than <strong>3ms</strong> of execution time in MongoDB, allowing smooth 60fps drag-and-drop interactions in React.</p>
    `,
  },
  {
    slug: 'stop-leaking-billable-hours-live-timers-vs-timesheets',
    title: 'Stop Leaking Billable Hours: Moving from Retrospective Timesheets to Live Timers',
    excerpt: 'Retrospective Friday guesswork causes up to 18% of client project revenue leakage. Here is how modern teams capture real billables automatically.',
    category: 'Agency Operations',
    tags: ['Timesheets', 'Budgets', 'Billing'],
    authorName: 'Carlos Mendez',
    authorRole: 'Agency Founder',
    readTimeMinutes: 4,
    publishedAt: new Date('2026-09-24T13:00:00.000Z'),
    content: `
      <h2>The Friday Afternoon Guessing Game</h2>
      <p>Asking creative and technical workers to reconstruct their Monday morning hours on Friday afternoon invariably produces inaccuracies. Minor 15-minute consultations and code reviews get forgotten, resulting in up to 18% unbilled revenue per team member.</p>
      <p>By integrating live task timers directly into the task card, team members start and stop timers with a single keystroke. When a task completes, billable entries sync directly to the client invoice ledger.</p>
    `,
  },
  {
    slug: 'worksphere-release-interactive-gantt-timelines-client-portals',
    title: 'WorkSphere 2.4 Release: Interactive Gantt Timelines & Client Portals',
    excerpt: 'Introducing two-way milestone dependency snapping, critical path highlighting, and zero-seat-cost external client access permissions.',
    category: 'Product Releases',
    tags: ['Product Update', 'Gantt', 'Portals', 'Release'],
    authorName: 'Sarah Jenkins',
    authorRole: 'Head of Product',
    readTimeMinutes: 3,
    publishedAt: new Date('2026-09-18T08:30:00.000Z'),
    content: `
      <h2>What's New in WorkSphere 2.4</h2>
      <p>We are excited to announce our biggest release of the quarter: fully interactive Gantt timeline charting and secure tokenized Client Portals.</p>
      <h3>Highlights:</h3>
      <ul>
        <li><strong>Interactive Gantt Charts:</strong> Drag task bars to adjust start and due dates with auto-snapping dependency links.</li>
        <li><strong>Critical Path Method (CPM):</strong> Real-time visual identification of zero-slack bottleneck tasks.</li>
        <li><strong>Tokenized Client Portals:</strong> Invite clients to review project progress without requiring them to create paid user accounts.</li>
      </ul>
      <p>Update your workspaces today to start taking advantage of these new capabilities!</p>
    `,
  },
];

async function seedIfEmpty(): Promise<void> {
  try {
    const count = await BlogPostModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial blog posts into database...');
      for (const post of INITIAL_SEED_POSTS) {
        const postId = generateId('blog');
        await BlogPostModel.create({
          postId,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content.trim(),
          category: post.category,
          tags: post.tags,
          status: 'published',
          authorId: 'usr_superadmin_seed',
          authorName: post.authorName,
          authorRole: post.authorRole,
          readTimeMinutes: post.readTimeMinutes,
          publishedAt: post.publishedAt,
        });
      }
      console.log(`✅ Seeded ${INITIAL_SEED_POSTS.length} blog posts successfully`);
    }
  } catch (err) {
    console.error('Failed to seed initial blog posts:', err);
  }
}

// Ensure seed runs in background only for standalone servers (not serverless cold-starts)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  seedIfEmpty();
}

// ─── SuperAdmin Guard Helper ─────────────────────────────────────────────────

const requireSuperAdmin = [
  verifyAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'superAdmin') {
      return sendApiError(
        res,
        { code: 'FORBIDDEN', message: 'Only platform owners (superAdmin) can manage blog posts.' },
        403
      );
    }
    next();
  },
];

// ─── SuperAdmin Management Endpoints (MUST COME BEFORE `/:slug`) ─────────────

/**
 * GET /api/v1/blog/manage/all
 * List all posts with any status for platform_owner / super_admin
 */
router.get('/manage/all', ...requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const pageNum  = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (status && ['draft', 'published', 'archived'].includes(status as string)) {
      query.status = status;
    }
    if (search) {
      const re = { $regex: escapeRegex(String(search)), $options: 'i' };
      query.$or = [{ title: re }, { excerpt: re }, { authorName: re }, { category: re }];
    }

    const [total, posts] = await Promise.all([
      BlogPostModel.countDocuments(query),
      BlogPostModel.find(query)
        .select('-content')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return sendApiResponse(res, posts.map(normalizePost), 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * GET /api/v1/blog/manage/:postId
 * Retrieve full post content by postId for editing
 */
router.get('/manage/:postId', ...requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const post = await BlogPostModel.findOne({ postId: req.params.postId }).lean();
    if (!post) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Blog post not found' }, 404);
    }
    return sendApiResponse(res, normalizePost(post));
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/blog
 * Create a new post (draft or published)
 */
router.post('/', ...requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      title,
      excerpt,
      content,
      category,
      tags = [],
      coverImageUrl,
      status = 'draft',
      authorRole = 'Platform Owner',
      customSlug,
    } = req.body;

    if (!title || !excerpt || !content || !category) {
      return sendApiError(
        res,
        { code: 'VALIDATION_ERROR', message: 'title, excerpt, content, and category are required.' },
        400
      );
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      return sendApiError(
        res,
        { code: 'VALIDATION_ERROR', message: 'status must be "draft", "published", or "archived".' },
        400
      );
    }

    const postId = generateId('blog');
    const slugSuffix = postId.slice(-6);
    let finalSlug = customSlug ? buildSlug(customSlug) : buildSlug(title, slugSuffix);

    // Ensure unique slug
    const existing = await BlogPostModel.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${finalSlug}-${slugSuffix}`;
    }

    const readTimeMinutes = calcReadTime(content);
    const publishedAt = status === 'published' ? new Date() : undefined;

    const post = await BlogPostModel.create({
      postId,
      slug: finalSlug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      coverImageUrl,
      category: category.trim(),
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      status,
      authorId: user.userId,
      authorName: user.name || 'WorkSphere Editorial',
      authorRole: authorRole.trim(),
      readTimeMinutes,
      publishedAt,
    });

    return sendApiResponse(res, post, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * PATCH /api/v1/blog/:postId
 * Update an existing post
 */
router.patch('/:postId', ...requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const post = await BlogPostModel.findOne({ postId: req.params.postId });
    if (!post) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Blog post not found' }, 404);
    }

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      coverImageUrl,
      status,
      authorRole,
      authorName,
      customSlug,
    } = req.body;

    if (title !== undefined) post.title = title.trim();
    if (excerpt !== undefined) post.excerpt = excerpt.trim();
    if (content !== undefined) {
      post.content = content;
      post.readTimeMinutes = calcReadTime(content);
    }
    if (category !== undefined) post.category = category.trim();
    if (authorRole !== undefined) post.authorRole = authorRole.trim();
    if (authorName !== undefined) post.authorName = authorName.trim();
    if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
    if (Array.isArray(tags)) post.tags = tags.map((t: string) => t.trim()).filter(Boolean);

    if (customSlug) {
      const newSlug = buildSlug(customSlug);
      if (newSlug !== post.slug) {
        const conflict = await BlogPostModel.findOne({ slug: newSlug, postId: { $ne: post.postId } });
        if (conflict) {
          return sendApiError(
            res,
            { code: 'SLUG_CONFLICT', message: `Slug "${newSlug}" is already in use by another article.` },
            409
          );
        }
        if (!post.slugHistory) post.slugHistory = [];
        if (!post.slugHistory.includes(post.slug)) {
          post.slugHistory.push(post.slug);
        }
        post.slug = newSlug;
      }
    }

    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        return sendApiError(
          res,
          { code: 'VALIDATION_ERROR', message: 'status must be "draft", "published", or "archived".' },
          400
        );
      }
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
      post.status = status;
    }

    await post.save();
    return sendApiResponse(res, normalizePost(post));
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/blog/manage/:postId/restore
 * Restore an archived blog post back to draft status
 */
router.post('/manage/:postId/restore', ...requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const post = await BlogPostModel.findOne({ postId: req.params.postId });
    if (!post) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Blog post not found' }, 404);
    }
    post.status = 'draft';
    await post.save();
    return sendApiResponse(res, normalizePost(post));
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * DELETE /api/v1/blog/:postId
 * Soft-delete (archive) by default; permanently delete if ?permanent=true
 */
router.delete('/:postId', ...requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const isPermanent = req.query.permanent === 'true';

    if (isPermanent) {
      const post = await BlogPostModel.findOneAndDelete({ postId: req.params.postId });
      if (!post) {
        return sendApiError(res, { code: 'NOT_FOUND', message: 'Blog post not found' }, 404);
      }
      return sendApiResponse(res, { deleted: true, permanent: true, postId: post.postId });
    }

    // Soft delete: move to archived
    const post = await BlogPostModel.findOne({ postId: req.params.postId });
    if (!post) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Blog post not found' }, 404);
    }
    post.status = 'archived';
    await post.save();
    return sendApiResponse(res, { deleted: true, permanent: false, postId: post.postId, status: 'archived' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ─── Public Endpoints (Accessible without auth) ───────────────────────────────

/**
 * GET /api/v1/blog/categories
 * Returns distinct categories of published articles
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await BlogPostModel.distinct('category', { status: 'published' });
    return sendApiResponse(res, categories);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * GET /api/v1/blog/rss.xml
 * Native RSS 2.0 Syndication Feed
 */
router.get('/rss.xml', async (_req: Request, res: Response) => {
  try {
    const posts = await BlogPostModel.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(25)
      .lean();

    const itemsXml = posts
      .map((p) => {
        const pubDate = new Date(p.publishedAt || p.createdAt).toUTCString();
        const link = `https://worksphere.io/blog/${p.slug}`;
        return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${p.authorName || 'WorkSphere Editorial'}]]></author>
      <description><![CDATA[${p.excerpt}]]></description>
      <category><![CDATA[${p.category}]]></category>
    </item>`;
      })
      .join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WorkSphere Engineering &amp; Architecture Dispatches</title>
    <link>https://worksphere.io/blog</link>
    <description>Perspectives on high-velocity project execution, modern software architecture, and agile craft.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://worksphere.io/api/v1/blog/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1200');
    return res.status(200).send(rssXml);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * GET /api/v1/blog/sitemap.xml
 * Search engine XML sitemap of all published articles
 */
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const posts = await BlogPostModel.find({ status: 'published' })
      .select('slug updatedAt publishedAt')
      .sort({ publishedAt: -1 })
      .lean();

    const urlsXml = posts
      .map((p) => {
        const lastMod = new Date(p.updatedAt || p.publishedAt || Date.now()).toISOString().split('T')[0];
        return `  <url>
    <loc>https://worksphere.io/blog/${p.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('\n');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://worksphere.io/blog</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urlsXml}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
    return res.status(200).send(sitemapXml);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/blog/:slug/clap
 * Atomic reader applause / reaction counter
 */
router.post('/:slug/clap', async (req: Request, res: Response) => {
  try {
    const post = await BlogPostModel.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { clapsCount: 1 } },
      { new: true, select: 'postId slug clapsCount' }
    );

    if (!post) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Article not found or not published' }, 404);
    }

    return sendApiResponse(res, { slug: post.slug, clapsCount: post.clapsCount });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * GET /api/v1/blog
 * Public feed of published articles
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, tag, search, page = '1', limit = '12' } = req.query;
    const pageNum  = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const query: any = { status: 'published' };
    if (category && category !== 'All Articles') {
      query.category = category;
    }
    if (tag) {
      query.tags = tag;
    }
    if (search) {
      const re = { $regex: escapeRegex(String(search)), $options: 'i' };
      query.$or = [{ title: re }, { excerpt: re }, { tags: re }, { authorName: re }];
    }

    const [total, posts] = await Promise.all([
      BlogPostModel.countDocuments(query),
      BlogPostModel.find(query)
        .select('-content')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    return sendApiResponse(res, posts.map(normalizePost), 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * GET /api/v1/blog/:slug
 * Public article detail with historical slug redirection support
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    let post = await BlogPostModel.findOne({
      slug: req.params.slug,
      status: 'published',
    }).lean();

    // Check if this was an older slug saved in slugHistory
    if (!post) {
      const historicalPost: any = await BlogPostModel.findOne({
        slugHistory: req.params.slug,
        status: 'published',
      }).lean();

      if (historicalPost) {
        return sendApiResponse(res, {
          ...normalizePost(historicalPost),
          redirectedFrom: req.params.slug,
          canonicalSlug: historicalPost.slug,
        });
      }

      return sendApiError(res, { code: 'NOT_FOUND', message: 'Blog article not found or not published' }, 404);
    }

    // Increment view count asynchronously in background
    BlogPostModel.updateOne({ _id: (post as any)._id }, { $inc: { viewsCount: 1 } }).exec();

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    return sendApiResponse(res, normalizePost(post));
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
