import { UnifiedSignal, CurrentSignal, HistoricalSignal } from './data';

// 统计指标接口
export interface TraderStatistics {
  winRate: number;          // 胜率百分比
  pnlRatio: string;         // 盈亏比 (格式: "X.XX:1" 或 "--")
  totalSignals: number;     // 累计信号数量
  totalDays: number;        // 累计天数
  totalProfit: number;      // 总盈利
  totalLoss: number;        // 总亏损
  historicalSignals: number; // 历史信号数量
  currentSignals: number;   // 当前信号数量
}

// 扩展历史信号接口，添加盈亏字段
export interface HistoricalSignalWithPnL extends HistoricalSignal {
  profitLoss?: number;  // 实际盈亏金额
  exitPrice?: string;   // 实际平仓价格
}

/**
 * 计算信号的盈亏金额
 * 根据入场价、平仓价、方向等计算盈亏
 */
export const calculateSignalProfitLoss = (
  signal: HistoricalSignal,
  defaultPositionSize: number = 1000 // 默认仓位大小（USDT）
): number => {
  // 如果已有profitLoss字段，直接返回
  if ((signal as HistoricalSignalWithPnL).profitLoss !== undefined) {
    return (signal as HistoricalSignalWithPnL).profitLoss!;
  }
  
  // 根据信号状态计算盈亏
  const entryPrice = parseFloat(signal.entryPrice);
  let exitPrice: number;
  
  if (signal.status === '止盈平仓') {
    // 使用止盈价格（优先使用takeProfit1）
    exitPrice = signal.takeProfit1 ? 
      parseFloat(signal.takeProfit1) : 
      parseFloat(signal.takeProfit2 || signal.entryPrice);
  } else if (signal.status === '止损平仓') {
    // 使用止损价格
    exitPrice = parseFloat(signal.stopLoss);
  } else {
    // 其他状态返回0
    return 0;
  }
  
  // 计算盈亏
  const direction = signal.direction === '做多' ? 'long' : 'short';
  const priceChange = exitPrice - entryPrice;
  const directionMultiplier = direction === 'long' ? 1 : -1;
  
  // 简化计算：使用固定仓位大小，按照百分比收益计算盈亏
  const profitLossRatio = (priceChange / entryPrice) * directionMultiplier;
  const profitLoss = defaultPositionSize * profitLossRatio;
  
  return Math.round(profitLoss * 100) / 100; // 保留2位小数
};

/**
 * 计算胜率
 * 胜率 = 历史信号中止盈平仓数量 / 历史信号总数量 × 100%
 */
export const calculateWinRate = (signals: UnifiedSignal[]): number => {
  const historicalSignals = signals.filter(
    signal => signal.signalType === 'historical'
  ) as HistoricalSignal[];
  
  if (historicalSignals.length === 0) return 0;
  
  const winSignals = historicalSignals.filter(
    signal => signal.status === '止盈平仓'
  );
  
  return Math.round((winSignals.length / historicalSignals.length) * 10000) / 100; // 保留2位小数
};

/**
 * 计算盈亏比
 * 盈亏比 = 历史信号总盈利 / 历史信号总亏损
 */
export const calculatePnlRatio = (signals: UnifiedSignal[]): string => {
  const historicalSignals = signals.filter(
    signal => signal.signalType === 'historical'
  ) as HistoricalSignal[];
  
  if (historicalSignals.length === 0) return '--';
  
  const profitSignals = historicalSignals.filter(
    signal => signal.status === '止盈平仓'
  );
  
  const lossSignals = historicalSignals.filter(
    signal => signal.status === '止损平仓'
  );
  
  // 计算总盈利
  const totalProfit = profitSignals.reduce((sum, signal) => {
    return sum + Math.abs(calculateSignalProfitLoss(signal));
  }, 0);
  
  // 计算总亏损
  const totalLoss = lossSignals.reduce((sum, signal) => {
    return sum + Math.abs(calculateSignalProfitLoss(signal));
  }, 0);
  
  if (totalLoss === 0) {
    // 如果没有亏损，但有盈利信号，显示为高比率
    return totalProfit > 0 ? '∞' : '--';
  }
  
  const ratio = totalProfit / totalLoss;
  return ratio.toFixed(1);
};

/**
 * 计算累计信号数量
 * 累计信号 = 历史信号数量 + 当前信号数量
 */
export const calculateTotalSignals = (signals: UnifiedSignal[]): number => {
  return signals.length;
};

/**
 * 计算累计天数
 * 累计天数 = 当前日期 - 最早历史信号日期（UTC+8时区）
 */
export const calculateTotalDays = (signals: UnifiedSignal[]): number => {
  const historicalSignals = signals.filter(
    signal => signal.signalType === 'historical'
  ) as HistoricalSignal[];
  
  if (historicalSignals.length === 0) return 0;
  
  // 找到最早的信号日期
  const earliestSignal = historicalSignals.reduce((earliest, signal) => {
    const signalDate = new Date(signal.createdAt);
    const earliestDate = new Date(earliest.createdAt);
    return signalDate < earliestDate ? signal : earliest;
  });
  
  // 转换为UTC+8时区
  const startDate = new Date(earliestSignal.createdAt);
  const currentDate = new Date();
  
  // 计算UTC+8时区的时间差
  const utc8Offset = 8 * 60 * 60 * 1000; // 8小时的毫秒数
  const startUtc8 = new Date(startDate.getTime() + utc8Offset);
  const currentUtc8 = new Date(currentDate.getTime() + utc8Offset);
  
  // 计算天数差
  const timeDiff = currentUtc8.getTime() - startUtc8.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  return Math.max(daysDiff, 0); // 确保不会是负数
};

/**
 * 计算详细的盈亏数据
 * 返回总盈利和总亏损
 */
export const calculateProfitLossDetails = (signals: UnifiedSignal[]): { totalProfit: number; totalLoss: number } => {
  const historicalSignals = signals.filter(
    signal => signal.signalType === 'historical'
  ) as HistoricalSignal[];
  
  const profitSignals = historicalSignals.filter(
    signal => signal.status === '止盈平仓'
  );
  
  const lossSignals = historicalSignals.filter(
    signal => signal.status === '止损平仓'
  );
  
  // 计算总盈利
  const totalProfit = profitSignals.reduce((sum, signal) => {
    return sum + Math.abs(calculateSignalProfitLoss(signal));
  }, 0);
  
  // 计算总亏损
  const totalLoss = lossSignals.reduce((sum, signal) => {
    return sum + Math.abs(calculateSignalProfitLoss(signal));
  }, 0);
  
  return {
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100
  };
};

/**
 * 计算所有统计指标
 * 一次性计算所有统计数据，避免重复计算
 */
export const calculateAllStatistics = (signals: UnifiedSignal[]): TraderStatistics => {
  const winRate = calculateWinRate(signals);
  const pnlRatio = calculatePnlRatio(signals);
  const totalSignals = calculateTotalSignals(signals);
  const totalDays = calculateTotalDays(signals);
  const { totalProfit, totalLoss } = calculateProfitLossDetails(signals);
  
  const historicalSignals = signals.filter(s => s.signalType === 'historical').length;
  const currentSignals = signals.filter(s => s.signalType === 'current').length;
  
  return {
    winRate,
    pnlRatio,
    totalSignals,
    totalDays,
    totalProfit,
    totalLoss,
    historicalSignals,
    currentSignals
  };
};

/**
 * 格式化数值显示
 * 处理特殊情况的显示格式
 */
export const formatStatisticValue = (
  type: 'winRate' | 'pnlRatio' | 'totalSignals' | 'totalDays',
  value: string | number
): string => {
  switch (type) {
    case 'winRate':
      return typeof value === 'number' ? `${value.toFixed(2)}%` : '--';
    case 'pnlRatio':
      return typeof value === 'string' && value !== '--' ? `${value}:1` : value as string;
    case 'totalSignals':
    case 'totalDays':
      return typeof value === 'number' ? value.toString() : '--';
    default:
      return '--';
  }
};

/**
 * 格式化数据库中的盈亏比数字为字符串
 * 统一列表页面和详情页面的显示格式
 */
export const formatPnlRatioFromNumber = (pnlRatio: number | null): string => {
  if (pnlRatio === null || pnlRatio === undefined) {
    return '--';
  }
  
  // 保留1位小数并四舍五入
  const formattedRatio = pnlRatio.toFixed(1);
  return `${formattedRatio}:1`;
};

/**
 * 格式化胜率显示
 * 统一列表页面和详情页面的显示格式
 */
export const formatWinRateFromNumber = (winRate: number | null): string => {
  if (winRate === null || winRate === undefined) {
    return '--';
  }
  
  // 保留2位小数
  return `${winRate.toFixed(2)}%`;
};