import { useState } from 'react';
import { getInitials } from '../utils/formatters';

interface SantriAvatarProps {
  src?: string;
  name: string;
  sizeClass?: string;
  textClass?: string;
  roundedClass?: string;
}

export function SantriAvatar({
  src,
  name,
  sizeClass = 'w-10 h-10',
  textClass = 'text-xs',
  roundedClass = 'rounded-lg',
}: SantriAvatarProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} flex shrink-0 items-center justify-center bg-emerald-50 font-semibold text-emerald-800 border border-emerald-200 select-none ${textClass}`}
        aria-label={name}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${sizeClass} ${roundedClass} shrink-0 object-cover border border-slate-200 bg-slate-100`}
    />
  );
}
