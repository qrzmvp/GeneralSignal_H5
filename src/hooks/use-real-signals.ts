import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedSignal } from '@/lib/data';
import { getTraderSignals, RealTimeTraderStats, calculateRealTimeStats } from '@/lib/signals';

interface UseRealSignalsOptions {
  traderId: string;
  enabled?: boolean;
  refreshInterval?: number; // 刷新间隔（毫秒）
}

interface UseRealSignalsReturn {
  signals: UnifiedSignal[];
  stats: RealTimeTraderStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

/**
 * 真实信号数据 Hook
 * 从数据库获取真实的信号数据并计算统计指标
 */
export const useRealSignals = ({
  traderId,
  enabled = true,
  refreshInterval = 300000 // 默认5分钟刷新一次
}: UseRealSignalsOptions): UseRealSignalsReturn => {
  const [signals, setSignals] = useState<UnifiedSignal[]>([]);
  const [stats, setStats] = useState<RealTimeTraderStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // 获取信号数据
  const fetchSignals = useCallback(async () => {
    if (!mountedRef.current || !traderId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 并行获取信号数据和统计数据
      const [signalsResult, statsResult] = await Promise.all([
        getTraderSignals(traderId),
        calculateRealTimeStats(traderId)
      ]);
      
      if (!mountedRef.current) return;
      
      if (signalsResult.error) {
        setError(signalsResult.error);
        return;
      }
      
      if (statsResult.error) {
        console.warn('Stats calculation failed:', statsResult.error);
        // 即使统计计算失败，也显示信号数据
      }
      
      setSignals(signalsResult.signals);
      setStats(statsResult.stats);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : '获取信号数据失败';
      setError(errorMessage);
      console.error('Failed to fetch real signals:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [traderId]);

  // 手动刷新
  const refresh = useCallback(() => {
    fetchSignals();
  }, [fetchSignals]);

  // 初始加载
  useEffect(() => {
    if (!traderId || !enabled) {
      setSignals([]);
      setStats(null);
      return;
    }
    
    fetchSignals();
  }, [traderId, enabled, fetchSignals]);

  // 设置定期刷新
  useEffect(() => {
    if (!enabled || !refreshInterval || !traderId) return;

    intervalRef.current = setInterval(() => {
      fetchSignals();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, refreshInterval, fetchSignals, traderId]);

  // 清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    signals,
    stats,
    isLoading,
    error,
    lastUpdated,
    refresh
  };
};