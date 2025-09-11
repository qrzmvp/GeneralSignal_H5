import { supabase } from './supabase';
import { UnifiedSignal, CurrentSignal, HistoricalSignal } from './data';

export interface TraderSignalDB {
  id: string;
  trader_id: string;
  signal_type: 'current' | 'historical';
  pair: string;
  direction: '做多' | '做空';
  entry_price: string;
  take_profit_1: string | null;
  take_profit_2: string | null;
  stop_loss: string;
  suggested_pnl_ratio: string;
  order_type: string;
  contract_type: string;
  margin_mode: string;
  status: '止盈平仓' | '止损平仓' | '手动平仓' | null;
  created_at: string;
  ended_at: string | null;
  actual_exit_price: string | null;
  actual_pnl: number | null;
}

/**
 * 从数据库信号数据转换为前端统一信号格式
 */
export const convertDBSignalToUnified = (dbSignal: TraderSignalDB): UnifiedSignal => {
  const baseSignal = {
    id: parseInt(dbSignal.id.replace(/-/g, '').slice(-8), 16), // 简化ID
    pair: dbSignal.pair,
    direction: dbSignal.direction,
    directionColor: dbSignal.direction === '做多' ? 'text-green-400' : 'text-red-400',
    entryPrice: dbSignal.entry_price,
    takeProfit1: dbSignal.take_profit_1,
    takeProfit2: dbSignal.take_profit_2,
    stopLoss: dbSignal.stop_loss,
    pnlRatio: dbSignal.suggested_pnl_ratio,
    createdAt: formatSignalDate(dbSignal.created_at),
    orderType: dbSignal.order_type,
    contractType: dbSignal.contract_type,
    marginMode: dbSignal.margin_mode,
  };

  if (dbSignal.signal_type === 'current') {
    return {
      ...baseSignal,
      signalType: 'current'
    } as CurrentSignal;
  } else {
    return {
      ...baseSignal,
      signalType: 'historical',
      endedAt: formatSignalDate(dbSignal.ended_at || dbSignal.created_at),
      status: dbSignal.status || '手动平仓'
    } as HistoricalSignal;
  }
};

/**
 * 格式化信号时间显示
 */
const formatSignalDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * 获取交易员的所有信号数据
 */
export const getTraderSignals = async (traderId: string): Promise<{
  signals: UnifiedSignal[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('trader_signals')
      .select('*')
      .eq('trader_id', traderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trader signals:', error);
      return { signals: [], error: error.message };
    }

    const signals = (data || []).map(convertDBSignalToUnified);
    return { signals, error: null };
  } catch (err) {
    console.error('Exception fetching trader signals:', err);
    return { 
      signals: [], 
      error: err instanceof Error ? err.message : '获取信号数据失败' 
    };
  }
};

/**
 * 获取分页的交易员信号数据
 */
export const getTraderSignalsPaged = async (
  traderId: string, 
  page: number = 1, 
  pageSize: number = 20,
  signalType?: 'current' | 'historical'
): Promise<{
  signals: UnifiedSignal[];
  total: number;
  hasMore: boolean;
  error: string | null;
}> => {
  try {
    let query = supabase
      .from('trader_signals')
      .select('*', { count: 'exact' })
      .eq('trader_id', traderId);

    if (signalType) {
      query = query.eq('signal_type', signalType);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error fetching paged trader signals:', error);
      return { signals: [], total: 0, hasMore: false, error: error.message };
    }

    const signals = (data || []).map(convertDBSignalToUnified);
    const total = count || 0;
    const hasMore = page * pageSize < total;

    return { signals, total, hasMore, error: null };
  } catch (err) {
    console.error('Exception fetching paged trader signals:', err);
    return { 
      signals: [], 
      total: 0, 
      hasMore: false,
      error: err instanceof Error ? err.message : '获取分页信号数据失败' 
    };
  }
};

/**
 * 计算交易员的实时统计数据
 */
export interface RealTimeTraderStats {
  winRate: number;
  pnlRatio: number | null;
  totalSignals: number;
  totalProfit: number;
  totalLoss: number;
  historicalSignals: number;
  currentSignals: number;
}

export const calculateRealTimeStats = async (traderId: string): Promise<{
  stats: RealTimeTraderStats | null;
  error: string | null;
}> => {
  try {
    // 获取所有信号数据
    const { signals, error } = await getTraderSignals(traderId);
    
    if (error) {
      return { stats: null, error };
    }

    const historicalSignals = signals.filter(s => s.signalType === 'historical') as HistoricalSignal[];
    const currentSignals = signals.filter(s => s.signalType === 'current');

    // 计算胜率
    const winCount = historicalSignals.filter(s => s.status === '止盈平仓').length;
    const winRate = historicalSignals.length > 0 
      ? Math.round((winCount / historicalSignals.length) * 10000) / 100 
      : 0;

    // 获取实际盈亏数据来计算盈亏比
    const { data: pnlData, error: pnlError } = await supabase
      .from('trader_signals')
      .select('actual_pnl, status')
      .eq('trader_id', traderId)
      .eq('signal_type', 'historical')
      .not('actual_pnl', 'is', null);

    if (pnlError) {
      console.warn('Error fetching PnL data:', pnlError);
    }

    let totalProfit = 0;
    let totalLoss = 0;
    let pnlRatio: number | null = null;

    if (pnlData && pnlData.length > 0) {
      totalProfit = pnlData
        .filter(d => d.actual_pnl > 0)
        .reduce((sum, d) => sum + d.actual_pnl, 0);
      
      totalLoss = Math.abs(pnlData
        .filter(d => d.actual_pnl < 0)
        .reduce((sum, d) => sum + d.actual_pnl, 0));

      if (totalLoss > 0) {
        pnlRatio = Math.round((totalProfit / totalLoss) * 10) / 10; // 保留1位小数
      } else if (totalProfit > 0) {
        pnlRatio = 99.9; // 表示无亏损
      }
    }

    const stats: RealTimeTraderStats = {
      winRate,
      pnlRatio,
      totalSignals: signals.length,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalLoss: Math.round(totalLoss * 100) / 100,
      historicalSignals: historicalSignals.length,
      currentSignals: currentSignals.length
    };

    return { stats, error: null };
  } catch (err) {
    console.error('Exception calculating real-time stats:', err);
    return { 
      stats: null, 
      error: err instanceof Error ? err.message : '计算统计数据失败' 
    };
  }
};