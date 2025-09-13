import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HistoricalBadgeProps {
  children: React.ReactNode;
  className?: string;
  orderType?: string; // 新增：用于订单类型的视觉区分
}

/**
 * HistoricalBadge 组件
 * 专门用于历史信号的标签显示，使用浅色样式强化历史信号已过期的视觉感受
 * 参考了 my-account 页面中历史挂单的处理方式
 */
function HistoricalBadge({ children, className, orderType }: HistoricalBadgeProps) {
  // 为订单类型添加特殊的颜色区分
  const getOrderTypeStyles = () => {
    if (orderType && children === orderType) {
      if (orderType === '市价单') {
        return 'bg-orange-100/30 text-orange-600/70 border-orange-200/50 hover:bg-orange-100/40';
      } else if (orderType === '限价单') {
        return 'bg-blue-100/30 text-blue-600/70 border-blue-200/50 hover:bg-blue-100/40';
      }
    }
    return null;
  };

  const orderTypeStyles = getOrderTypeStyles();

  return (
    <Badge 
      variant="outline" 
      className={cn(
        // 基础浅色样式（如果不是订单类型标签）
        !orderTypeStyles && "bg-muted/30 text-muted-foreground border-muted hover:bg-muted/40",
        // 订单类型特殊样式
        orderTypeStyles,
        // 通用样式
        "transition-colors px-2 py-0.5 text-xs",
        className
      )}
    >
      {children}
    </Badge>
  );
}

export default HistoricalBadge;