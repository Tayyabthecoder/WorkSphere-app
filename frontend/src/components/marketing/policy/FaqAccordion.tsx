import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  label?: string;
  title?: string;
  description?: string;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({
  items,
  label = 'Quick Answers',
  title = 'Frequently Asked Questions',
  description,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="section-faqs" className="pt-8 border-t border-slate-200 space-y-6">
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-widest text-[#006C4B]">
          {label}
        </span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600">{description}</p>
        )}
      </div>

      <div className="space-y-3">
        {items.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-xl border border-slate-200/80 bg-white overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleIndex(index)}
                aria-expanded={isOpen}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <span className="text-sm font-bold text-slate-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-300 ease-in-out ${
                    isOpen ? 'rotate-180 text-emerald-700' : ''
                  }`}
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-[#FAFBF9]">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FaqAccordion;
