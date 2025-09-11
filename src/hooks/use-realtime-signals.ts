import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedSignal } from '@/lib/data';

interface UseRealtimeSignalsOptions {
  traderId: string;
  enabled?: boolean;
  refreshInterval?: number; // 刷新间隔（毫秒）
}

interface UseRealtimeSignalsReturn {
  signals: UnifiedSignal[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

/**
 * 实时信号数据 Hook
 * 支持自动刷新和手动刷新
 */
export const useRealtimeSignals = ({
  traderId,
  enabled = true,
  refreshInterval = 60000 // 默认1分钟刷新一次
}: UseRealtimeSignalsOptions): UseRealtimeSignalsReturn => {
  const [signals, setSignals] = useState<UnifiedSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // 生成模拟信号数据（在实际项目中这里会连接Supabase）
  const generateSignals = useCallback((): UnifiedSignal[] => {
    // 生成当前信号
    const currentSignals = Array.from({ length: 25 }, (_, i) => {
      const isLong = Math.random() > 0.5;
      const pair = ['BTC', 'ETH', 'SOL', 'DOGE'][Math.floor(Math.random() * 4)];
      const entryPrice = Math.random() * 50000 + 20000;
      const useRange = Math.random() > 0.7;
      return {
        id: i + 1,
        signalType: 'current' as const,
        pair: `${pair}-USDT-SWAP`,
        direction: isLong ? '做多' : '做空',
        directionColor: isLong ? 'text-green-400' : 'text-red-400',
        entryPrice: useRange ? `${(entryPrice * 0.99).toFixed(2)}-${(entryPrice * 1.01).toFixed(2)}` : entryPrice.toFixed(2),
        takeProfit1: i % 4 === 0 ? null : (entryPrice * (isLong ? 1.02 : 0.98)).toFixed(2),
        takeProfit2: i % 5 === 0 ? null : (entryPrice * (isLong ? 1.04 : 0.96)).toFixed(2),
        stopLoss: (entryPrice * (isLong ? 0.99 : 1.01)).toFixed(2),
        pnlRatio: `${(Math.random() * 5 + 1).toFixed(1)}:1`,
        createdAt: `2024-05-2${8-i} 14:0${i % 10}:00`,
        orderType: '限价单',
        contractType: '永续合约',
        marginMode: '全仓',
      };
    });

    // 生成历史信号
    const historicalSignals = Array.from({ length: 30 }, (_, i) => {
      const isLong = Math.random() > 0.5;
      const pair = ['ADA', 'XRP', 'BNB', 'LINK'][Math.floor(Math.random() * 4)];
      const entryPrice = Math.random() * 500 + 100;
      const startDate = new Date(2024, 3, 18 - (i % 9), 18, 30 + (i % 10), 0);
      const endDate = new Date(startDate.getTime() + (Math.random() * 72 + 8) * 60 * 60 * 1000);
      const formatDate = (date: Date) => date.toISOString().replace('T', ' ').substring(0, 19);

      return {
        id: i + 100,
        signalType: 'historical' as const,
        pair: `${pair}-USDT-SWAP`,
        direction: isLong ? '做多' : '做空',
        directionColor: isLong ? 'text-green-400' : 'text-red-400',
        entryPrice: entryPrice.toFixed(3),
        takeProfit1: (entryPrice * (isLong ? 1.05 : 0.95)).toFixed(3),
        takeProfit2: (entryPrice * (isLong ? 1.10 : 0.90)).toFixed(3),
        stopLoss: (entryPrice * (isLong ? 0.98 : 1.02)).toFixed(3),
        pnlRatio: `${(Math.random() * 5 + 1).toFixed(1)}:1`,
        createdAt: formatDate(startDate),
        endedAt: formatDate(endDate),
        orderType: '限价单',
        contractType: '永续合约',
        marginMode: '全仓',
        status: Math.random() > 0.3 ? '止盈平仓' : '止损平仓',
      };
    });

    // 合并并按时间排序
    return [...currentSignals, ...historicalSignals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  // 获取信号数据
  const fetchSignals = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 模拟异步获取数据
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!mountedRef.current) return;
      
      const newSignals = generateSignals();
      setSignals(newSignals);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      
      setError(err instanceof Error ? err.message : '获取信号数据失败');
      console.error('Failed to fetch signals:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [generateSignals]);

  // 手动刷新
  const refresh = useCallback(() => {
    fetchSignals();
  }, [fetchSignals]);

  // 初始加载
  useEffect(() => {
    if (!traderId || !enabled) return;
    
    fetchSignals();
  }, [traderId, enabled, fetchSignals]);

  // 设置定期刷新
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    intervalRef.current = setInterval(() => {
      fetchSignals();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, refreshInterval, fetchSignals]);

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
    isLoading,
    error,
    lastUpdated,
    refresh
  };
};

/**
 * 信号变化监听 Hook
 * 检测信号数组的变化并触发回调
 */
export const useSignalChanges = (
  signals: UnifiedSignal[],
  onChanged?: (changes: { added: UnifiedSignal[]; removed: UnifiedSignal[]; updated: UnifiedSignal[] }) => void
) => {
  const prevSignalsRef = useRef<UnifiedSignal[]>([]);

  useEffect(() => {
    if (!onChanged) return;

    const prevSignals = prevSignalsRef.current;
    const currentSignals = signals;

    // 检测新增的信号
    const added = currentSignals.filter(current => 
      !prevSignals.some(prev => prev.id === current.id)
    );

    // 检测移除的信号
    const removed = prevSignals.filter(prev => 
      !currentSignals.some(current => current.id === prev.id)
    );

    // 检测更新的信号（简单比较）
    const updated = currentSignals.filter(current => {
      const prev = prevSignals.find(p => p.id === current.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(current);
    });

    if (added.length > 0 || removed.length > 0 || updated.length > 0) {
      onChanged({ added, removed, updated });
    }

    prevSignalsRef.current = [...currentSignals];
  }, [signals, onChanged]);
};