-- 创建用于第三方API插入信号的RPC函数，绕过RLS策略

CREATE OR REPLACE FUNCTION public.insert_trader_signal(
  trader_id_param UUID,
  signal_type_param TEXT,
  pair_param TEXT,
  direction_param TEXT,
  entry_price_param TEXT,
  take_profit_1_param TEXT DEFAULT NULL,
  take_profit_2_param TEXT DEFAULT NULL,
  stop_loss_param TEXT,
  suggested_pnl_ratio_param TEXT,
  order_type_param TEXT DEFAULT '限价单',
  contract_type_param TEXT DEFAULT '永续合约',
  margin_mode_param TEXT DEFAULT '全仓',
  status_param TEXT DEFAULT NULL,
  created_at_param TIMESTAMPTZ DEFAULT NOW(),
  ended_at_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 插入信号数据，SECURITY DEFINER 让此函数以创建者权限运行，绕过RLS
  INSERT INTO public.trader_signals (
    trader_id, signal_type, pair, direction, entry_price,
    take_profit_1, take_profit_2, stop_loss, suggested_pnl_ratio,
    order_type, contract_type, margin_mode, status,
    created_at, ended_at
  ) VALUES (
    trader_id_param, signal_type_param, pair_param, direction_param, entry_price_param,
    take_profit_1_param, take_profit_2_param, stop_loss_param, suggested_pnl_ratio_param,
    order_type_param, contract_type_param, margin_mode_param, status_param,
    created_at_param, ended_at_param
  );
END;
$$;

-- 授权anon用户执行此函数
GRANT EXECUTE ON FUNCTION public.insert_trader_signal TO anon;
