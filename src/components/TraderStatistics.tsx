"use client"

import React, { useMemo } from 'react';
import { UnifiedSignal } from '@/lib/data';
import { 
  calculateAllStatistics, 
  formatStatisticValue, 
  TraderStatistics,
  formatPnlRatioFromNumber,
  formatWinRateFromNumber,
  formatYieldRateFromNumber
} from '@/lib/statistics';

interface MetricItemProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

function MetricItem({ label, value, valueClassName = "text-foreground" }: MetricItemProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

interface TraderStatisticsDisplayProps {
  signals: UnifiedSignal[];
  className?: string;
  yieldRate?: number | null; // 收益率（可选）
  followers?: number | null; // 跟单数量（可选）
  // 可选的固定统计数据，用于覆盖实时计算结果
  overrideStats?: {
    winRate?: number | null;
    pnlRatio?: number | null;
    yieldRate?: number | null;  // 计算出的真实收益率
    totalSignals?: number | null;
  };
}

const TraderStatisticsDisplay: React.FC<TraderStatisticsDisplayProps> = ({ 
  signals, 
  className = "",
  yieldRate,
  followers,
  overrideStats
}) => {
  // 使用 useMemo 缓存统计计算结果，避免每次渲染都重新计算
  const statistics = useMemo(() => {
    if (signals.length === 0) {
      return {
        winRate: 0,
        pnlRatio: '--',
        totalSignals: 0,
        totalDays: 0,
        totalProfit: 0,
        totalLoss: 0,
        historicalSignals: 0,
        currentSignals: 0
      } as TraderStatistics;
    }
    
    return calculateAllStatistics(signals);
  }, [signals]);

  // 格式化显示值
  const formattedValues = useMemo(() => {
    // 如果提供了覆盖统计数据，优先使用数据库中的固定值
    if (overrideStats) {
      return {
        winRate: overrideStats.winRate !== undefined 
          ? formatWinRateFromNumber(overrideStats.winRate) 
          : formatStatisticValue('winRate', statistics.winRate),
        pnlRatio: overrideStats.pnlRatio !== undefined 
          ? formatPnlRatioFromNumber(overrideStats.pnlRatio) 
          : formatStatisticValue('pnlRatio', statistics.pnlRatio),
        totalSignals: overrideStats.totalSignals !== undefined 
          ? overrideStats.totalSignals.toString() 
          : formatStatisticValue('totalSignals', statistics.totalSignals),
        totalDays: formatStatisticValue('totalDays', statistics.totalDays)
      };
    }
    
    // 否则使用实时计算的统计数据
    return {
      winRate: formatStatisticValue('winRate', statistics.winRate),
      pnlRatio: formatStatisticValue('pnlRatio', statistics.pnlRatio),
      totalSignals: formatStatisticValue('totalSignals', statistics.totalSignals),
      totalDays: formatStatisticValue('totalDays', statistics.totalDays)
    };
  }, [statistics, overrideStats]);

  const displayClassName = `grid grid-cols-3 gap-y-4 pt-6 text-center ${className}`;
  
  // 收益率显示逻辑：优先使用计算出的真实收益率
  const yieldValue = overrideStats?.yieldRate !== undefined 
    ? formatYieldRateFromNumber(overrideStats.yieldRate)
    : (yieldRate !== undefined && yieldRate !== null ? `+${yieldRate}%` : '--');
  const followersValue = followers !== undefined && followers !== null ? followers.toString() : '--';

  return (
    <div className={displayClassName}>
      <MetricItem 
        label="收益率" 
        value={yieldValue} 
        valueClassName="text-green-400" 
      />
      <MetricItem 
        label="胜率" 
        value={formattedValues.winRate} 
        valueClassName="text-foreground" 
      />
      <MetricItem 
        label="盈亏比" 
        value={formattedValues.pnlRatio} 
        valueClassName="text-foreground" 
      />
      <MetricItem 
        label="累计信号" 
        value={formattedValues.totalSignals} 
        valueClassName="text-foreground" 
      />
      <MetricItem 
        label="累计跟单" 
        value={followersValue} 
        valueClassName="text-foreground" 
      />
      <MetricItem 
        label="累计天数(天)" 
        value={formattedValues.totalDays} 
        valueClassName="text-foreground" 
      />
    </div>
  );
};

export default TraderStatisticsDisplay;