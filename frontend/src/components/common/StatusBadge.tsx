import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, ShieldAlert, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normStatus = (status || 'IN_PROGRESS').toUpperCase();

  let config = {
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Clock,
    label: 'IN PROGRESS',
  };

  if (normStatus === 'CLEARED') {
    config = {
      bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
      icon: CheckCircle2,
      label: 'CLEARED',
    };
  } else if (normStatus === 'REFER_SECONDARY') {
    config = {
      bg: 'bg-amber-950/60 text-amber-300 border-amber-800',
      icon: AlertCircle,
      label: 'SECONDARY INSPECTION',
    };
  } else if (normStatus === 'REJECTED') {
    config = {
      bg: 'bg-rose-950/60 text-rose-300 border-rose-800',
      icon: XCircle,
      label: 'ENTRY REJECTED',
    };
  } else if (normStatus === 'DETAINED') {
    config = {
      bg: 'bg-red-950 text-red-400 border-red-700 font-bold animate-pulse',
      icon: ShieldAlert,
      label: 'DETAIN SUBJECT',
    };
  }

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded-md border ${config.bg} ${sizeClasses}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
