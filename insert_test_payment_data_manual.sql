-- =============================================
-- 插入测试付费记录数据 (手动指定用户ID版本)
-- 用于测试付费明细页面显示
-- =============================================

-- 使用方法：
-- 1. 先查询您的用户ID
-- 2. 将下面的 'YOUR_USER_ID_HERE' 替换为实际的用户UUID
-- 3. 执行脚本

-- 步骤1：查询当前系统中的用户ID
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 步骤2：查询profiles表中的用户信息
SELECT 
    id as user_id,
    username,
    email,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 步骤3：请将下面的 'YOUR_USER_ID_HERE' 替换为上面查询结果中的实际用户ID
-- 例如：将 'YOUR_USER_ID_HERE' 替换为 '12345678-1234-1234-1234-123456789012'

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
    'YOUR_USER_ID_HERE'::uuid, -- 请替换为实际的用户UUID
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
    'YOUR_USER_ID_HERE'::uuid,
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
    'YOUR_USER_ID_HERE'::uuid,
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
    'YOUR_USER_ID_HERE'::uuid,
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
    'YOUR_USER_ID_HERE'::uuid,
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 3 LIMIT 1),
    'ERC20',
    '0x12...cdef...3456',
    '0x5432109876abcdef5432109876abcdef54321098',
    29.90,
    NULL,
    'pending',
    '手动跟单 · 3个月',
    NULL,
    NULL,
    '支付凭证已提交，等待确认'
),
-- 失败的付费记录
(
    'YOUR_USER_ID_HERE'::uuid,
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
    'YOUR_USER_ID_HERE'::uuid,
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
    'YOUR_USER_ID_HERE'::uuid,
    (SELECT id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 3 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXmno345pqr678stu901vwx234yza567bcd890',
    60.00,
    'e5f6789012345678901234567890abcdef1234567890abcdef1234567abcd4',
    'completed',
    '自动跟单 · 3个月',
    NOW() - INTERVAL '4 months',
    NOW() + INTERVAL '3 months' - INTERVAL '4 months',
    '历史订单，已过期'
),
(
    'YOUR_USER_ID_HERE'::uuid,
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 1 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXpqr678stu901vwx234yza567bcd890efg123',
    9.90,
    'f6789012345678901234567890abcdef1234567890abcdef1234567abcde5',
    'completed',
    '手动跟单 · 1个月',
    NOW() - INTERVAL '6 months',
    NOW() + INTERVAL '1 month' - INTERVAL '6 months',
    '早期测试订单'
),
(
    'YOUR_USER_ID_HERE'::uuid,
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

-- 验证插入的数据（请将 YOUR_USER_ID_HERE 替换为实际用户ID）
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
WHERE pr.user_id = 'YOUR_USER_ID_HERE'::uuid
ORDER BY pr.created_at DESC;

-- 显示统计信息（请将 YOUR_USER_ID_HERE 替换为实际用户ID）
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount_usdt) as total_amount
FROM public.payment_records 
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid
GROUP BY status
ORDER BY count DESC;