import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Building2,
  Sparkles,
  XCircle,
  AlertTriangle,
  FileCheck2,
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

const termsFaqs: FaqItem[] = [
  {
    question: 'Who owns the project data, tasks, and files created in WorkSphere?',
    answer:
      'You do. You and your organization retain 100% exclusive intellectual property ownership of all customer data, files, task hierarchies, timesheets, and documentation uploaded to or created within WorkSphere.',
  },
  {
    question: 'Is the platform really free right now under these terms?',
    answer:
      'Yes. During our public launch, WorkSphere provides full access to all features (including Pro and Enterprise tier capabilities) with zero licensing fees, zero credit card requirement, and zero hidden penalties.',
  },
  {
    question: 'What happens to our workspace if we decide to cancel or leave?',
    answer:
      'You can export all workspace records in standard JSON and CSV formats at any time. Upon formal termination, we provide a 30-day grace period during which your data remains accessible for archiving before secure automated schema decommissioning.',
  },
  {
    question: 'Are there seat limitations on external clients invited via the Client Portal?',
    answer:
      'No. External client reviewers and guest portal users invited with restricted permissions to inspect project deliverables do not count as billable internal team seats.',
  },
  {
    question: 'What is WorkSphere’s uptime and availability commitment?',
    answer:
      'We target 99.9% operational availability for our cloud infrastructure, backed by continuous multi-region hot standby replication and automated failover architecture.',
  },
];

const tocItems: TocItem[] = [
  { id: 'section-1', title: '1. Definitions & Construction' },
  { id: 'section-2', title: '2. Provisioning & Administrator Authority' },
  { id: 'section-3', title: '3. Early Access Launch & Free Terms' },
  { id: 'section-4', title: '4. Customer Data & IP Ownership' },
  { id: 'section-5', title: '5. Acceptable Use Policy' },
  { id: 'section-6', title: '6. Confidentiality & Non-Disclosure' },
  { id: 'section-7', title: '7. Service Level Commitment (99.9% SLA)' },
  { id: 'section-8', title: '8. Warranties & Disclaimers' },
  { id: 'section-9', title: '9. Limitation of Liability' },
  { id: 'section-10', title: '10. Mutual Indemnification' },
  { id: 'section-11', title: '11. Termination & 30-Day Portability' },
  { id: 'section-12', title: '12. Governing Law & Dispute Resolution' },
  { id: 'section-13', title: '13. Corporate Legal Contacts' },
  { id: 'section-faqs', title: 'Frequently Asked Questions' },
];

const termsChangelog: ChangelogItem = {
  version: POLICY_META.version,
  changes: [
    'Formalized 99.9% uptime Service Level Agreement (SLA) operational commitments.',
    'Codified guaranteed 30-day read-only data portability grace period before automated erasure.',
    'Reaffirmed absolute zero-AI training and customer IP preservation policy.',
    'Clarified unlimited external guest reviewer permissions under Client Portal terms.',
  ],
};

export const TermsOfServicePage: React.FC = () => {
  return (
    <PolicyPageLayout
      badge="Master Services Agreement • Terms of Service"
      badgeIcon={Scale}
      title="Terms of Service"
      subtitle="The rights, responsibilities, and service standards governing your organization's use of the WorkSphere platform."
      version={POLICY_META.version}
      lastRevised={POLICY_META.lastRevised}
      effectiveDate={POLICY_META.effectiveDate}
      readingTimeMinutes={POLICY_READING_TIMES.terms}
      tocItems={tocItems}
      changelog={termsChangelog}
      sidebarExtra={
        <PolicyContactCard
          icon={Building2}
          title="Enterprise Master Agreements"
          description="Enterprise customers requiring negotiated terms, custom Business Associate Agreements (BAAs), or custom security SLAs:"
          email="legal@worksphere.app"
        />
      }
    >
      {/* Executive Notice Banner */}
      <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Key Principles for Modern Engineering Teams</span>
        </div>
        <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed">
          These Terms are drafted in clear, unambiguous commercial language. You
          retain 100% exclusive ownership over your data and code. We will never
          lock your data behind punitive export penalties or claim intellectual
          property rights to your work. During our early access public launch, all
          features are 100% free with no credit card required.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="space-y-4 pt-2">
        <SectionHeading number={1}>Definitions & Construction</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Throughout these Terms of Service (&ldquo;Agreement&rdquo; or
            &ldquo;Terms&rdquo;), the following capitalized terms shall have the
            meanings set forth below:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li>
              <strong>&ldquo;Customer&rdquo;</strong> or{' '}
              <strong>&ldquo;Organization&rdquo;</strong> means the legal entity
              or individual that registers an account and accepts these Terms.
            </li>
            <li>
              <strong>&ldquo;Customer Data&rdquo;</strong> means all electronic
              data, text, tasks, files, timesheets, sprint backlogs, code
              snippets, or other materials submitted to or stored within a Tenant
              Environment by Customer or its Authorized Users.
            </li>
            <li>
              <strong>&ldquo;Authorized User&rdquo;</strong> means an individual
              employee, contractor, or invited external client whom Customer
              permits to access the Service under Customer&apos;s credentials.
            </li>
            <li>
              <strong>&ldquo;Tenant Environment&rdquo;</strong> means the
              logically isolated database partition, configuration namespace, and
              subdomain designated for Customer&apos;s workspace (
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                org.worksphere.app
              </code>
              ).
            </li>
            <li>
              <strong>&ldquo;Service&rdquo;</strong> means the cloud-hosted
              WorkSphere project management platform, APIs, documentation, client
              portals, and related applications provided by WorkSphere Platform
              Inc.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={2}>Provisioning & Administrator Authority</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Upon registration, WorkSphere provisions an isolated Tenant
            Environment. Customer designates one or more account administrators
            who possess authority to configure workspace settings, invite team
            members, assign Role-Based Access Control (RBAC) levels (SuperAdmin,
            OrgAdmin, Manager, Team Leader, Member, and Client), and request
            account termination.
          </p>
          <p>
            Customer is solely responsible for maintaining the confidentiality of
            administrative credentials, enforcing robust password security, and
            revoking access tokens for departed personnel. WorkSphere is not
            liable for unauthorized access resulting from compromised Customer
            credentials.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={3}>Early Access Launch & Free Terms</SectionHeading>
        <div className="bg-[#FAFBF9] p-6 rounded-2xl border border-slate-200/80 space-y-3 text-sm text-slate-600 leading-relaxed">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Public Launch Commitment</span>
          </div>
          <p>
            WorkSphere is currently provided <strong>100% free of charge</strong>{' '}
            during our early access public launch. Customer and its Authorized
            Users are granted full access to all features—including Pro and
            Enterprise capabilities such as unlimited sprint cycles, interactive
            Gantt charts, timesheet approval workflows, and Client Portals—at zero
            licensing cost.
          </p>
          <p className="text-xs text-slate-500">
            No credit card or automated billing instrument is required. If
            WorkSphere introduces paid subscription tiers in the future, Customer
            will receive at least <strong>60 days advance written notice</strong>{' '}
            before any fee schedule applies. No automatic charges, retroactive
            fees, or sudden workspace lockouts will ever occur.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={4}>Customer Data & Intellectual Property Ownership</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            <strong>100% Customer Ownership:</strong> As between Customer and
            WorkSphere, Customer exclusively retains all worldwide right, title,
            interest, and intellectual property in and to all Customer Data.
            WorkSphere acquires no ownership, copyright, or proprietary interest
            in any files, tasks, comments, budgets, or timesheets uploaded to the
            Service.
          </p>
          <p>
            <strong>Limited Operational License:</strong> Customer grants
            WorkSphere only the limited, non-exclusive, royalty-free license
            strictly necessary to host, store, replicate, transmit, and display
            Customer Data solely for the purpose of operating, maintaining, and
            supporting the Service on Customer&apos;s behalf. For full details on
            our cryptographic safeguards, refer to our{' '}
            <Link
              to="/privacy"
              className="text-emerald-700 underline font-semibold hover:text-emerald-800"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            <strong>Prohibition on AI Training:</strong> WorkSphere warrants that
            Customer Data is never licensed, distributed, or submitted to
            third-party artificial intelligence engines or large language models
            for public training, fine-tuning, or algorithmic calibration.
          </p>
        </div>
      </section>

      {/* Section 5: Acceptable Use Policy with PROHIBITED ICON (XCircle) */}
      <section id="section-5" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={5}>Acceptable Use Policy</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            To protect infrastructure stability and tenant security, Customer
            agrees that Authorized Users will <strong>not</strong> engage in any
            of the following prohibited activities:
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2.5 p-2 rounded-xl bg-red-50/40 border border-red-100/80">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>Reverse engineering:</strong> Decompile, disassemble, or
                derive the source code of the WorkSphere software engine or APIs.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-xl bg-red-50/40 border border-red-100/80">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>Unauthorized scanning:</strong> Conduct automated
                penetration testing, vulnerability scanning, or denial-of-service
                simulations without prior written authorization from our security
                office.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-xl bg-red-50/40 border border-red-100/80">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>Boundary circumvention:</strong> Bypass, alter, or
                circumvent multi-tenant schema boundaries, authentication cookies,
                or role-based access restrictions.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-xl bg-red-50/40 border border-red-100/80">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>Harmful content:</strong> Transmit illegal material,
                malware, ransomware, or assets that infringe upon third-party
                intellectual property rights.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={6}>Confidentiality & Non-Disclosure</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            &ldquo;Confidential Information&rdquo; encompasses all non-public
            operational, technical, financial, and business information disclosed
            by either party, including all Customer Data. Each party agrees to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>
              Protect the disclosing party&apos;s Confidential Information with the
              same degree of care it uses for its own confidential assets (and in
              no event less than reasonable care).
            </li>
            <li>
              Disclose Confidential Information only to employees, contractors,
              and legal advisors who have a strict need to know and are bound by
              written confidentiality obligations at least as restrictive as
              these Terms.
            </li>
            <li>
              Never use Confidential Information for any purpose outside the
              performance of this Agreement.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={7}>Service Level Commitment (99.9% SLA)</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere warrants that our cloud infrastructure will achieve a
            minimum monthly uptime of <strong>99.9%</strong> during each calendar
            month, excluding scheduled maintenance windows announced at least 48
            hours in advance.
          </p>
          <p>
            Our high-availability infrastructure incorporates multi-region
            automated replication, container auto-recovery, and sub-50ms WebSocket
            heartbeats to ensure continuous operational resilience for
            high-velocity engineering teams.
          </p>
        </div>
      </section>

      {/* Section 8: Warranties & Disclaimers with STYLED ALERT CARD */}
      <section id="section-8" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={8}>Warranties & Disclaimers</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            WorkSphere warrants that the Service will operate substantially in
            accordance with published system documentation and that we implement
            industry-standard security measures (including AES-256 resting
            encryption and TLS 1.3 transit encryption) to protect Customer Data
            against unauthorized disclosure.
          </p>

          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-950/90 leading-relaxed">
              <strong className="block font-bold text-amber-900 text-xs uppercase tracking-wide">
                Warranty Disclaimer
              </strong>
              <p>
                Except as expressly set forth herein, the Service is provided
                &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; WorkSphere
                disclaims all other warranties, express or implied, including
                without limitation warranties of merchantability, fitness for a
                particular purpose, title, and non-infringement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Limitation of Liability with STYLED ALERT CARD */}
      <section id="section-9" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={9}>Limitation of Liability</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Liability Cap & Exclusion of Consequential Damages
            </div>
            <p>
              To the maximum extent permitted by applicable law, in no event shall
              either party be liable for any indirect, incidental, special,
              consequential, or punitive damages (including loss of profits,
              data, goodwill, or business opportunity), regardless of the theory
              of liability.
            </p>
            <p>
              Each party&apos;s maximum aggregate liability arising out of or related
              to this Agreement shall be limited to the total fees paid or payable
              by Customer to WorkSphere in the twelve (12) months preceding the
              incident, or one hundred US dollars ($100) during any period of
              free or promotional usage.
            </p>
          </div>
        </div>
      </section>

      {/* Section 10 */}
      <section id="section-10" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={10}>Mutual Indemnification</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            <strong>WorkSphere Indemnification:</strong> WorkSphere will defend
            and indemnify Customer against third-party claims alleging that
            Customer&apos;s authorized use of the Service infringes any valid
            patent, copyright, or trademark of a third party, subject to prompt
            written notification.
          </p>
          <p>
            <strong>Customer Indemnification:</strong> Customer will defend and
            indemnify WorkSphere against third-party claims arising from Customer
            Data uploaded in violation of applicable laws or third-party
            intellectual property rights.
          </p>
        </div>
      </section>

      {/* Section 11 */}
      <section id="section-11" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={11}>
          Termination & 30-Day Data Portability Grace Period
        </SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Customer may terminate this Agreement at any time through the
            workspace settings console. WorkSphere may suspend or terminate access
            only upon material breach of this Agreement following a 30-day
            written notice and cure period (except in cases of severe security
            hazards).
          </p>
          <p>
            <strong>Data Portability Guarantee:</strong> Following termination,
            WorkSphere preserves Customer&apos;s Tenant Environment in read-only
            status for a <strong>30-calendar-day grace period</strong>, during
            which administrators may download complete JSON and CSV archives of
            all project boards, sprint records, task hierarchies, and timesheets
            at zero fee. After 30 days, all Customer Data is cryptographically
            purged.
          </p>
        </div>
      </section>

      {/* Section 12 */}
      <section id="section-12" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={12}>Governing Law & Dispute Resolution</SectionHeading>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            This Agreement shall be governed by and construed in accordance with
            the laws of the State of Delaware, United States, without regard to
            its conflict of law principles. The United Nations Convention on
            Contracts for the International Sale of Goods does not apply.
          </p>
          <p>
            Any dispute arising out of or relating to this Agreement shall be
            resolved through confidential, binding commercial arbitration
            administered by JAMS or the American Arbitration Association (AAA) in
            accordance with its commercial rules.
          </p>
        </div>
      </section>

      {/* Section 13 */}
      <section id="section-13" className="space-y-4 pt-4 border-t border-slate-100">
        <SectionHeading number={13}>Corporate Legal Contacts</SectionHeading>
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Formal notices, service of process, and inquiries regarding custom
            enterprise agreements should be addressed to our legal department:
          </p>
          <div className="text-xs font-mono text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1">
            <p>
              <strong>WorkSphere Platform Inc.</strong>
            </p>
            <p>Attn: Legal Affairs & General Counsel</p>
            <p>
              Email:{' '}
              <a
                href="mailto:legal@worksphere.app"
                className="text-emerald-700 underline font-bold"
              >
                legal@worksphere.app
              </a>
            </p>
            <p>
              Support:{' '}
              <a
                href="mailto:support@worksphere.app"
                className="text-emerald-700 underline font-bold"
              >
                support@worksphere.app
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqAccordion
        items={termsFaqs}
        title="Frequently Asked Questions"
        description="Common questions regarding our Terms of Service, ownership, and platform commitments."
      />
    </PolicyPageLayout>
  );
};

export default TermsOfServicePage;
