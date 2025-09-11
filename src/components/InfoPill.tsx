import React from 'react';
import { cn } from '@/lib/utils';

interface InfoPillProps {
  label: string;
  value: string | number | null | undefined;
  action?: React.ReactNode;
  variant?: 'default' | 'highlighted';
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function InfoPill({ 
  label, 
  value, 
  action,
  variant = 'default',
  className,
  labelClassName,
  valueClassName
}: InfoPillProps) {
  const baseClasses = "flex items-center justify-between text-sm py-2";
  
  const labelClasses = cn(
    variant === 'highlighted' ? 'text-foreground' : 'text-muted-foreground',
    labelClassName
  );
  
  const valueClasses = cn(
    'font-medium',
    variant === 'highlighted' ? 'text-foreground' : 'text-foreground',
    valueClassName
  );

  return (
    <div className={cn(baseClasses, className)}>
      <span className={labelClasses}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={valueClasses}>{value || '--'}</span>
        {action}
      </div>
    </div>
  );
}

export default InfoPill;