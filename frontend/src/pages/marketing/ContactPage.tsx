import React, { useState } from 'react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ChevronDown,
  FileText,
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react';

interface DirectChannel {
  title: string;
  description: string;
  contact: string;
  href: string;
  icon: React.ElementType;
  actionText: string;
  isExternal?: boolean;
}

const directChannels: DirectChannel[] = [
  {
    title: 'Email Support',
    description: 'Direct line to our engineering and product team for any inquiries.',
    contact: 'support@worksphere.app',
    href: 'mailto:support@worksphere.app',
    icon: Mail,
    actionText: 'Send email'
  },
  {
    title: 'Community Server',
    description: 'Chat directly with fellow engineering leads, developers, and maintainers.',
    contact: 'discord.gg/worksphere',
    href: 'https://discord.gg',
    icon: MessageSquare,
    actionText: 'Join Discord',
    isExternal: true
  },
  {
    title: 'Security & Privacy',
    description: 'SOC2 reports, security questionnaires, and vulnerability disclosures.',
    contact: 'security@worksphere.app',
    href: 'mailto:security@worksphere.app',
    icon: ShieldCheck,
    actionText: 'Security team'
  }
];

const categories = [
  'General Inquiry',
  'Technical Support',
  'Enterprise & Self-Hosting',
  'Feature Suggestion',
  'Bug Report'
];

interface FaqItem {
  question: string;
  answer: string;
}

const contactFaqs: FaqItem[] = [
  {
    question: 'How quickly will I receive a reply?',
    answer: 'Our core team reviews incoming messages Monday through Friday with an average response time under 2 hours, and within 24 hours on weekends. Critical security reports are addressed immediately.'
  },
  {
    question: 'Can you assist with migrating from Jira, Asana, or Trello?',
    answer: 'Yes! WorkSphere provides native CSV mapping and automated import tooling for tasks, custom fields, and sprints. For enterprise teams, our team can provide guided migration assistance.'
  },
  {
    question: 'Can we test WorkSphere self-hosted on our private VPC?',
    answer: 'Absolutely. WorkSphere supports Docker Compose and Kubernetes Helm chart deployments with isolated multi-tenancy. Check our documentation or reach out for private deployment manifests.'
  },
  {
    question: 'Where can I report a suspected vulnerability or security concern?',
    answer: 'Please send security disclosures directly to security@worksphere.app with PGP encryption if preferred. We acknowledge vulnerability submissions within 12 hours.'
  }
];

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    message: ''
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      category: 'General Inquiry',
      message: ''
    });
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <MarketingLayout>
      <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-20">
        
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Support Online · Typical response &lt; 2 hrs</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-display">
            Let’s start a conversation.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Have questions about WorkSphere, need technical assistance, or want to explore enterprise self-hosting? Reach out directly or drop us a message.
          </p>
        </div>

        {/* Direct Channel Cards (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {directChannels.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <a
                key={idx}
                href={channel.href}
                target={channel.isExternal ? '_blank' : undefined}
                rel={channel.isExternal ? 'noopener noreferrer' : undefined}
                className="group p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors">
                      {channel.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      {channel.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                  <span className="font-mono text-slate-600">{channel.contact}</span>
                  <span className="inline-flex items-center gap-1">
                    {channel.actionText}
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Form and High-Trust Context Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Lightweight Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-slate-200/90 shadow-xs">
            {submitted ? (
              <div className="text-center py-12 px-4 space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 font-display">
                    Message Received
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out, <span className="font-semibold text-slate-800">{formData.name || 'there'}</span>! We’ve logged your message under <span className="font-medium text-emerald-700 font-mono text-xs px-2 py-0.5 bg-emerald-50 rounded-md">{formData.category}</span> and will reply to <span className="font-semibold text-slate-800">{formData.email}</span> within 24 hours.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Send another message</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display tracking-tight">
                    Send us a note
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill out the fields below and our engineering team will get back to you shortly.
                  </p>
                </div>

                {/* Inquiry Category Pills */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    What can we help you with?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          formData.category === cat
                            ? 'bg-[#003629] text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Alex Morgan"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-colors"
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your team setup, questions, or requirements..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-colors resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#003629] hover:bg-[#004D3A] text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Support Expectations & Security */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Expectations Card */}
            <div className="bg-[#FAFBF9] p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Response Commitments</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Monday – Friday:</strong> Average response time within 2 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Direct Maintainer Replies:</strong> You talk directly to engineers, not generic bots.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Unsolicited Sales:</strong> We do not sell your email or add you to marketing drip sequences.</span>
                </li>
              </ul>
            </div>

            {/* Quick Resources Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Self-Service Resources</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Looking for immediate answers before sending a message? Explore our documentation:
              </p>
              <div className="space-y-2 pt-1 text-xs font-semibold">
                <a
                  href="/docs"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Architecture & Deployment Docs</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="/pricing"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Tier Breakdown & Feature Matrix</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Security Guarantee Badge */}
            <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Enterprise Data Isolation & Privacy</span>
              </div>
              <p className="text-xs text-emerald-950/70 leading-relaxed">
                All communications and customer data within WorkSphere are secured with TLS 1.3 transport encryption. Multi-tenant customer databases are strictly partitioned with schema-level isolation.
              </p>
            </div>

          </div>

        </div>

        {/* Mini FAQ Section */}
        <div className="pt-8 border-t border-slate-200/80 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#006C4B]">
              Quick Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Common questions about contacting our team and getting support.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {contactFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/80 bg-white overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
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

      </div>
    </MarketingLayout>
  );
};

export default ContactPage;
