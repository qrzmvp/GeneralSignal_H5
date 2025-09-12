import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HistoricalBadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * HistoricalBadge 组件
 * 专门用于历史信号的标签显示，使用浅色样式强化历史信号已过期的视觉感受
 * 参考了 my-account 页面中历史挂单的处理方式
 */
function HistoricalBadge({ children, className }: HistoricalBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        // 基础浅色样式
        "bg-muted/30 text-muted-foreground border-muted",
        // 悬停效果
        "hover:bg-muted/40 transition-colors",
        // 尺寸和间距
        "px-2 py-0.5 text-xs",
        className
      )}
    >
      {children}
    </Badge>
  );
}

export default HistoricalBadge;