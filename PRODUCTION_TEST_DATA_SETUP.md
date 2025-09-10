# 🚀 生产环境测试数据部署指南

> **小白也能看懂的详细教程**  
> 本文档将指导您在生产环境中部署完整的测试数据，包括将军榜单交易员数据和会员系统测试数据。

---

## 📋 前提条件检查表

在开始之前，请确认以下条件已满足：

- ✅ **Supabase 项目已创建** - 您有访问生产环境的 Supabase 项目
- ✅ **基础数据库已设置** - 已执行过 `supabase_setup.sql` 和 `database_fix.sql`
- ✅ **管理员权限** - 您有 Supabase 项目的管理员权限
- ✅ **Service Role Key** - 您有项目的 Service Role 密钥

---

## 🎯 测试数据概览

本次部署将为您的生产环境添加以下测试数据：

### 📊 将军榜单数据
- **14 名虚拟交易员** - 包含完整的交易数据和头像
- **真实的收益率数据** - 20% ~ 300% 的收益率范围
- **胜率统计** - 50% ~ 98% 的胜率数据
- **交易标签** - 趋势、风控、波段、动量等标签

### 💰 会员系统数据
- **会员套餐** - 手动跟单和自动跟单套餐
- **支付记录** - 模拟各种支付状态的订单
- **支付配置** - TRC20 和 ERC20 的钱包地址配置

---

## 🚀 部署步骤

### 第一步：准备环境变量

1. **获取 Supabase 项目信息**
   
   进入您的 Supabase 项目控制台：
   ```
   https://supabase.com/dashboard/project/[your-project-id]
   ```

2. **获取必要的密钥**
   
   在 `Settings > API` 页面复制以下信息：
   ```bash
   # 项目 URL
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   
   # Service Role Key (重要：这个密钥有完整的数据库权限)
   SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
   ```

3. **创建环境变量文件**
   
   在项目根目录创建 `.env.local` 文件：
   ```bash
   # 将上面的信息填入
   NEXT_PUBLIC_SUPABASE_URL=your_actual_url_here
   SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

### 第二步：部署会员系统数据

1. **登录 Supabase SQL 编辑器**
   
   访问：`https://supabase.com/dashboard/project/[your-project-id]/sql`

2. **执行会员系统设置脚本**
   
   复制 `membership_system_setup.sql` 文件内容，粘贴到 SQL 编辑器中：
   
   ```sql
   -- 这个脚本会创建：
   -- ✅ membership_plans 表（会员套餐）
   -- ✅ payment_records 表（付费记录）
   -- ✅ payment_config 表（支付配置）
   -- ✅ 相关的 RLS 策略和索引
   ```

3. **点击 "RUN" 按钮执行**
   
   执行成功后，您将看到：
   ```
   Success. No rows returned
   ```

4. **插入会员套餐数据**
   
   继续在 SQL 编辑器中执行以下脚本：
   
   ```sql
   -- 手动跟单套餐
   INSERT INTO public.membership_plans (
       plan_type, duration_months, price_usdt, original_price_usdt, 
       title, description, features, sort_order
   ) VALUES 
   ('manual', 1, 29.90, 39.90, '手动跟单 · 1个月', '体验手动跟单服务', 
    '["查看信号", "手动跟单", "7x24客服"]', 1),
   ('manual', 3, 79.90, 99.90, '手动跟单 · 3个月', '短期手动跟单套餐', 
    '["查看信号", "手动跟单", "7x24客服", "优先支持"]', 2),
   ('manual', 12, 199.90, 299.90, '手动跟单 · 1年', '最受欢迎的年度套餐', 
    '["查看信号", "手动跟单", "7x24客服", "优先支持", "专属群组"]', 3),
   
   -- 自动跟单套餐
   ('auto', 1, 99.90, 129.90, '自动跟单 · 1个月', '全自动跟单体验', 
    '["实时信号", "自动跟单", "风险控制", "7x24客服"]', 4),
   ('auto', 3, 269.90, 329.90, '自动跟单 · 3个月', '季度自动跟单套餐', 
    '["实时信号", "自动跟单", "风险控制", "7x24客服", "收益分析"]', 5),
   ('auto', 12, 899.90, 1199.90, '自动跟单 · 1年', '专业交易员首选', 
    '["实时信号", "自动跟单", "风险控制", "7x24客服", "收益分析", "VIP专属"]', 6);
   ```

5. **插入支付配置**
   
   ```sql
   -- 支付钱包地址配置
   INSERT INTO public.payment_config (
       payment_method, wallet_address, network_name, is_active
   ) VALUES 
   ('TRC20', 'TXYZ...abcd...efgh', 'TRON Network', true),
   ('ERC20', '0x12...cdef...3456', 'Ethereum Network', true);
   ```

### 第三步：部署将军榜单数据

1. **在本地终端执行脚本**
   
   确保您在项目根目录下，然后运行：
   
   ```bash
   # 安装必要的依赖（如果还没有安装）
   npm install
   
   # 执行交易员数据种子脚本
   npx tsx scripts/seed-traders.ts
   ```

2. **验证执行结果**
   
   成功执行后，您会看到类似输出：
   ```
   Supabase project ref (from URL): your-project-ref
   Sanity check OK (can access traders).
   upserted: WWG-Woods
   upserted: WWG-Jonh
   upserted: WWG-Hbj
   upserted: 量化大师
   upserted: 趋势猎人
   upserted: 波段之王
   upserted: 合约常胜军
   upserted: BTC信仰者
   upserted: 短线快枪手
   upserted: ETH布道者
   upserted: Alpha Seeker
   upserted: 狙击涨停板
   upserted: 抄底王
   upserted: 币圈巴菲特
   Done.
   ```

### 第四步：创建测试用户并添加付费记录

1. **创建测试用户**
   
   在您的应用中注册几个测试用户：
   ```
   test1@yourdomain.com
   test2@yourdomain.com
   test3@yourdomain.com
   ```

2. **获取用户 ID**
   
   在 Supabase `Authentication > Users` 页面查看用户 ID，或在 SQL 编辑器中执行：
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
   ```

3. **为用户添加付费记录**
   
   将下面脚本中的 `USER_ID_HERE` 替换为实际的用户 ID：
   ```sql
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
   -- 成功的订单
   ('USER_ID_HERE'::uuid, 
    (SELECT id FROM public.membership_plans WHERE title LIKE '%手动跟单 · 1年%' LIMIT 1),
    'TRC20', 'TXYZ...abcd...efgh', 'TXabc123...', 199.90,
    'a1b2c3d4e5f67890...', 'completed', '手动跟单 · 1年',
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '1 year' - INTERVAL '10 days',
    '支付成功，会员已激活'),
   
   -- 待审核的订单  
   ('USER_ID_HERE'::uuid,
    (SELECT id FROM public.membership_plans WHERE title LIKE '%自动跟单 · 3个月%' LIMIT 1),
    'TRC20', 'TXYZ...abcd...efgh', 'TXdef456...', 269.90,
    'b2c3d4e5f67890...', 'reviewing', '自动跟单 · 3个月',
    NULL, NULL, '等待管理员审核确认'),
   
   -- 失败的订单
   ('USER_ID_HERE'::uuid,
    (SELECT id FROM public.membership_plans WHERE title LIKE '%手动跟单 · 1个月%' LIMIT 1),
    'ERC20', '0x12...cdef...3456', '0x987654...', 29.90,
    NULL, 'failed', '手动跟单 · 1个月',
    NULL, NULL, '支付超时，订单已取消');
   ```

### 第五步：批量添加大量测试数据（可选）

如果您需要大量的测试数据来测试分页和筛选功能：

1. **使用批量插入脚本**
   
   执行 `insert_bulk_test_payment_data.sql` 文件：
   ```sql
   -- 这个脚本会为每个用户创建 20+ 条付费记录
   -- 包含各种状态：completed, pending, reviewing, failed
   -- 包含各种支付方式：TRC20, ERC20
   ```

---

## ✅ 验证部署结果

### 1. 验证将军榜单数据

访问您的应用首页，检查：
- ✅ 将军榜单显示 14 名交易员
- ✅ 每个交易员有头像、收益率、胜率等信息
- ✅ 可以点击进入交易员详情页面

### 2. 验证会员系统数据

访问会员页面 `/membership`，检查：
- ✅ 手动跟单标签显示 3 个套餐
- ✅ 自动跟单标签显示 3 个套餐  
- ✅ 每个套餐显示正确的价格和功能

### 3. 验证付费记录数据

登录测试用户账号，访问 `/payment-details`，检查：
- ✅ 显示用户的付费记录
- ✅ 不同状态的订单显示不同颜色
- ✅ 分页功能正常工作

---

## 🔧 故障排除

### 问题 1：权限错误
```
error: permission denied for table traders
```
**解决方案：**
- 检查 `SERVICE_ROLE_KEY` 是否正确
- 确保使用的是 Service Role Key，不是 anon key

### 问题 2：表不存在
```
error: relation "traders" does not exist
```
**解决方案：**
- 确保已执行 `supabase_setup.sql` 和 `database_fix.sql`
- 检查数据库迁移是否完整

### 问题 3：环境变量未找到
```
Missing env: NEXT_PUBLIC_SUPABASE_URL
```
**解决方案：**
- 检查 `.env.local` 文件是否在项目根目录
- 确认环境变量名称拼写正确
- 重启终端后重新执行

### 问题 4：RLS 策略阻止访问
```
error: new row violates row-level security policy
```
**解决方案：**
- 检查 RLS 策略是否正确设置
- 确认当前用户有正确的权限
- 可以临时禁用 RLS 进行测试

---

## 🎉 恭喜完成！

现在您的生产环境已经拥有了完整的测试数据：

- 📊 **14 名交易员** 在将军榜单中展示
- 💰 **6 个会员套餐** 供用户选择
- 📝 **模拟付费记录** 用于测试各种场景
- ⚙️ **支付配置** 支持 TRC20 和 ERC20

您可以开始进行全面的功能测试，或者向您的用户展示完整的产品功能了！

---

## 📚 相关文档

- [总体部署指南](./DEPLOYMENT_GUIDE.md)
- [Supabase 设置指南](./SUPABASE_SETUP.md)
- [功能测试指南](./FEATURE_TESTING_GUIDE.md)
- [邮件调试指南](./EMAIL_DEBUG_GUIDE.md)

---

## 🆘 需要帮助？

如果在部署过程中遇到任何问题：

1. 检查本文档的故障排除部分
2. 查看 Supabase 控制台的错误日志
3. 确认所有环境变量都正确设置
4. 联系技术支持团队

**记住：这些都是测试数据，在真实生产环境中使用时请务必替换为真实的业务数据！**
