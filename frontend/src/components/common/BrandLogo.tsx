import React, { useId } from 'react';
import { Link } from 'react-router-dom';

export interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * Concept 2: The Infinity Ribbon (W-S Monogram)
 * An isometric continuous ribbon forming a unified W and S loop in a radiant emerald-to-mint gradient.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  className = 'w-6 h-6',
  title = 'WorkSphere Logo',
}) => {
  const id = useId().replace(/:/g, '-');

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id={`ws-grad-ribbon-${id}`}
          x1="8"
          y1="14"
          x2="56"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#64F9BC" />
          <stop offset="40%" stopColor="#34D399" />
          <stop offset="75%" stopColor="#059669" />
          <stop offset="100%" stopColor="#004D36" />
        </linearGradient>

        <linearGradient
          id={`ws-grad-depth-${id}`}
          x1="14"
          y1="48"
          x2="52"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00261D" />
          <stop offset="100%" stopColor="#004D36" />
        </linearGradient>
      </defs>

      {/* Under-pass loop: provides 3D depth to the infinity weave */}
      <path
        d="M16 40 C14 26, 26 20, 34 29 C40 37, 48 40, 52 32 C55 26, 52 18, 44 18"
        stroke={`url(#ws-grad-depth-${id})`}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Foreground continuous ribbon forming the iconic W & S fold */}
      <path
        d="M10 22 C13 14, 21 15, 23 25 L28 43 C29.5 48, 33.5 48, 35 43 L40 28 C42 22, 47 21, 51 26 C55 31, 53 43, 44 46 C35 49, 29 39, 22 39 C15 39, 11 32, 10 22 Z"
        fill={`url(#ws-grad-ribbon-${id})`}
      />

      {/* Dynamic Apex Highlight: creates crisp lighting along the fold */}
      <path
        d="M23 25 L28 43 C29 46.5, 31.5 47, 33 44"
        stroke="#A7F3D0"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Focal Milestone Spark */}
      <circle cx="51" cy="26" r="2.2" fill="#FFFFFF" />
      <circle cx="51" cy="26" r="4.5" fill="#64F9BC" opacity="0.4" />
    </svg>
  );
};

export interface BrandLogoProps {
  /**
   * - 'full': Icon mark + 'WorkSphere' wordmark + subtitle
   * - 'compact': Icon mark + 'WorkSphere' wordmark (single line)
   * - 'mark': Standalone icon mark only
   */
  variant?: 'full' | 'compact' | 'mark';
  /**
   * Predefined size presets
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Surface theme:
   * - 'auto': Uses theme-adaptive semantic typography
   * - 'light': Dark text for crisp display on white/light surfaces
   * - 'dark': Light text for dark containers / dark mode
   */
  theme?: 'auto' | 'light' | 'dark';
  /**
   * Custom subtitle override (defaults to 'Work Operating System' when variant is 'full')
   */
  subtitle?: string;
  showSubtitle?: boolean;
  /**
   * If provided, wraps the logo in a React Router <Link>
   */
  to?: string;
  className?: string;
  iconContainerClassName?: string;
}

const sizeConfig = {
  xs: {
    container: 'w-6 h-6 rounded-md p-0.5',
    icon: 'w-full h-full',
    text: 'text-sm',
    dot: 'w-1 h-1',
    subtitle: 'text-[9px]',
    gap: 'gap-2',
  },
  sm: {
    container: 'w-8 h-8 rounded-lg p-1',
    icon: 'w-full h-full',
    text: 'text-base',
    dot: 'w-1.5 h-1.5',
    subtitle: 'text-[9px]',
    gap: 'gap-2.5',
  },
  md: {
    container: 'w-10 h-10 rounded-xl p-1.5',
    icon: 'w-full h-full',
    text: 'text-xl',
    dot: 'w-1.5 h-1.5',
    subtitle: 'text-[10px]',
    gap: 'gap-3',
  },
  lg: {
    container: 'w-12 h-12 rounded-2xl p-2',
    icon: 'w-full h-full',
    text: 'text-2xl',
    dot: 'w-2 h-2',
    subtitle: 'text-xs',
    gap: 'gap-3.5',
  },
  xl: {
    container: 'w-16 h-16 rounded-2xl p-2.5',
    icon: 'w-full h-full',
    text: 'text-3xl',
    dot: 'w-2.5 h-2.5',
    subtitle: 'text-sm',
    gap: 'gap-4',
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  size = 'md',
  theme = 'auto',
  subtitle = 'Work Operating System',
  showSubtitle = true,
  to,
  className = '',
  iconContainerClassName = '',
}) => {
  const cfg = sizeConfig[size] || sizeConfig.md;

  const textColorClass =
    theme === 'light'
      ? 'text-slate-900'
      : theme === 'dark'
      ? 'text-white'
      : 'text-text-primary';

  const subtitleColorClass =
    theme === 'light'
      ? 'text-[#006C4B]'
      : theme === 'dark'
      ? 'text-emerald-400'
      : 'text-brand-secondary';

  const dotColorClass =
    theme === 'dark'
      ? 'bg-[#64F9BC] shadow-[0_0_6px_#64F9BC]'
      : 'bg-[#006C4B]';

  const content = (
    <div className={`inline-flex items-center ${cfg.gap} group select-none ${className}`}>
      {/* Icon Badge Container */}
      <div
        className={`bg-[#003629] border border-[#34D399]/40 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 ${cfg.container} ${iconContainerClassName}`}
      >
        <BrandMark className={cfg.icon} />
      </div>

      {/* Wordmark & Optional Subtitle */}
      {variant !== 'mark' && (
        <div className="flex flex-col">
          <span
            className={`font-display font-bold tracking-tight leading-none flex items-center gap-1.5 ${cfg.text} ${textColorClass}`}
          >
            WorkSphere
            <span className={`rounded-full shrink-0 ${cfg.dot} ${dotColorClass}`} />
          </span>

          {variant === 'full' && showSubtitle && (
            <span
              className={`uppercase font-bold tracking-widest font-mono mt-1 ${cfg.subtitle} ${subtitleColorClass}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="focus:outline-hidden inline-flex items-center"
        aria-label="WorkSphere Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
