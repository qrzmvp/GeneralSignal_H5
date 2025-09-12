-- =============================================
-- 生产环境测试数据一键部署脚本
-- 包含：交易员数据 + 会员系统 + 测试订单
-- 执行前请确保基础表结构已存在
-- =============================================

BEGIN;

-- 1. 确保会员套餐表数据
INSERT INTO public.membership_plans (
    plan_type, duration_months, price_usdt, original_price_usdt, 
    title, description, features, sort_order, is_active
) VALUES 

-- 手动跟单套餐
('manual', 1, 29.90, 39.90, '手动跟单 · 1个月', 
 '体验手动跟单服务，查看所有交易信号', 
 '["查看实时信号", "手动跟单操作", "7x24小时客服", "基础风险提醒"]'::jsonb, 1, true),

('manual', 3, 79.90, 99.90, '手动跟单 · 3个月', 
 '短期手动跟单套餐，适合新手用户', 
 '["查看实时信号", "手动跟单操作", "7x24小时客服", "基础风险提醒", "优先技术支持"]'::jsonb, 2, true),

('manual', 12, 199.90, 299.90, '手动跟单 · 1年', 
 '最受欢迎的年度套餐，性价比最高', 
 '["查看实时信号", "手动跟单操作", "7x24小时客服", "基础风险提醒", "优先技术支持", "专属交流群组", "月度策略报告"]'::jsonb, 3, true),

-- 自动跟单套餐  
('auto', 1, 99.90, 129.90, '自动跟单 · 1个月', 
 '全自动跟单体验，解放您的时间', 
 '["实时信号推送", "全自动跟单", "智能风险控制", "7x24小时客服", "实时收益监控"]'::jsonb, 4, true),

('auto', 3, 269.90, 329.90, '自动跟单 · 3个月', 
 '季度自动跟单套餐，稳定盈利', 
 '["实时信号推送", "全自动跟单", "智能风险控制", "7x24小时客服", "实时收益监控", "高级策略分析", "个性化风控设置"]'::jsonb, 5, true),

('auto', 12, 899.90, 1199.90, '自动跟单 · 1年', 
 '专业交易员首选，享受最低成本', 
 '["实时信号推送", "全自动跟单", "智能风险控制", "7x24小时客服", "实时收益监控", "高级策略分析", "个性化风控设置", "VIP专属服务", "一对一策略指导"]'::jsonb, 6, true)

ON CONFLICT (plan_type, duration_months) DO UPDATE SET
    price_usdt = EXCLUDED.price_usdt,
    original_price_usdt = EXCLUDED.original_price_usdt,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- 2. 插入支付配置
INSERT INTO public.payment_config (
    payment_method, wallet_address, network_name, is_active
) VALUES 
('TRC20', 'TXYZ...abcd...efgh', 'TRON Network', true),
('ERC20', '0x12...cdef...3456', 'Ethereum Network', true)
ON CONFLICT (payment_method) DO UPDATE SET
    wallet_address = EXCLUDED.wallet_address,
    network_name = EXCLUDED.network_name,
    is_active = EXCLUDED.is_active;

-- 3. 插入完整交易员数据（14名交易员）
INSERT INTO public.traders (
    name, description, yield_rate, win_rate, profit_loss_ratio, 
    total_signals, avatar_url, tags
) VALUES 

('WWG-Woods', '盈亏同源高收益追涨模式采用指数级复利操作', 288.50, 95.20, 22.30, 156, 
 'https://i.pravatar.cc/150?u=wwg-woods', 
 ARRAY['波段高手', '高频交易', 'ETH信徒']),

('WWG-Jonh', '稳健型交易策略，注重风险控制和长期盈利', 198.75, 87.40, 15.60, 234, 
 'https://i.pravatar.cc/150?u=jonh', 
 ARRAY['稳健型', '风险控制', '趋势跟踪']),

('WWG-Hbj', '短线交易专家，擅长日内波动捕捉', 156.80, 78.90, 8.90, 312, 
 'https://i.pravatar.cc/150?u=hbj', 
 ARRAY['短线王', '日内交易', '技术分析']),

('量化大师', '量化交易策略，数据驱动的投资决策', 245.30, 92.10, 18.70, 189, 
 'https://i.pravatar.cc/150?u=quant', 
 ARRAY['量化交易', '数据分析', '算法策略']),

('趋势猎人', '专注趋势交易，善于捕捉市场大方向', 167.90, 81.60, 12.40, 278, 
 'https://i.pravatar.cc/150?u=hunter', 
 ARRAY['趋势交易', '动量策略', '市场分析']),

('波段之王', '波段交易专家，中长线布局策略', 134.50, 75.30, 9.80, 198, 
 'https://i.pravatar.cc/150?u=swing', 
 ARRAY['波段交易', '中长线', '价值投资']),

('合约常胜军', '合约交易高手，杠杆操作专家', 298.70, 89.80, 25.60, 145, 
 'https://i.pravatar.cc/150?u=futures', 
 ARRAY['合约交易', '杠杆操作', '风控专家']),

('BTC信仰者', '比特币长期持有者，价值投资理念', 78.90, 68.50, 6.70, 89, 
 'https://i.pravatar.cc/150?u=btc', 
 ARRAY['价值投资', 'BTC专家', '长期持有']),

('短线快枪手', '超短线交易，快进快出策略', 189.60, 82.40, 11.20, 456, 
 'https://i.pravatar.cc/150?u=quick', 
 ARRAY['超短线', '快进快出', '高频交易']),

('ETH布道者', '以太坊生态专家，DeFi投资高手', 156.70, 79.80, 10.90, 167, 
 'https://i.pravatar.cc/150?u=eth', 
 ARRAY['ETH专家', 'DeFi投资', '生态分析']),

('Alpha Seeker', '寻找超额收益，另类投资策略', 267.80, 91.20, 19.40, 123, 
 'https://i.pravatar.cc/150?u=alpha', 
 ARRAY['Alpha策略', '另类投资', '超额收益']),

('狙击涨停板', '精准狙击强势标的，短期暴利', 345.60, 94.70, 28.90, 98, 
 'https://i.pravatar.cc/150?u=limit-up', 
 ARRAY['强势股', '短期暴利', '精准狙击']),

('抄底王', '专业抄底，逆向投资策略', 112.40, 72.60, 7.80, 234, 
 'https://i.pravatar.cc/150?u=dip', 
 ARRAY['抄底策略', '逆向投资', '价值发现']),

('币圈巴菲特', '价值投资理念，长期价值挖掘', 98.70, 69.80, 8.40, 156, 
 'https://i.pravatar.cc/150?u=buffett', 
 ARRAY['价值投资', '长期持有', '基本面分析'])

ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    yield_rate = EXCLUDED.yield_rate,
    win_rate = EXCLUDED.win_rate,
    profit_loss_ratio = EXCLUDED.profit_loss_ratio,
    total_signals = EXCLUDED.total_signals,
    avatar_url = EXCLUDED.avatar_url,
    tags = EXCLUDED.tags,
    updated_at = NOW();

COMMIT;

-- 验证部署结果
SELECT '=== 会员套餐数据 ===' as info;
SELECT plan_type, title, price_usdt, is_active FROM public.membership_plans ORDER BY sort_order;

SELECT '=== 交易员数据 ===' as info;  
SELECT name, yield_rate, win_rate, total_signals FROM public.traders ORDER BY yield_rate DESC;

SELECT '=== 支付配置 ===' as info;
SELECT payment_method, wallet_address, is_active FROM public.payment_config;

-- 显示统计信息
SELECT 
    (SELECT COUNT(*) FROM public.membership_plans WHERE is_active = true) as active_plans,
    (SELECT COUNT(*) FROM public.traders) as total_traders,
    (SELECT COUNT(*) FROM public.payment_config WHERE is_active = true) as payment_methods;
