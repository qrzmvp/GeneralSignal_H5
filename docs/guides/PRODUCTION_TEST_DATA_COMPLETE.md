# 🚀 生产环境测试数据一键部署指南

> **让生产环境拥有与 dev-2 完全相同的测试数据**  
> 包含将军榜单交易员数据 + 会员系统完整数据

---

## 📋 部署清单

完成本指南后，您的生产环境将拥有：

- ✅ **14名交易员** - 完整的将军榜单数据
- ✅ **6个会员套餐** - 手动跟单 + 自动跟单套餐
- ✅ **支付配置** - TRC20 和 ERC20 钱包地址
- ✅ **测试订单** - 各种状态的付费记录样本

---

## 🎯 第一步：会员系统基础数据

### 1.1 登录 Supabase SQL 编辑器

访问您的生产环境 Supabase 项目：
```
https://supabase.com/dashboard/project/[your-project-id]/sql
```

### 1.2 创建会员系统表结构（如果未创建）

复制以下 SQL 到编辑器并执行：

```sql
-- =============================================
-- 会员系统表结构 + 基础数据一键部署
-- =============================================

-- 1. 会员套餐表
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type text NOT NULL CHECK (plan_type IN ('manual', 'auto')),
  duration_months integer NOT NULL CHECK (duration_months > 0),
  price_usdt numeric(10,2) NOT NULL CHECK (price_usdt >= 0),
  original_price_usdt numeric(10,2) NOT NULL CHECK (original_price_usdt >= 0),
  title text NOT NULL,
  description text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 付费记录表
CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.membership_plans(id),
  payment_method text NOT NULL CHECK (payment_method IN ('TRC20', 'ERC20')),
  payment_address text NOT NULL,
  sender_address text,
  amount_usdt numeric(10,2) NOT NULL CHECK (amount_usdt > 0),
  transaction_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reviewing')),
  payment_type text NOT NULL,
  completed_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 支付配置表
CREATE TABLE IF NOT EXISTS public.payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method text NOT NULL UNIQUE CHECK (payment_method IN ('TRC20', 'ERC20')),
  wallet_address text NOT NULL,
  network_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_membership_plans_type_active ON public.membership_plans(plan_type, is_active);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON public.payment_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON public.payment_records(status, created_at DESC);

-- 5. 设置 RLS 策略
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "membership_plans_select_all" ON public.membership_plans;
DROP POLICY IF EXISTS "payment_records_select_own" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_insert_own" ON public.payment_records;
DROP POLICY IF EXISTS "payment_config_select_all" ON public.payment_config;

-- 创建策略
CREATE POLICY "membership_plans_select_all" ON public.membership_plans FOR SELECT USING (is_active = true);
CREATE POLICY "payment_records_select_own" ON public.payment_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "payment_records_insert_own" ON public.payment_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payment_config_select_all" ON public.payment_config FOR SELECT USING (is_active = true);

-- 6. 授权
GRANT SELECT ON public.membership_plans TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.payment_records TO authenticated;
GRANT SELECT ON public.payment_config TO authenticated, anon;
```

### 1.3 插入会员套餐数据

继续执行以下 SQL：

```sql
-- 清除旧数据（如果需要重新部署）
-- DELETE FROM public.membership_plans;

-- 插入完整的会员套餐数据
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
 '["实时信号推送", "全自动跟单", "智能风险控制", "7x24小时客服", "实时收益监控", "高级策略分析", "个性化风控设置", "VIP专属服务", "一对一策略指导"]'::jsonb, 6, true);

-- 插入支付配置
INSERT INTO public.payment_config (
    payment_method, wallet_address, network_name, is_active
) VALUES 
('TRC20', 'TXYZ...abcd...efgh', 'TRON Network', true),
('ERC20', '0x12...cdef...3456', 'Ethereum Network', true)
ON CONFLICT (payment_method) DO UPDATE SET
    wallet_address = EXCLUDED.wallet_address,
    network_name = EXCLUDED.network_name,
    is_active = EXCLUDED.is_active;
```

---

## 🎯 第二步：将军榜单交易员数据

### 2.1 确保交易员表存在

```sql
-- 检查交易员表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS public.traders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  yield_rate numeric(8,2),
  win_rate numeric(5,2),
  profit_loss_ratio numeric(6,2),
  total_signals integer DEFAULT 0,
  avatar_url text,
  tags text[],
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_traders_yield_rate ON public.traders(yield_rate DESC);
CREATE INDEX IF NOT EXISTS idx_traders_win_rate ON public.traders(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_traders_name ON public.traders(name);

-- 设置 RLS
ALTER TABLE public.traders ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "traders_select_all" ON public.traders;

-- 创建策略：所有人可查看交易员
CREATE POLICY "traders_select_all" ON public.traders FOR SELECT USING (true);

-- 授权
GRANT SELECT ON public.traders TO authenticated, anon;
```

### 2.2 插入完整交易员数据

```sql
-- 清除旧的交易员数据（如果需要重新部署）
-- DELETE FROM public.traders;

-- 插入14名交易员的完整数据
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
 ARRAY['价值投资', '长期持有', '基本面分析']);
```

---

## 🎯 第三步：创建测试用户和付费记录

### 3.1 创建测试用户

在您的应用中注册以下测试用户（或使用现有用户）：
```
test1@yourapp.com
test2@yourapp.com  
test3@yourapp.com
```

### 3.2 获取用户ID并插入付费记录

```sql
-- 先查看现有用户
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- 为用户创建测试付费记录（替换下面的 USER_ID_1, USER_ID_2 等为实际用户ID）
-- 注意：请将 'USER_ID_HERE' 替换为实际的用户UUID

-- 示例：如果您的用户ID是 '12345678-1234-1234-1234-123456789012'
-- 就将下面所有的 'USER_ID_1' 替换为该ID

INSERT INTO public.payment_records (
    user_id, plan_id, payment_method, payment_address, sender_address,
    amount_usdt, transaction_hash, status, payment_type, 
    completed_at, expires_at, notes
)
SELECT 
    user_id::uuid,
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
FROM (
    VALUES 
    -- 用户1的记录 - 请替换 'USER_ID_1' 为实际用户ID
    ('USER_ID_1', 
     (SELECT id FROM public.membership_plans WHERE title LIKE '%手动跟单 · 1年%' LIMIT 1),
     'TRC20', 'TXYZ...abcd...efgh', 'TXabc123def456ghi789jkl012mno345pqr678',
     199.90, 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
     'completed', '手动跟单 · 1年',
     NOW() - INTERVAL '15 days', NOW() + INTERVAL '1 year' - INTERVAL '15 days',
     '支付成功，会员已激活'),
     
    ('USER_ID_1',
     (SELECT id FROM public.membership_plans WHERE title LIKE '%自动跟单 · 3个月%' LIMIT 1),
     'TRC20', 'TXYZ...abcd...efgh', 'TXdef456ghi789jkl012mno345pqr678stu901',
     269.90, 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a',
     'reviewing', '自动跟单 · 3个月',
     NULL, NULL, '等待管理员审核确认'),
     
    ('USER_ID_1',
     (SELECT id FROM public.membership_plans WHERE title LIKE '%手动跟单 · 1个月%' LIMIT 1),
     'ERC20', '0x12...cdef...3456', '0x9876543210abcdef9876543210abcdef98765432',
     29.90, NULL, 'failed', '手动跟单 · 1个月',
     NULL, NULL, '支付超时，订单已取消'),
     
    -- 用户2的记录 - 请替换 'USER_ID_2' 为实际用户ID  
    ('USER_ID_2',
     (SELECT id FROM public.membership_plans WHERE title LIKE '%自动跟单 · 1年%' LIMIT 1),
     'TRC20', 'TXYZ...abcd...efgh', 'TXghi789jkl012mno345pqr678stu901vwx234',
     899.90, 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2',
     'completed', '自动跟单 · 1年',
     NOW() - INTERVAL '30 days', NOW() + INTERVAL '1 year' - INTERVAL '30 days',
     'VIP用户，享受最高级别服务'),
     
    ('USER_ID_2',
     (SELECT id FROM public.membership_plans WHERE title LIKE '%手动跟单 · 3个月%' LIMIT 1),
     'ERC20', '0x12...cdef...3456', '0x1234567890abcdef1234567890abcdef12345678',
     79.90, 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567abc3',
     'pending', '手动跟单 · 3个月',
     NULL, NULL, '支付凭证已提交，等待区块链确认')
     
) AS payment_data(
    user_id, plan_id, payment_method, payment_address, sender_address,
    amount_usdt, transaction_hash, status, payment_type,
    completed_at, expires_at, notes
);
```

---

## 🎯 第四步：验证部署结果

### 4.1 验证交易员数据

```sql
-- 检查交易员数据
SELECT 
    name, 
    yield_rate, 
    win_rate, 
    total_signals,
    array_length(tags, 1) as tag_count
FROM public.traders 
ORDER BY yield_rate DESC;

-- 应该返回14行数据
```

### 4.2 验证会员套餐数据

```sql
-- 检查会员套餐
SELECT 
    plan_type,
    title,
    price_usdt,
    original_price_usdt,
    is_active,
    sort_order
FROM public.membership_plans 
ORDER BY sort_order;

-- 应该返回6个套餐（3个手动 + 3个自动）
```

### 4.3 验证付费记录

```sql
-- 检查付费记录
SELECT 
    pr.payment_type,
    pr.status,
    pr.amount_usdt,
    pr.payment_method,
    u.email
FROM public.payment_records pr
JOIN auth.users u ON pr.user_id = u.id
ORDER BY pr.created_at DESC;
```

### 4.4 验证支付配置

```sql
-- 检查支付配置
SELECT payment_method, wallet_address, network_name, is_active 
FROM public.payment_config;
```

---

## ✅ 完成检查清单

部署完成后，请验证以下功能：

- [ ] **首页将军榜** - 显示14名交易员，按收益率排序
- [ ] **交易员详情** - 点击交易员可查看详细信息
- [ ] **会员页面** - 手动跟单和自动跟单各显示3个套餐
- [ ] **套餐价格** - 显示原价和现价，有折扣标识
- [ ] **付费明细** - 登录测试用户可查看付费记录
- [ ] **支付页面** - 显示TRC20和ERC20支付选项

---

## 🚨 重要提醒

1. **替换用户ID**: 在第三步中，请务必将 `USER_ID_1`, `USER_ID_2` 等替换为实际的用户UUID
2. **钱包地址**: 记得更新 `payment_config` 表中的钱包地址为您的真实地址
3. **数据安全**: 这些是测试数据，在正式运营时请替换为真实数据
4. **权限验证**: 确保所有RLS策略都已正确设置

---

## 🎉 部署完成！

现在您的生产环境已经拥有了与 dev-2 环境完全相同的测试数据！

用户可以：
- 浏览将军榜单和交易员详情
- 查看和购买会员套餐  
- 体验完整的支付流程
- 查看付费记录和会员状态

开始您的产品演示吧！ 🚀
