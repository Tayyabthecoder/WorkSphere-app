import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  isOnline,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  };

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block" {...props}>
      <div
        className={twMerge(
          clsx(
            'rounded-full flex items-center justify-center font-bold overflow-hidden select-none bg-brand-emerald text-white border-2 border-white shadow-xs',
            sizeStyles[size],
            className
          )
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
