-- =============================================
-- 使用真实用户ID插入测试付费记录数据
-- 用于测试付费明细页面显示
-- =============================================

-- 基于提供的用户ID创建测试数据
-- 用户列表：
-- 16e92d09-1017-4b37-a010-a3a803d7c1d2 (qrz666666@2925.com)
-- 94c04f46-4862-44ab-9cb7-ff77dcf5cdd2 (18775311761@163.com)
-- 3536deac-1baf-417d-92ba-f971f062b388 (1554202318@qq.com)
-- 35d48b81-f314-4a28-bc4e-0a5b364b258b (qrz666666@outlook.com)
-- 8389a68d-02ba-4eca-8f4c-6ae32b8a8b73 (qrzmvp@gmail.com)

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

-- 用户1 (qrz666666@2925.com) 的付费记录
(
    '16e92d09-1017-4b37-a010-a3a803d7c1d2'::uuid,
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
    '16e92d09-1017-4b37-a010-a3a803d7c1d2'::uuid,
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

-- 用户2 (18775311761@163.com) 的付费记录
(
    '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2'::uuid,
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
(
    '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2'::uuid,
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

-- 用户3 (1554202318@qq.com) 的付费记录
(
    '3536deac-1baf-417d-92ba-f971f062b388'::uuid,
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
(
    '3536deac-1baf-417d-92ba-f971f062b388'::uuid,
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

-- 用户4 (qrz666666@outlook.com) 的付费记录
(
    '35d48b81-f314-4a28-bc4e-0a5b364b258b'::uuid,
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
    '35d48b81-f314-4a28-bc4e-0a5b364b258b'::uuid,
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

-- 用户5 (qrzmvp@gmail.com) 的付费记录
(
    '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'::uuid,
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
    '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'::uuid,
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
),

-- 额外的测试数据，分配给第一个用户
(
    '16e92d09-1017-4b37-a010-a3a803d7c1d2'::uuid,
    (SELECT id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 1 LIMIT 1),
    'ERC20',
    '0x12...cdef...3456',
    '0x7890abcdef1234567890abcdef1234567890ab',
    20.00,
    '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef567',
    'completed',
    '自动跟单 · 1个月',
    NOW() - INTERVAL '1 month',
    NOW() + INTERVAL '1 month' - INTERVAL '1 month',
    '短期测试套餐'
),
(
    '16e92d09-1017-4b37-a010-a3a803d7c1d2'::uuid,
    (SELECT id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 3 LIMIT 1),
    'TRC20',
    'TXYZ...abcd...efgh',
    'TXstu901vwx234yza567bcd890efg123hij456',
    29.90,
    'g789012345678901234567890abcdef1234567890abcdef1234567abcdef6',
    'reviewing',
    '手动跟单 · 3个月',
    NULL,
    NULL,
    '升级套餐，审核中'
);

-- 验证插入的数据 - 显示所有用户的付费记录
SELECT 
    pr.id,
    pr.user_id,
    p.email,
    pr.payment_method,
    pr.amount_usdt,
    pr.status,
    pr.payment_type,
    pr.created_at,
    pr.completed_at,
    mp.title as plan_title
FROM public.payment_records pr
LEFT JOIN public.membership_plans mp ON pr.plan_id = mp.id
LEFT JOIN public.profiles p ON pr.user_id = p.id
WHERE pr.user_id IN (
    '16e92d09-1017-4b37-a010-a3a803d7c1d2',
    '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2',
    '3536deac-1baf-417d-92ba-f971f062b388',
    '35d48b81-f314-4a28-bc4e-0a5b364b258b',
    '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'
)
ORDER BY pr.user_id, pr.created_at DESC;

-- 按用户显示统计信息
SELECT 
    pr.user_id,
    p.email,
    pr.status,
    COUNT(*) as count,
    SUM(pr.amount_usdt) as total_amount
FROM public.payment_records pr
LEFT JOIN public.profiles p ON pr.user_id = p.id
WHERE pr.user_id IN (
    '16e92d09-1017-4b37-a010-a3a803d7c1d2',
    '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2',
    '3536deac-1baf-417d-92ba-f971f062b388',
    '35d48b81-f314-4a28-bc4e-0a5b364b258b',
    '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'
)
GROUP BY pr.user_id, p.email, pr.status
ORDER BY pr.user_id, count DESC;

-- 总体统计
SELECT 
    status,
    COUNT(*) as total_count,
    SUM(amount_usdt) as total_amount
FROM public.payment_records 
WHERE user_id IN (
    '16e92d09-1017-4b37-a010-a3a803d7c1d2',
    '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2',
    '3536deac-1baf-417d-92ba-f971f062b388',
    '35d48b81-f314-4a28-bc4e-0a5b364b258b',
    '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'
)
GROUP BY status
ORDER BY total_count DESC;

-- 显示成功消息
DO $$
BEGIN
    RAISE NOTICE '✅ 测试数据插入完成！';
    RAISE NOTICE '📊 已为5个用户创建了12条付费记录';
    RAISE NOTICE '🔗 请访问付费明细页面查看效果：http://localhost:9002/payment-details';
    RAISE NOTICE '💡 提示：登录不同用户账号可以看到对应的付费记录';
END $$;