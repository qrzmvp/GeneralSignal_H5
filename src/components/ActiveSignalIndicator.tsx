import React from 'react';
import { cn } from '@/lib/utils';

interface ActiveSignalIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelText?: string;
  className?: string;
}

export function ActiveSignalIndicator({ 
  size = 'md', 
  showLabel = true, 
  labelText = '有效',
  className 
}: ActiveSignalIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5', 
    lg: 'w-3 h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* 脉冲信号灯 */}
      <div 
        className={cn(
          "signal-light pulsing-light rounded-full bg-green-400",
          sizeClasses[size]
        )}
      />
      
      {/* "有效"文字标识 */}
      {showLabel && (
        <span className={cn(
          "font-medium text-green-400",
          textSizeClasses[size]
        )}>
          {labelText}
        </span>
      )}
    </div>
  );
}

export default ActiveSignalIndicator;