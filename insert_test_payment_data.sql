-- =============================================
-- 插入测试付费记录数据
-- 用于测试付费明细页面显示
-- =============================================

-- 注意：请先确保您已经登录到系统，这样 auth.uid() 才能获取到当前用户ID
-- 如果没有登录用户，请将 auth.uid() 替换为实际的用户UUID

-- 插入测试付费记录
INSERT INTO public.payment_records (
    user_id,
    plan_id,
    payment_method,
    payment_address,
    sender_address,
    amount_usdt,
    transaction_hash,
    status,
    payment_type,
    completed_at,
    expires_at,
    notes
) VALUES 
-- 成功的付费记录
(
    auth.uid(), -- 当前登录用户
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 12 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXabc123def456ghi789jkl012mno345pqr678',
    119.90,
    'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    'completed',
    '手动跟单 · 1年',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '1 year' - INTERVAL '2 days',
    '支付成功，会员已激活'
),
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 3 LIMIT 1),
    'ERC20',
    '0x12...cdef...3456',
    '0x9876543210abcdef9876543210abcdef98765432',
    60.00,
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    'completed',
    '自动跟单 · 3个月',
    NOW() - INTERVAL '1 week',
    NOW() + INTERVAL '3 months' - INTERVAL '1 week',
    '支付成功，自动跟单已开启'
),
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 1 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXdef456ghi789jkl012mno345pqr678stu901',
    9.90,
    'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a',
    'completed',
    '手动跟单 · 1个月',
    NOW() - INTERVAL '3 weeks',
    NOW() + INTERVAL '1 month' - INTERVAL '3 weeks',
    '首次购买，体验套餐'
),

-- 审核中的付费记录
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 12 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXghi789jkl012mno345pqr678stu901vwx234',
    240.00,
    'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2',
    'reviewing',
    '自动跟单 · 1年',
    NULL,
    NULL,
    '等待管理员审核确认'
),
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 3 LIMIT 1),
    'ERC20',
    '0x12...cdef...3456',
    '0x5432109876abcdef5432109876abcdef54321098',
    29.90,
    NULL, -- 审核中可能还没有交易哈希
    'pending',
    '手动跟单 · 3个月',
    NULL,
    NULL,
    '支付凭证已提交，等待确认'
),

-- 失败的付费记录
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 1 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXjkl012mno345pqr678stu901vwx234yza567',
    20.00,
    'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567abc3',
    'failed',
    '自动跟单 · 1个月',
    NULL,
    NULL,
    '支付金额不足，请重新支付'
),

-- 更多历史记录
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 12 LIMIT 1),
    'ERC20',
    '0x12...cdef...3456',
    '0x1098765432abcdef1098765432abcdef10987654',
    119.90,
    '0x234567890abcdef234567890abcdef234567890abcdef234567890abcdef234',
    'completed',
    '手动跟单 · 1年',
    NOW() - INTERVAL '2 months',
    NOW() + INTERVAL '1 year' - INTERVAL '2 months',
    '续费成功'
),
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 3 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXmno345pqr678stu901vwx234yza567bcd890',
    60.00,
    'e5f6789012345678901234567890abcdef1234567890abcdef1234567abcd4',
    'completed',
    '自动跟单 · 3个月',
    NOW() - INTERVAL '4 months',
    NOW() + INTERVAL '3 months' - INTERVAL '4 months', -- 已过期
    '历史订单，已过期'
),
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 1 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXpqr678stu901vwx234yza567bcd890efg123',
    9.90,
    'f6789012345678901234567890abcdef1234567890abcdef1234567abcde5',
    'completed',
    '手动跟单 · 1个月',
    NOW() - INTERVAL '6 months',
    NOW() + INTERVAL '1 month' - INTERVAL '6 months', -- 已过期
    '早期测试订单'
),
(
    auth.uid(),
    (SELECT id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 12 LIMIT 1),
    'ERC20',
    '0x12...cdef...3456',
    '0x6543210987abcdef6543210987abcdef65432109',
    240.00,
    NULL,
    'failed',
    '自动跟单 · 1年',
    NULL,
    NULL,
    '网络拥堵，交易失败'
);

-- 验证插入的数据
SELECT 
    pr.id,
    pr.payment_method,
    pr.amount_usdt,
    pr.status,
    pr.payment_type,
    pr.created_at,
    pr.completed_at,
    mp.title as plan_title
FROM public.payment_records pr
LEFT JOIN public.membership_plans mp ON pr.plan_id = mp.id
WHERE pr.user_id = auth.uid()
ORDER BY pr.created_at DESC;

-- 显示统计信息
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount_usdt) as total_amount
FROM public.payment_records 
WHERE user_id = auth.uid()
GROUP BY status
ORDER BY count DESC;