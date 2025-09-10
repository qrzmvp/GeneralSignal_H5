-- =============================================
-- 批量插入测试付费记录数据 (每用户20+条记录)
-- 用于全面测试付费明细页面的分页和筛选功能
-- =============================================

-- 基于提供的用户ID创建大量测试数据
-- 用户列表：
-- 16e92d09-1017-4b37-a010-a3a803d7c1d2 (qrz666666@2925.com)
-- 94c04f46-4862-44ab-9cb7-ff77dcf5cdd2 (18775311761@163.com)
-- 3536deac-1baf-417d-92ba-f971f062b388 (1554202318@qq.com)
-- 35d48b81-f314-4a28-bc4e-0a5b364b258b (qrz666666@outlook.com)
-- 8389a68d-02ba-4eca-8f4c-6ae32b8a8b73 (qrzmvp@gmail.com)

-- 清理之前的测试数据（可选）
-- DELETE FROM public.payment_records WHERE notes LIKE '%测试%' OR notes LIKE '%体验%' OR notes LIKE '%升级%';

-- 批量插入测试付费记录
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
)
SELECT 
    user_data.user_id::uuid,
    plan_data.plan_id,
    payment_data.payment_method,
    payment_data.payment_address,
    payment_data.sender_address,
    plan_data.amount,
    payment_data.transaction_hash,
    status_data.status,
    plan_data.payment_type,
    CASE 
        WHEN status_data.status = 'completed' THEN NOW() - (random() * INTERVAL '365 days')
        ELSE NULL 
    END as completed_at,
    CASE 
        WHEN status_data.status = 'completed' THEN 
            (NOW() - (random() * INTERVAL '365 days')) + (plan_data.duration_months || ' months')::INTERVAL
        ELSE NULL 
    END as expires_at,
    payment_data.notes
FROM (
    -- 用户数据
    VALUES 
        ('16e92d09-1017-4b37-a010-a3a803d7c1d2'),
        ('94c04f46-4862-44ab-9cb7-ff77dcf5cdd2'),
        ('3536deac-1baf-417d-92ba-f971f062b388'),
        ('35d48b81-f314-4a28-bc4e-0a5b364b258b'),
        ('8389a68d-02ba-4eca-8f4c-6ae32b8a8b73')
) AS user_data(user_id)
CROSS JOIN (
    -- 套餐数据
    SELECT id as plan_id, duration_months, price_usdt as amount, title as payment_type
    FROM public.membership_plans 
    WHERE is_active = true
) AS plan_data
CROSS JOIN (
    -- 状态数据 (权重分布)
    VALUES 
        ('completed', 1), ('completed', 2), ('completed', 3), ('completed', 4), ('completed', 5),
        ('completed', 6), ('completed', 7), ('completed', 8), ('completed', 9), ('completed', 10),
        ('completed', 11), ('completed', 12), ('completed', 13), ('completed', 14), ('completed', 15),
        ('reviewing', 1), ('reviewing', 2),
        ('pending', 1), ('pending', 2),
        ('failed', 1), ('failed', 2)
) AS status_data(status, weight)
CROSS JOIN (
    -- 支付数据
    VALUES 
        ('TRC20', 'TXYZ...abcd...efgh', 'TXabc123def456ghi789jkl012mno345pqr678', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', '支付成功，会员已激活'),
        ('TRC20', 'TXYZ...abcd...efgh', 'TXdef456ghi789jkl012mno345pqr678stu901', 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a', '首次购买，体验套餐'),
        ('TRC20', 'TXYZ...abcd...efgh', 'TXghi789jkl012mno345pqr678stu901vwx234', 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2', '等待管理员审核确认'),
        ('TRC20', 'TXYZ...abcd...efgh', 'TXjkl012mno345pqr678stu901vwx234yza567', 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567abc3', '支付金额不足，请重新支付'),
        ('TRC20', 'TXYZ...abcd...efgh', 'TXmno345pqr678stu901vwx234yza567bcd890', 'e5f6789012345678901234567890abcdef1234567890abcdef1234567abcd4', '历史订单，已过期'),
        ('ERC20', '0x12...cdef...3456', '0x9876543210abcdef9876543210abcdef98765432', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', '支付成功，自动跟单已开启'),
        ('ERC20', '0x12...cdef...3456', '0x5432109876abcdef5432109876abcdef54321098', NULL, '支付凭证已提交，等待确认'),
        ('ERC20', '0x12...cdef...3456', '0x1098765432abcdef1098765432abcdef10987654', '0x234567890abcdef234567890abcdef234567890abcdef234567890abcdef234', '续费成功'),
        ('ERC20', '0x12...cdef...3456', '0x6543210987abcdef6543210987abcdef65432109', NULL, '网络拥堵，交易失败'),
        ('ERC20', '0x12...cdef...3456', '0x7890abcdef1234567890abcdef1234567890ab', '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef567', '短期测试套餐')
) AS payment_data(payment_method, payment_address, sender_address, transaction_hash, notes)
WHERE random() < 0.4  -- 控制数据量，大约40%的组合会被插入
LIMIT 500; -- 限制总记录数

-- 为了确保每个用户至少有20条记录，补充一些额外数据
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
)
SELECT 
    user_ids.user_id::uuid,
    (SELECT id FROM public.membership_plans WHERE is_active = true ORDER BY random() LIMIT 1),
    CASE WHEN random() < 0.6 THEN 'TRC20' ELSE 'ERC20' END,
    CASE WHEN random() < 0.6 THEN 'TXYZ...abcd...efgh' ELSE '0x12...cdef...3456' END,
    'TX' || substr(md5(random()::text), 1, 32),
    (SELECT price_usdt FROM public.membership_plans WHERE is_active = true ORDER BY random() LIMIT 1),
    CASE WHEN random() < 0.8 THEN substr(md5(random()::text), 1, 64) ELSE NULL END,
    CASE 
        WHEN random() < 0.7 THEN 'completed'
        WHEN random() < 0.85 THEN 'reviewing'
        WHEN random() < 0.95 THEN 'pending'
        ELSE 'failed'
    END,
    (SELECT title FROM public.membership_plans WHERE is_active = true ORDER BY random() LIMIT 1),
    CASE WHEN random() < 0.7 THEN NOW() - (random() * INTERVAL '365 days') ELSE NULL END,
    CASE WHEN random() < 0.7 THEN NOW() + (random() * INTERVAL '365 days') ELSE NULL END,
    CASE 
        WHEN random() < 0.2 THEN '批量测试数据 - 成功支付'
        WHEN random() < 0.4 THEN '批量测试数据 - 审核中'
        WHEN random() < 0.6 THEN '批量测试数据 - 等待确认'
        WHEN random() < 0.8 THEN '批量测试数据 - 历史订单'
        ELSE '批量测试数据 - 其他状态'
    END
FROM (
    VALUES 
        ('16e92d09-1017-4b37-a010-a3a803d7c1d2'),
        ('94c04f46-4862-44ab-9cb7-ff77dcf5cdd2'),
        ('3536deac-1baf-417d-92ba-f971f062b388'),
        ('35d48b81-f314-4a28-bc4e-0a5b364b258b'),
        ('8389a68d-02ba-4eca-8f4c-6ae32b8a8b73')
) AS user_ids(user_id)
CROSS JOIN generate_series(1, 25) AS series(num)  -- 每个用户生成25条额外记录
WHERE random() < 0.8;  -- 80%的概率生成，确保有足够数据但不会过多

-- 验证插入的数据 - 按用户统计
SELECT 
    pr.user_id,
    p.email,
    COUNT(*) as total_records,
    COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN pr.status = 'reviewing' THEN 1 END) as reviewing_count,
    COUNT(CASE WHEN pr.status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN pr.status = 'failed' THEN 1 END) as failed_count,
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
GROUP BY pr.user_id, p.email
ORDER BY total_records DESC;

-- 总体统计
SELECT 
    status,
    COUNT(*) as total_count,
    ROUND(AVG(amount_usdt), 2) as avg_amount,
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

-- 支付方式统计
SELECT 
    payment_method,
    COUNT(*) as count,
    ROUND(AVG(amount_usdt), 2) as avg_amount
FROM public.payment_records 
WHERE user_id IN (
    '16e92d09-1017-4b37-a010-a3a803d7c1d2',
    '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2',
    '3536deac-1baf-417d-92ba-f971f062b388',
    '35d48b81-f314-4a28-bc4e-0a5b364b258b',
    '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'
)
GROUP BY payment_method
ORDER BY count DESC;

-- 时间分布统计
SELECT 
    CASE 
        WHEN completed_at >= NOW() - INTERVAL '7 days' THEN '最近一周'
        WHEN completed_at >= NOW() - INTERVAL '30 days' THEN '最近一月'
        WHEN completed_at >= NOW() - INTERVAL '90 days' THEN '最近三月'
        WHEN completed_at >= NOW() - INTERVAL '180 days' THEN '最近半年'
        WHEN completed_at >= NOW() - INTERVAL '365 days' THEN '最近一年'
        ELSE '一年以上或未完成'
    END as time_period,
    COUNT(*) as count
FROM public.payment_records 
WHERE user_id IN (
    '16e92d09-1017-4b37-a010-a3a803d7c1d2',
    '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2',
    '3536deac-1baf-417d-92ba-f971f062b388',
    '35d48b81-f314-4a28-bc4e-0a5b364b258b',
    '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'
)
GROUP BY 
    CASE 
        WHEN completed_at >= NOW() - INTERVAL '7 days' THEN '最近一周'
        WHEN completed_at >= NOW() - INTERVAL '30 days' THEN '最近一月'
        WHEN completed_at >= NOW() - INTERVAL '90 days' THEN '最近三月'
        WHEN completed_at >= NOW() - INTERVAL '180 days' THEN '最近半年'
        WHEN completed_at >= NOW() - INTERVAL '365 days' THEN '最近一年'
        ELSE '一年以上或未完成'
    END
ORDER BY count DESC;

-- 显示成功消息
DO $$
DECLARE
    total_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records 
    FROM public.payment_records 
    WHERE user_id IN (
        '16e92d09-1017-4b37-a010-a3a803d7c1d2',
        '94c04f46-4862-44ab-9cb7-ff77dcf5cdd2',
        '3536deac-1baf-417d-92ba-f971f062b388',
        '35d48b81-f314-4a28-bc4e-0a5b364b258b',
        '8389a68d-02ba-4eca-8f4c-6ae32b8a8b73'
    );
    
    RAISE NOTICE '🎉 批量测试数据插入完成！';
    RAISE NOTICE '📊 总共为5个用户创建了 % 条付费记录', total_records;
    RAISE NOTICE '🔗 请访问付费明细页面查看效果：http://localhost:9002/payment-details';
    RAISE NOTICE '✨ 现在可以全面测试分页、筛选和排序功能了！';
    RAISE NOTICE '💡 提示：登录不同用户账号可以看到对应的付费记录';
END $$;