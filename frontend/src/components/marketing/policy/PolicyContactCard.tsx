import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PolicyContactCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  email: string;
  secondaryEmail?: string;
  secondaryLabel?: string;
}

export const PolicyContactCard: React.FC<PolicyContactCardProps> = ({
  icon: Icon,
  title,
  description,
  email,
  secondaryEmail,
  secondaryLabel,
}) => {
  return (
    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
        <Icon className="w-4 h-4 text-emerald-700" />
        <span>{title}</span>
      </div>
      <p className="text-xs text-emerald-950/80 leading-relaxed">{description}</p>
      <div className="pt-1 space-y-1.5">
        <div>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003629] hover:underline font-mono"
          >
            {email} &rarr;
          </a>
        </div>
        {secondaryEmail && (
          <div>
            {secondaryLabel && (
              <span className="block text-[11px] text-emerald-800 font-semibold mb-0.5">
                {secondaryLabel}:
              </span>
            )}
            <a
              href={`mailto:${secondaryEmail}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003629] hover:underline font-mono"
            >
              {secondaryEmail} &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyContactCard;
