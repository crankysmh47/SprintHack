// components/TrustBadge.tsx

'use client';

import { cn, getTrustColor, getTrustBgColor, getTrustLabel } from '@/lib/utils';
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface TrustBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TrustBadge({ score, size = 'md', showLabel = false }: TrustBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const iconSize = { sm: 12, md: 16, lg: 20 };

  const Icon = score >= 0.8
    ? ShieldCheck
    : score >= 0.4
      ? Shield
      : score >= 0.2
        ? ShieldQuestion
        : ShieldAlert;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        sizeClasses[size],
        getTrustBgColor(score),
        getTrustColor(score)
      )}
    >
      <Icon size={iconSize[size]} />
      <span>{Math.round(score * 100)}%</span>
      {showLabel && (
        <span className="opacity-75 font-normal">· {getTrustLabel(score)}</span>
      )}
    </div>
  );
}