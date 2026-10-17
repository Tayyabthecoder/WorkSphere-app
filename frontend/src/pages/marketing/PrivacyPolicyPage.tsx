import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Server,
  Database,
  Globe,
  CheckCircle2,
  Sparkles,
  Mail,
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

const privacyFaqs: FaqItem[] = [
  {
    question: 'Does WorkSphere sell or monetize my team’s project data?',
    answer:
      'No. WorkSphere operates strictly on a B2B SaaS operational model. We do not sell, rent, monetize, or broker customer data, team communications, or project metadata to any third party under any circumstances.',
  },
  {
    question: 'Are my projects, code snippets, or task notes used to train public AI models?',
    answer:
      'Never. Customer workspace data, task descriptions, comments, attachments, and timesheets are strictly isolated and are never used to train, fine-tune, or calibrate public machine learning models or third-party artificial intelligence systems.',
  },
  {
    question: 'How is tenant data isolated across workspaces?',
    answer:
      'WorkSphere enforces strict schema-level tenant partitioning. Every API route, WebSocket connection, and database query is cryptographically bounded and validated against your organization’s unique tenant identifier prior to execution.',
  },
  {
    question: 'Can our organization export or delete all data upon account termination?',
    answer:
      'Yes. Authorized administrators can generate a full workspace data export (JSON/CSV) covering tasks, sprints, time logs, and documents at any time. Upon formal workspace decommissioning, all production data is scrubbed and purged from rolling backups within 30 days.',
  },
  {
    question: 'Is WorkSphere compliant with GDPR and CCPA / CPRA regulations?',
    answer:
      'Yes. WorkSphere provides full GDPR (EU/UK) and CCPA/CPRA compliance, including executing Standard Contractual Clauses (SCCs), offering a comprehensive Data Processing Addendum (DPA), and providing dedicated Data Subject Access Request (DSAR) self-service tooling.',
  },
];

const subProcessors = [
  {
    name: 'Amazon Web Services (AWS)',
    location: 'United States & EU',
    purpose:
      'Core cloud hosting, managed container cluster execution, and automated snapshot backups.',
    safeguards: 'ISO 27001, SOC 2 Type II, Standard Contractual Clauses (SCCs)',
  },
  {
    name: 'MongoDB Atlas',
    location: 'United States & EU',
    purpose:
      'Encrypted managed multi-tenant document database with VPC peering and automated encryption at rest.',
    safeguards: 'ISO 27001, SOC 2 Type II, AES-256 Storage Encryption',
  },
  {
    name: 'Cloudflare Inc.',
    location: 'Global Anycast Edge',
    purpose:
      'DDoS mitigation, web application firewall (WAF), and global TLS 1.3 termination.',
    safeguards: 'SOC 2 Type II, Privacy Shield / DPA',
  },
  {
    name: 'Resend / SendGrid',
    location: 'United States',
    purpose:
      'Transactional email delivery for workspace invitations, password resets, and critical cost alerts.',
    safeguards: 'SOC 2 Type II, DPA with SCCs',
  },
];

const tocItems: TocItem[] = [
  { id: 'section-1', title: '1. Introduction & Corporate Identity' },
  { id: 'section-2', title: '2. Role Clarification (Controller vs. Processor)' },
  { id: 'section-3', title: '3. Categories of Information Collected' },
  { id: 'section-4', title: '4. Legal Bases for Processing (GDPR Art. 6)' },
  { id: 'section-5', title: '5. Tenant Isolation & Cryptographic Architecture' },
  { id: 'section-6', title: '6. Zero-Advertising & AI Training Prohibition' },
  { id: 'section-7', title: '7. Sub-processors & Third-Party Sharing' },
  { id: 'section-8', title: '8. International Data Transfers' },
  { id: 'section-9', title: '9. Data Retention & Erasure Schedules' },
  { id: 'section-10', title: '10. Data Subject Rights (GDPR & CCPA)' },
  { id: 'section-11', title: '11. Security Incident Response Protocols' },
  { id: 'section-12', title: '12. DPO Contact & Regulatory Inquiries' },
  { id: 'section-faqs', title: 'Frequently Asked Questions' },
];

const privacyChangelog: ChangelogItem = {
  version: POLICY_META.version,
  changes: [
    'Incorporated UK International Data Transfer Addendum (IDTA) under Data Protection Act 2018 Section 119A.',
    'Enhanced Sub-processor Transparency Registry with Cloudflare TLS edge termination safeguards.',
    'Codified strict 30-day post-termination rolling backup permanent purge schedule.',
    'Reaffirmed absolute zero-third-party tracking and AI-model training prohibitions.',
  ],
};

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <PolicyPageLayout
      badge="Enterprise Compliance • Legal Document"
      badgeIcon={ShieldCheck}
      title="Privacy Policy"
      subtitle="Comprehensive disclosures regarding the collection, processing, tenant isolation, and statutory protection of your organizational data."
      version={POLICY_META.version}
      lastRevised={POLICY_META.lastRevised}
      effectiveDate={POLICY_META.effectiveDate}
      readingTimeMinutes={POLICY_READING_TIMES.privacy}
      tocItems={tocItems}
      changelog={privacyChangelog}
      sidebarExtra={
        <PolicyContactCard
          icon={Mail}
          title="Data Protection Officer"
          description="For formal Data Subject Access Requests (DSARs), Data Processing Addendums (DPAs), or regulatory inquiries:"
          email="privacy@worksphere.app"
          secondaryEmail="security@worksphere.app"
          secondaryLabel="Security Disclosures"
        />
      }
    >
      {/* Executive Notice Banner */}
      <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Executive Privacy Commitment</span>
        </div>
        <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed">
          WorkSphere is engineered from the ground up on the principle of tenant
          confidentiality. We do not sell your personal data, we do not operate
          third-party advertising trackers, and we will never use your private
          tasks, sprints, documents, or timesheets to train artificial
          intelligence models.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-4 pt-2">
        <SectionHeading number={1}>Introduction & Corporate Identity</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            This Privacy Policy (&ldquo;Policy&rdquo;) governs the processing of
            personal data by <strong>WorkSphere Platform Inc.</strong>{' '}
            (&ldquo;WorkSphere&rdquo;, &ldquo;Company&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;, or &ldquo;our&rdquo;) in connection with the
            WorkSphere web applications, mobile interfaces, application
            programming interfaces (APIs), client portals, and marketing
            platforms (collectively, the &ldquo;Service&rdquo;).
          </p>
          {/* Note: Legal notice framing updated for GDPR Art. 7 consent compliance */}
          <p>
            By registering for, accessing, or utilizing the Service, you
            acknowledge that you have read and understood the data practices
            described herein. Where statutory regulations require consent for
            specific operations (such as non-essential marketing or diagnostic
            telemetry), WorkSphere solicits granular, unbundled consent at the
            point of collection. If you are accessing the Service on behalf of an
            enterprise customer or employer, that entity has entered into a
            governing Master Services Agreement or{' '}
            <Link
              to="/terms"
              className="text-emerald-700 underline font-semibold hover:text-emerald-800"
            >
              Terms of Service
            </Link>{' '}
            with WorkSphere.
          </p>
          <p className="text-xs text-slate-500">
            For specific disclosures concerning browser tokens and client-side
            storage, please review our companion{' '}
            <Link
              to="/cookies"
              className="text-emerald-700 underline font-semibold hover:text-emerald-800"
            >
              Cookie Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={2}>
          Role Clarification (Data Controller vs. Data Processor)
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            Under European Union General Data Protection Regulation (Regulation
            (EU) 2016/679, &ldquo;GDPR&rdquo;), the UK Data Protection Act 2018,
            and California Consumer Privacy Act (&ldquo;CCPA/CPRA&rdquo;),
            WorkSphere maintains distinct legal roles:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#FAFBF9] border border-slate-200/80 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                WorkSphere as Processor
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Customer Workspace Data
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For all tasks, projects, backlog items, uploaded sprint
                documents, time tracking records, and client portal notes, the
                Customer is the <strong>Data Controller</strong>. WorkSphere
                processes this data strictly as a <strong>Data Processor</strong>{' '}
                under Customer instructions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAFBF9] border border-slate-200/80 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                WorkSphere as Controller
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Account & Diagnostic Data
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                WorkSphere acts as a <strong>Data Controller</strong> solely with
                respect to account administrative identity (administrator email,
                billing point-of-contact), customer support correspondences, and
                aggregated security diagnostic logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={3}>Categories of Information Collected</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            We classify the data processed through WorkSphere into three distinct
            operational tiers:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>A. Account Credentials & Organizational Identity</span>
              </h4>
              <p className="text-xs text-slate-600 pl-6">
                Includes full legal name, professional email address,
                cryptographic password hash (bcrypt salted), organization name,
                tenant slug, job designation, and role-based access level
                (SuperAdmin, OrgAdmin, Manager, Team Leader, Member, or Client).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>B. Workspace Operational Content</span>
              </h4>
              <p className="text-xs text-slate-600 pl-6">
                Includes project backlogs, Kanban boards, Gantt timeline
                dependencies, task priorities, story point estimates, weekly
                timesheet logs, stopwatch timer triggers, billable rates, project
                budget allocations, milestone approvals, and file attachments.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>C. Telemetry, Session & Diagnostic Logs</span>
              </h4>
              <p className="text-xs text-slate-600 pl-6">
                Includes IP addresses, browser user agent strings, WebSocket
                connection IDs, HTTP request headers, diagnostic latency
                metrics, and error stack traces. Telemetry logs are strictly
                segregated from workspace operational content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={4}>
          Legal Bases for Processing (GDPR Article 6)
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere relies on specific lawful bases to collect and process
            personal data under GDPR Article 6:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Processing Activity</th>
                  <th className="py-3 px-4">Data Categories</th>
                  <th className="py-3 px-4">GDPR Lawful Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Provisioning tenant workspace & services
                  </td>
                  <td className="py-3 px-4">
                    Account identity, workspace content
                  </td>
                  <td className="py-3 px-4">
                    Article 6(1)(b): Performance of Contract
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Real-time WebSocket state synchronization
                  </td>
                  <td className="py-3 px-4">
                    Session tokens, board state deltas
                  </td>
                  <td className="py-3 px-4">
                    Article 6(1)(b): Performance of Contract
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    DDoS defense & security auditing
                  </td>
                  <td className="py-3 px-4">
                    IP addresses, auth logs, request headers
                  </td>
                  <td className="py-3 px-4">
                    Article 6(1)(f): Legitimate Interests
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Invoice export & statutory tax compliance
                  </td>
                  <td className="py-3 px-4">Organization name, invoice logs</td>
                  <td className="py-3 px-4">
                    Article 6(1)(c): Legal Obligation
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={5}>
          Tenant Isolation & Cryptographic Architecture
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            WorkSphere enforces security as code. Our infrastructure implements
            multiple defense-in-depth layers designed to exceed SOC 2 Type II and
            ISO 27001 baseline specifications:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>AES-256 Storage Encryption</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All persistent database files, automated snapshots, and document
                attachments are encrypted at rest using industry-standard AES-256
                with automated key rotation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>TLS 1.3 Transport Security</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All web, API, and WebSocket transmissions require TLS 1.3 with
                modern cipher suites and Strict Transport Security (HSTS)
                preloading.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Schema-Level Partitioning</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every database query executes through an isolated tenant context
                filter. Cross-tenant leakage is prevented at both the application
                gateway and database layer.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Dedicated Tenant Subdomains</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tenant traffic is scoped by dedicated subdomain routing (
                <code className="text-xs font-mono">org.worksphere.app</code>).
                Authentication cookies are sandboxed strictly to the assigned
                tenant origin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={6}>
          Zero-Advertising & AI Training Prohibition
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere explicitly disclaims any ownership over Customer Content.
            Unlike consumer productivity software, WorkSphere maintains an
            absolute prohibition on data monetization:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>No Public AI Training:</strong> Your task descriptions,
                sprint backlogs, code references, and team comments are never
                provided to third-party artificial intelligence engines for model
                training or RLHF tuning.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Behavioral Trackers:</strong> We do not deploy
                third-party advertising cookies, retargeting pixels, or
                behavioral tracking beacons within the WorkSphere application.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Data Brokerage:</strong> We do not sell, rent,
                license, or exchange customer personal data under the CCPA or
                any international data protection legislation.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={7}>
          Sub-processors & Third-Party Sharing
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            WorkSphere engages a minimal set of enterprise-grade cloud
            sub-processors to maintain the reliability of the Service. Each
            sub-processor undergoes rigorous security auditing and is bound by
            contractual terms reflecting our Data Processing Addendum:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Sub-processor</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-4">Operational Purpose</th>
                  <th className="py-3 px-4">Security Safeguards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {subProcessors.map((sp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {sp.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {sp.location}
                    </td>
                    <td className="py-3 px-4">{sp.purpose}</td>
                    <td className="py-3 px-4 text-emerald-800 font-medium">
                      {sp.safeguards}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={8}>International Data Transfers</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere servers and data centers are located primarily in the
            United States and European Union. When transferring personal data
            originating in the European Economic Area (EEA), United Kingdom, or
            Switzerland to countries that have not received an adequacy decision
            from the European Commission, WorkSphere executes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>
              The European Commission Standard Contractual Clauses (SCCs) (Module
              2: Controller-to-Processor and Module 3: Processor-to-Processor).
            </li>
            <li>
              Supplementary technical safeguards including AES-256 resting
              encryption and end-to-end transport isolation.
            </li>
            <li>
              UK International Data Transfer Addendum (IDTA) under Section 119A
              of the Data Protection Act 2018.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 9 */}
      <section id="section-9" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={9}>
          Data Retention & Erasure Schedules
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere retains Customer Data only for as long as an organization
            maintains an active tenant subscription, or as required by statutory
            record retention rules:
          </p>
          <div className="bg-[#FAFBF9] p-5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <div className="font-bold text-slate-900 text-sm">
              Automated Decommissioning Cycle
            </div>
            <ul className="space-y-2 text-slate-600">
              <li>
                &bull; <strong>Active Workspace:</strong> Data persists
                indefinitely during the term of service.
              </li>
              <li>
                &bull; <strong>Workspace Decommissioning:</strong> Following
                customer account termination, production database partitions are
                quarantined for a 30-day grace period to allow final
                administrative exports.
              </li>
              <li>
                &bull; <strong>Permanent Purge:</strong> After 30 days, database
                records are cryptographically wiped from active clusters and
                overwritten across rolling disaster recovery backups within 30
                days.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 10 */}
      <section id="section-10" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={10}>
          Data Subject Rights (GDPR & CCPA/CPRA)
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Depending on your jurisdiction, you possess statutory rights
            regarding the personal data we hold about you:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <strong>Right of Access & Portability:</strong> Request a complete
              copy of personal records in machine-readable JSON/CSV format.
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <strong>Right to Rectification:</strong> Request correction of
              inaccurate personal or organizational profile data.
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <strong>Right to Erasure:</strong> Request permanent scrubbing of
              your personal information (&ldquo;Right to be Forgotten&rdquo;).
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <strong>Right to Restrict Processing:</strong> Request temporary or
              permanent restriction of specific data handling operations.
            </div>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            To exercise any of these rights, contact your workspace administrator
            directly, or contact our Data Protection Officer at{' '}
            <a
              href="mailto:privacy@worksphere.app"
              className="text-emerald-700 underline font-semibold"
            >
              privacy@worksphere.app
            </a>
            . We respond to all verified statutory requests within 30 calendar
            days.
          </p>
        </div>
      </section>

      {/* Section 11 */}
      <section id="section-11" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={11}>
          Security Incident Response Protocols
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere maintains an active 24/7 Security Incident Response Plan.
            In the event of a confirmed breach of security leading to the
            accidental or unlawful destruction, loss, alteration, unauthorized
            disclosure of, or access to Customer Personal Data, WorkSphere will:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>
              Notify affected organization administrators without undue delay
              and, where feasible, within <strong>48 hours</strong> of becoming
              aware of the incident.
            </li>
            <li>
              Provide a detailed preliminary incident briefing including affected
              tenant scopes, data categories, and immediate mitigation actions
              taken.
            </li>
            <li>
              Cooperate fully with affected Customers to facilitate statutory
              notifications to supervisory authorities and affected data
              subjects.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 12 */}
      <section id="section-12" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={12}>
          DPO Contact & Regulatory Inquiries
        </SectionHeading>
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            If you have questions, comments, or formal compliance inquiries
            regarding this Privacy Policy or our security framework, please
            contact our legal and compliance office:
          </p>
          <div className="text-xs font-mono text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1">
            <p>
              <strong>WorkSphere Platform Inc.</strong>
            </p>
            <p>Attn: Data Protection Officer & Legal Counsel</p>
            <p>
              Email:{' '}
              <a
                href="mailto:privacy@worksphere.app"
                className="text-emerald-700 underline font-bold"
              >
                privacy@worksphere.app
              </a>
            </p>
            <p>
              Security Disclosure:{' '}
              <a
                href="mailto:security@worksphere.app"
                className="text-emerald-700 underline font-bold"
              >
                security@worksphere.app
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqAccordion
        items={privacyFaqs}
        title="Frequently Asked Questions"
        description="Common questions regarding data privacy, tenant isolation, and compliance."
      />
    </PolicyPageLayout>
  );
};

export default PrivacyPolicyPage;
