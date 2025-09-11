"use client"

import React from 'react';
import { Crown, Shield, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

// 会员等级类型定义
export type MembershipLevel = 'free' | 'basic' | 'pro' | 'vip';

// 组件属性接口
export interface MembershipBadgeProps {
  level: MembershipLevel;
  membershipType?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

// 会员配置系统
interface MembershipConfig {
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    background: string;
    text: string;
    border?: string;
  };
  effects?: {
    gradient?: string;
    glow?: string;
    animation?: string;
  };
}

// 会员等级配置映射
const MEMBERSHIP_CONFIGS: Record<Exclude<MembershipLevel, 'free'>, MembershipConfig> = {
  basic: {
    icon: Shield,
    colors: {
      background: 'bg-membership-basic-400',
      text: 'text-membership-basic-900',
      border: 'border-membership-basic-500',
    },
    effects: {
      glow: 'shadow-membership-basic',
    },
  },
  pro: {
    icon: Crown,
    colors: {
      background: 'bg-membership-pro-400',
      text: 'text-membership-pro-900',
      border: 'border-membership-pro-500',
    },
    effects: {
      glow: 'shadow-membership-pro membership-hover-pro',
    },
  },
  vip: {
    icon: Gem,
    colors: {
      background: 'membership-gradient-vip',
      text: 'text-membership-vip-100',
      border: 'border-membership-vip-500',
    },
    effects: {
      gradient: 'membership-gradient-vip',
      glow: 'shadow-membership-vip membership-glow-vip',
    },
  },
};

// 尺寸配置
const SIZE_CONFIGS = {
  sm: {
    container: 'text-xs px-2 py-0.5',
    icon: 'w-3 h-3', 
    text: 'text-xs',
  },
  md: {
    container: 'text-sm px-2.5 py-1',
    icon: 'w-3.5 h-3.5',
    text: 'text-sm',
  },
  lg: {
    container: 'text-base px-3 py-1.5',
    icon: 'w-4 h-4',
    text: 'text-base',
  },
};

export function MembershipBadge({
  level,
  membershipType,
  size = 'md',
  showText = true,
  className,
}: MembershipBadgeProps) {
  // 如果是免费用户，不显示徽章
  if (level === 'free') {
    return null;
  }

  const config = MEMBERSHIP_CONFIGS[level];
  const sizeConfig = SIZE_CONFIGS[size];
  
  if (!config) {
    return null;
  }

  const { icon: IconComponent, colors, effects } = config;

  // 构建基础样式类
  const badgeClass = cn(
    // 基础样式
    'inline-flex items-center gap-1 rounded-full font-semibold',
    'border transition-all duration-200',
    
    // 尺寸样式
    sizeConfig.container,
    
    // 颜色样式
    colors.background,
    colors.text,
    colors.border,
    
    // 特效样式
    effects?.glow,
    effects?.animation,
    
    // 自定义样式
    className
  );

  // 显示文本内容
  const displayText = membershipType || level.toUpperCase();

  return (
    <span className={badgeClass}>
      <IconComponent className={sizeConfig.icon} />
      {showText && (
        <span className={sizeConfig.text}>
          {displayText}
        </span>
      )}
    </span>
  );
}

// 导出默认组件
export default MembershipBadge;