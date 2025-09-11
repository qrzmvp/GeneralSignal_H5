import { useState, useEffect, useMemo, useCallback } from 'react';
import { UnifiedSignal } from '@/lib/data';
import { TraderStatistics, calculateAllStatistics } from '@/lib/statistics';

interface UseTraderStatisticsOptions {
  signals: UnifiedSignal[];
  autoUpdate?: boolean;
  updateInterval?: number; // 更新间隔（毫秒）
}

interface UseTraderStatisticsReturn {
  statistics: TraderStatistics;
  isLoading: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

/**
 * 交易员统计数据 Hook
 * 支持实时更新和缓存机制
 */
export const useTraderStatistics = ({
  signals,
  autoUpdate = false,
  updateInterval = 60000 // 默认1分钟更新一次
}: UseTraderStatisticsOptions): UseTraderStatisticsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 使用 useMemo 缓存统计计算结果
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

  // 手动刷新函数
  const refresh = useCallback(() => {
    setIsLoading(true);
    // 模拟异步更新
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 500);
  }, []);

  // 自动更新机制
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      refresh();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval, refresh]);

  // 初始化时设置更新时间
  useEffect(() => {
    if (signals.length > 0 && !lastUpdated) {
      setLastUpdated(new Date());
    }
  }, [signals.length, lastUpdated]);

  return {
    statistics,
    isLoading,
    lastUpdated,
    refresh
  };
};

/**
 * 防抖统计计算 Hook
 * 防止在信号频繁变化时过度计算
 */
export const useDebouncedStatistics = (
  signals: UnifiedSignal[], 
  delay: number = 300
): TraderStatistics => {
  const [debouncedSignals, setDebouncedSignals] = useState(signals);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSignals(signals);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [signals, delay]);

  return useMemo(() => {
    if (debouncedSignals.length === 0) {
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
    
    return calculateAllStatistics(debouncedSignals);
  }, [debouncedSignals]);
};