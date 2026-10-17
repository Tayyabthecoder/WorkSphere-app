import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cookie,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  PolicyPageLayout,
  SectionHeading,
  FaqAccordion,
  PolicyContactCard,
  FaqItem,
  TocItem,
  ChangelogItem,
} from '../../components/marketing/policy';
import { POLICY_META, POLICY_READING_TIMES } from './policyConfig';

const cookieFaqs: FaqItem[] = [
  {
    question:
      'Does WorkSphere use third-party advertising or cross-site tracking cookies?',
    answer:
      'No. WorkSphere does not embed any behavioral advertising cookies, retargeting pixels, or data broker scripts. We only use cookies strictly necessary for workspace authentication, security, and interface preferences.',
  },
  {
    question: 'What happens if I disable all cookies in my browser?',
    answer:
      'If you disable strictly necessary cookies, you will not be able to log in to your WorkSphere organization workspace or maintain an authenticated session, as cryptographic session tokens rely on secure browser cookies.',
  },
  {
    question:
      'How does WorkSphere store user interface preferences like themes and sidebar states?',
    answer:
      'We utilize lightweight browser localStorage to remember functional UI choices (such as collapsed sidebar state, active project filter views, and accent themes) directly on your device without server polling.',
  },
  {
    question:
      'Are session tokens encrypted and secured against cross-site scripting?',
    answer:
      'Yes. Authentication tokens and tenant session identifiers are flagged with Secure, HttpOnly (where applicable), and SameSite=Lax/Strict attributes to protect against CSRF and credential interception.',
  },
];

interface CookieRow {
  name: string;
  category: string;
  purpose: string;
  duration: string;
  type: string;
  securityFlags: string;
}

const cookieTable: CookieRow[] = [
  {
    name: 'auth_token',
    category: 'Strictly Necessary',
    purpose:
      'Cryptographically authenticates your user session and validates API requests.',
    duration: 'Session / 7 Days',
    type: 'First-party Cookie',
    securityFlags: 'Secure, SameSite=Lax',
  },
  {
    name: 'tenant_id',
    category: 'Strictly Necessary',
    purpose:
      'Identifies your organization subdomain to enforce schema-level data isolation.',
    duration: 'Session / 7 Days',
    type: 'First-party Cookie',
    securityFlags: 'Secure, SameSite=Lax',
  },
  {
    name: 'csrf_token',
    category: 'Strictly Necessary',
    purpose:
      'Protects forms and API endpoints from Cross-Site Request Forgery vulnerabilities.',
    duration: 'Session',
    type: 'First-party Cookie',
    securityFlags: 'Secure, SameSite=Strict',
  },
  {
    name: 'worksphere_theme',
    category: 'Functional / UI',
    purpose:
      'Remembers your selected workspace accent theme and interface density preferences.',
    duration: 'Persistent (1 Year)',
    type: 'Browser LocalStorage',
    securityFlags: 'Client-Sandboxed',
  },
  {
    name: 'sidebar_state',
    category: 'Functional / UI',
    purpose:
      'Persists whether your project navigation sidebar is collapsed or expanded.',
    duration: 'Persistent (1 Year)',
    type: 'Browser LocalStorage',
    securityFlags: 'Client-Sandboxed',
  },
  {
    name: 'currency_code',
    category: 'Functional / UI',
    purpose:
      'Caches the organization currency symbol for instant budget and timesheet display.',
    duration: 'Persistent (1 Year)',
    type: 'Browser LocalStorage',
    securityFlags: 'Client-Sandboxed',
  },
];

const tocItems: TocItem[] = [
  { id: 'section-1', title: '1. What Are Cookies & Web Storage?' },
  { id: 'section-2', title: '2. Technical Classification & Legal Basis' },
  { id: 'section-3', title: '3. Complete Active Cookie Inventory' },
  { id: 'section-4', title: '4. Local Storage & Client State Caching' },
  { id: 'section-5', title: '5. Zero-Ad-Tracker Guarantee' },
  { id: 'section-6', title: '6. Browser Controls & Management' },
  { id: 'section-7', title: '7. Revisions & Policy Updates' },
  { id: 'section-8', title: '8. Privacy Engineering Contact' },
  { id: 'section-faqs', title: 'Frequently Asked Questions' },
];

const cookieChangelog: ChangelogItem = {
  version: POLICY_META.version,
  changes: [
    'Updated first-party security flags to document strict CSRF and Lax session persistence attributes.',
    'Formally certified complete zero-third-party pixel, ad-beacon, and retargeting tracker deployment.',
    'Documented HTML5 client localStorage boundaries and client-side theme and layout caching.',
    'Audited browser management procedures for Chrome, Safari, Firefox, and Microsoft Edge.',
  ],
};

export const CookiePolicyPage: React.FC = () => {
  return (
    <PolicyPageLayout
      badge="Transparency & Web Storage • Legal Document"
      badgeIcon={Cookie}
      title="Cookie Policy"
      subtitle="Technical disclosures detailing our strictly necessary cookies, client-side storage keys, and zero-ad-tracker commitment."
      version={POLICY_META.version}
      lastRevised={POLICY_META.lastRevised}
      effectiveDate={POLICY_META.effectiveDate}
      readingTimeMinutes={POLICY_READING_TIMES.cookies}
      tocItems={tocItems}
      changelog={cookieChangelog}
      sidebarExtra={
        <PolicyContactCard
          icon={ShieldCheck}
          title="Privacy Engineering"
          description="Questions regarding our browser token storage or cryptographic session management:"
          email="privacy@worksphere.app"
        />
      }
    >
      {/* Executive Notice Banner */}
      <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Absolute Zero-Ad-Tracker Guarantee</span>
        </div>
        <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed">
          Unlike traditional consumer software, WorkSphere never embeds
          advertising trackers, remarketing pixels, or third-party behavioral
          analytics scripts. All cookies and local storage mechanisms exist
          exclusively to authenticate team members, protect against Cross-Site
          Request Forgery (CSRF), and accelerate board interactions.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-4 pt-2">
        <SectionHeading number={1}>What Are Cookies & Web Storage?</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            A cookie is a compact data file transmitted by our web servers and
            saved to your device&apos;s browser directory. Cookies enable modern web
            platforms to distinguish active user sessions, maintain tenant
            security context, and verify API authorization tokens.
          </p>
          <p>
            Modern single-page applications (SPAs) like WorkSphere also leverage
            HTML5 <strong>LocalStorage</strong> and{' '}
            <strong>SessionStorage</strong>. Unlike HTTP cookies (which are sent
            to the server on every request), LocalStorage resides purely on your
            client machine, allowing instantaneous UI rendering (such as
            collapsed sidebar state and theme accents) without unnecessary server
            round trips.
          </p>
          <p className="text-xs text-slate-500">
            For broader details on how your organization data is handled, please
            refer to our companion{' '}
            <Link
              to="/privacy"
              className="text-emerald-700 underline font-semibold hover:text-emerald-800"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={2}>
          Technical Classification & Legal Basis
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            Under European ePrivacy Directive 2002/58/EC (amended by Directive
            2009/136/EC) and GDPR Article 6, we classify our client-side storage
            into two strictly operational tiers:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#FAFBF9] border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Strictly Necessary (Exempt from Consent)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Indispensable for authenticating your account, validating tenant
                routing, and defending against CSRF exploits. Under applicable
                statutory guidelines, strictly necessary technical cookies do not
                require prior consent.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAFBF9] border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Functional UI Preferences</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Caches your visual preferences (theme accents, sidebar collapse
                state, and currency formats) locally on your device to ensure a
                continuous, personalized workflow across sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Structured Inventory Table */}
      <section id="section-3" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={3}>
          Complete Active Cookie & Storage Inventory
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            The following registry outlines all first-party cookies and
            LocalStorage identifiers utilized across the WorkSphere platform:
          </p>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Identifier</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-4">Technical Function</th>
                    <th className="py-3 px-3">Lifespan</th>
                    <th className="py-3 px-4">Security Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {cookieTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {row.name}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.category.includes('Necessary')
                              ? 'bg-emerald-100 text-[#006C4B]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">{row.purpose}</td>
                      <td className="py-3 px-3 font-medium text-slate-500">
                        {row.duration}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-800">
                        {row.securityFlags}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={4}>
          Local Storage & Client State Caching
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere utilizes browser-level state caching to power sub-second
            board interactions. When you drag a card on an Agile Kanban board or
            expand a sprint hierarchy on the Gantt timeline, optimistic UI
            updates occur instantaneously in memory while state deltas are
            transmitted over encrypted WebSockets (
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">
              wss://
            </code>
            ).
          </p>
          <p>
            This architecture ensures fluid responsiveness without ever exposing
            project content to external storage or unauthenticated scripts.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={5}>Zero-Ad-Tracker Guarantee</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere takes an unambiguous stance against surveillance
            capitalism:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Third-Party Advertising Pixels:</strong> We do not
                load Facebook Pixels, Google Tag Manager remarketing scripts,
                LinkedIn Insight tags, or Twitter conversion pixels.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Cross-Site Tracking:</strong> We do not track your
                browsing activity across other websites or contribute to
                advertising profiling data pools.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Data Broker Sharing:</strong> Your organization
                membership and usage frequencies are never sold or rented to data
                aggregators.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={6}>
          Browser Controls & Cookie Management
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            You can manage or disable cookies at any time via your browser
            settings:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBF9] space-y-1">
              <strong>Google Chrome:</strong>
              <p className="text-slate-500">
                Settings &rarr; Privacy and security &rarr; Third-party cookies
                &rarr; Clear browsing data.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBF9] space-y-1">
              <strong>Apple Safari:</strong>
              <p className="text-slate-500">
                Preferences &rarr; Privacy &rarr; Manage Website Data &rarr;
                Remove All.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBF9] space-y-1">
              <strong>Mozilla Firefox:</strong>
              <p className="text-slate-500">
                Settings &rarr; Privacy & Security &rarr; Cookies and Site Data
                &rarr; Clear Data.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBF9] space-y-1">
              <strong>Microsoft Edge:</strong>
              <p className="text-slate-500">
                Settings &rarr; Cookies and site permissions &rarr; Manage and
                delete cookies.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Authentication Notice:</strong> If you block all cookies,
              you will not be able to log in to your WorkSphere tenant workspace,
              as secure authentication tokens cannot be preserved across page
              reloads.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={7}>Revisions & Policy Updates</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere periodically reviews and updates this Cookie Policy to
            reflect new platform capabilities or statutory regulatory revisions.
            Any material adjustments will be posted here with an updated
            &ldquo;Last Revised&rdquo; timestamp and communicated to workspace
            administrators via the in-app notification center.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={8}>Privacy Engineering Contact</SectionHeading>
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            For technical inquiries regarding token lifecycle, cryptographic
            cookie flags, or browser security headers:
          </p>
          <div className="text-xs font-mono text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1">
            <p>
              <strong>WorkSphere Platform Inc.</strong>
            </p>
            <p>Attn: Privacy Engineering & Information Security</p>
            <p>
              Email:{' '}
              <a
                href="mailto:privacy@worksphere.app"
                className="text-emerald-700 underline font-bold"
              >
                privacy@worksphere.app
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqAccordion
        items={cookieFaqs}
        title="Frequently Asked Questions"
        description="Technical questions about cookies, web storage, and tracker transparency."
      />
    </PolicyPageLayout>
  );
};

export default CookiePolicyPage;
