import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: string;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = true,
  size = 'md',
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  let config = {
    bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
    icon: ShieldCheck,
    label: 'LOW RISK',
  };

  if (normLevel === 'MEDIUM') {
    config = {
      bg: 'bg-amber-950/60 text-amber-400 border-amber-800',
      icon: AlertTriangle,
      label: 'MEDIUM RISK',
    };
  } else if (normLevel === 'HIGH') {
    config = {
      bg: 'bg-rose-950/70 text-rose-400 border-rose-800 animate-pulse',
      icon: AlertOctagon,
      label: 'HIGH RISK',
    };
  } else if (normLevel === 'MANUAL_REVIEW') {
    config = {
      bg: 'bg-sky-950/60 text-sky-400 border-sky-800',
      icon: HelpCircle,
      label: 'MANUAL REVIEW',
    };
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono ${config.bg} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-bold ml-1">({score})</span>
      )}
    </span>
  );
};
