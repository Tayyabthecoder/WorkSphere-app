import React, { useState } from 'react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  Send,
  CheckCircle2,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

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
    subject: '',
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
      subject: '',
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
            Have questions about WorkSphere, need technical assistance, or want to explore enterprise self-hosting? Drop us a message below.
          </p>
        </div>

        {/* Clean, Cardless Contact Form Container */}
        <div className="max-w-2xl mx-auto w-full bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-slate-200/90 shadow-xs">
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
                  Thank you for reaching out, <span className="font-semibold text-slate-800">{formData.name || 'there'}</span>! We’ve received your message regarding <span className="font-medium text-emerald-700 font-mono text-xs px-2 py-0.5 bg-emerald-50 rounded-md">{formData.subject || 'your inquiry'}</span> and will reply to <span className="font-semibold text-slate-800">{formData.email}</span> within 24 hours.
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

              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Name
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
                    Email
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

              {/* Subject Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="How can we help you?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-colors"
                />
              </div>

              {/* Message Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
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

        {/* FAQs Section */}
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
