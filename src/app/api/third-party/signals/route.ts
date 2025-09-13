import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateRealTimeStats } from '@/lib/signals';

// 为API路由创建服务角色客户端，绕过RLS策略
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    }
  }
);

// 计算盈亏比的函数
function calculateProfitLossRatio(
  entryPrice: string,
  takeProfitPrice: string,
  stopLossPrice: string,
  direction: '做多' | '做空'
): string {
  const entry = parseFloat(entryPrice);
  const takeProfit = parseFloat(takeProfitPrice);
  const stopLoss = parseFloat(stopLossPrice);
  
  if (isNaN(entry) || isNaN(takeProfit) || isNaN(stopLoss)) {
    return '--';
  }
  
  let profit: number;
  let loss: number;
  
  if (direction === '做多') {
    // 做多：盈利 = 止盈价 - 入场价，亏损 = 入场价 - 止损价
    profit = takeProfit - entry;
    loss = entry - stopLoss;
  } else {
    // 做空：盈利 = 入场价 - 止盈价，亏损 = 止损价 - 入场价
    profit = entry - takeProfit;
    loss = stopLoss - entry;
  }
  
  if (loss <= 0) {
    return '--';
  }
  
  const ratio = profit / loss;
  return `${ratio.toFixed(1)}:1`;
}

// 定义请求体类型
interface SignalRequestBody {
  trader_id: string;
  signals: {
    pair: string;
    direction: '做多' | '做空';
    entry_price: string;
    take_profit_1?: string;
    take_profit_2?: string;
    stop_loss: string;
    order_type: '限价单' | '市价单';
    contract_type?: string;
    margin_mode?: string;
    status?: string;
    created_at?: string;
    ended_at?: string;
  }[];
}

// 定义错误响应类型
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// 定义成功响应类型
interface SuccessResponse {
  success: true;
  data: {
    message: string;
    processed_signals: number;
  };
}

// 验证信号数据的函数
function validateSignalData(signal: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 验证必填字段
  if (!signal.pair) {
    errors.push('缺少必填字段: pair');
  }
  
  if (!signal.direction || (signal.direction !== '做多' && signal.direction !== '做空')) {
    errors.push('缺少必填字段或字段值无效: direction');
  }
  
  if (!signal.entry_price) {
    errors.push('缺少必填字段: entry_price');
  }
  
  if (!signal.stop_loss) {
    errors.push('缺少必填字段: stop_loss');
  }
  
  // 验证订单类型
  if (!signal.order_type) {
    errors.push('缺少必填字段: order_type');
  } else if (!['限价单', '市价单'].includes(signal.order_type)) {
    errors.push('order_type 字段值无效，只支持: 限价单, 市价单');
  }
  
  // 止盈价不是必填字段，可以都为空
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 验证交易员ID的函数
async function verifyTraderId(traderId: string): Promise<boolean> {
  const { data, error } = await supabaseServiceRole
    .from('traders')
    .select('id')
    .eq('id', traderId)
    .single();
  
  return !error && !!data;
}

export async function POST(request: Request) {
  try {
    // 解析请求体
    const body: SignalRequestBody = await request.json();
    
    // 验证请求体
    if (!body.trader_id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_TRADER_ID',
          message: '缺少交易员ID'
        }
      } as ErrorResponse, { status: 400 });
    }
    
    if (!body.signals || !Array.isArray(body.signals) || body.signals.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_SIGNALS',
          message: '缺少信号数据或信号数据格式不正确'
        }
      } as ErrorResponse, { status: 400 });
    }
    
    // 验证交易员ID是否存在
    const isTraderValid = await verifyTraderId(body.trader_id);
    if (!isTraderValid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TRADER_NOT_FOUND',
          message: '指定的交易员不存在'
        }
      } as ErrorResponse, { status: 404 });
    }
    
    // 验证每个信号数据
    const validationErrors: string[] = [];
    for (let i = 0; i < body.signals.length; i++) {
      const signal = body.signals[i];
      const { isValid, errors } = validateSignalData(signal);
      
      if (!isValid) {
        validationErrors.push(`信号${i + 1}: ${errors.join(', ')}`);
      }
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_SIGNAL_DATA',
          message: `信号数据验证失败: ${validationErrors.join('; ')}`
        }
      } as ErrorResponse, { status: 400 });
    }
    
    // 处理信号数据
    let processedSignals = 0;
    const insertErrors: string[] = [];
    
    for (const signal of body.signals) {
      // 确定信号类型（根据是否有结束时间判断）
      const signalType = signal.ended_at ? 'historical' : 'current';
      
      // 计算盈亏比 - 使用最大止盈价
      let calculatedPnlRatio = '--';
      if (signal.take_profit_1 || signal.take_profit_2) {
        // 如果有两个止盈价，取最大的
        let maxTakeProfit = signal.take_profit_1;
        if (signal.take_profit_2) {
          if (!maxTakeProfit || parseFloat(signal.take_profit_2) > parseFloat(maxTakeProfit)) {
            maxTakeProfit = signal.take_profit_2;
          }
        }
        
        if (maxTakeProfit) {
          calculatedPnlRatio = calculateProfitLossRatio(
            signal.entry_price,
            maxTakeProfit,
            signal.stop_loss,
            signal.direction
          );
        }
      }
      
      // 构造数据库记录
      const dbRecord = {
        trader_id: body.trader_id,
        signal_type: signalType,
        pair: signal.pair,
        direction: signal.direction,
        entry_price: signal.entry_price,
        take_profit_1: signal.take_profit_1 || null,
        take_profit_2: signal.take_profit_2 || null,
        stop_loss: signal.stop_loss,
        suggested_pnl_ratio: calculatedPnlRatio,
        order_type: signal.order_type,
        contract_type: signal.contract_type || '永续合约',
        margin_mode: signal.margin_mode || '全仓',
        // 只有历史信号才设置status，且必须是有效值
        status: signalType === 'historical' && signal.status && 
                ['止盈平仓', '止损平仓', '手动平仓'].includes(signal.status) 
                ? signal.status : null,
        created_at: signal.created_at ? new Date(signal.created_at).toISOString() : new Date().toISOString(),
        ended_at: signal.ended_at ? new Date(signal.ended_at).toISOString() : null
      };
      
      console.log('准备插入的数据库记录:', JSON.stringify(dbRecord, null, 2));
      
      // 插入数据库
      const { error } = await supabaseServiceRole
        .from('trader_signals')
        .insert(dbRecord);
      
      if (error) {
        console.error('插入信号数据失败:', error);
        insertErrors.push(`信号 ${signal.pair}: ${error.message || error.toString()}`);
        // 继续处理其他信号而不是中断
      } else {
        console.log('成功插入信号数据:', signal.pair);
        processedSignals++;
      }
    }
    
    // 如果有成功处理的信号，更新交易员统计数据
    if (processedSignals > 0) {
      try {
        // 计算并更新交易员统计数据
        const { stats, error: statsError } = await calculateRealTimeStats(body.trader_id);
        
        if (!statsError && stats) {
          await supabaseServiceRole
            .from('traders')
            .update({
              win_rate: stats.winRate,
              profit_loss_ratio: stats.pnlRatio,
              yield_rate: stats.yieldRate,
              total_signals: stats.totalSignals,
              updated_at: new Date().toISOString()
            })
            .eq('id', body.trader_id);
        }
      } catch (statsError) {
        console.error('更新交易员统计数据失败:', statsError);
        // 不中断响应，因为信号已经成功处理
      }
    }
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        message: `成功处理 ${processedSignals} 条信号数据`,
        processed_signals: processedSignals,
        errors: insertErrors.length > 0 ? insertErrors : undefined
      }
    } as SuccessResponse, { status: 200 });
    
  } catch (error) {
    console.error('处理信号数据时发生错误:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    } as ErrorResponse, { status: 500 });
  }
}