import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatarInitials: string;
  metric: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Managing 6 concurrent client projects used to require 3 separate tools. WorkSphere unified our Gantt timelines and developer Kanban boards into one single source of truth.",
    name: 'Alex Chen',
    role: 'Senior Project Manager',
    company: 'Apex Cloud Systems',
    avatarInitials: 'AC',
    metric: 'Saved 8h/week on status meetings'
  },
  {
    quote:
      "The sprint backlog and personal 'My Work' dashboard cut our standup overhead in half. No sluggish bloat — it's fast, focused, and intuitive for engineering squads.",
    name: 'Sarah Jenkins',
    role: 'Full-Stack Tech Lead',
    company: 'Horizon Technologies',
    avatarInitials: 'SJ',
    metric: 'Zero context switching'
  },
  {
    quote:
      "The built-in task timers with billable rates and 1-click invoice exports saved our boutique consultancy over $5,000 a year on third-party time tracking subscriptions.",
    name: 'Carlos Mendez',
    role: 'Founder & Principal Consultant',
    company: 'StudioMetric Agency',
    avatarInitials: 'CM',
    metric: '$5k+ saved annually on SaaS'
  }
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-14 md:py-18 bg-slate-50/60 border-y border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-xs uppercase font-bold tracking-widest text-[#006C4B]">
            Customer Stories
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-[-0.03em]">
            Trusted by teams delivering complex work
          </h2>
        </div>

        {/* Spacious 3-Column Editorial Quotes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006C4B] border border-emerald-200/80 inline-block">
                  {item.metric}
                </span>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#003629] text-[#64F9BC] flex items-center justify-center font-bold text-xs shadow-2xs">
                  {item.avatarInitials}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-none">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.role} • {item.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
