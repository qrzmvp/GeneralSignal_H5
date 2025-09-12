# 🛠️ 数据库错误修复指南

## 问题描述
注册新用户时出现 "Database error saving new user" 错误，这表明数据库表结构或权限配置有问题。

## 🚨 立即修复步骤

### 1. 登录 Supabase Dashboard
1. 访问：https://supabase.com/dashboard
2. 选择你的项目：`kghjjjblifsfkbgweumj`

### 2. 执行数据库修复 SQL
1. 点击左侧菜单：**SQL Editor**
2. 点击 **"New query"**
3. 复制粘贴 `database_fix.sql` 文件中的所有内容
4. 点击 **"Run"** 执行

### 3. 检查表结构
在 SQL Editor 中执行：
```sql
-- 检查 profiles 表是否存在
SELECT * FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 检查表结构
\d profiles;

-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 4. 验证修复
1. 重新尝试注册用户
2. 检查是否还有数据库错误

## 🔍 常见问题排查

### 问题1: profiles 表不存在
**解决**: 执行 `database_fix.sql` 中的表创建语句

### 问题2: RLS 策略配置错误
**解决**: 重新设置 RLS 策略，允许用户注册时插入数据

### 问题3: 触发器函数未正确创建
**解决**: 重新创建 `handle_new_user()` 函数和触发器

### 问题4: 权限不足
**解决**: 确保 authenticated 和 anon 角色有正确的表权限

## 🎯 手动验证步骤

### 1. 检查用户创建
在 SQL Editor 中：
```sql
-- 查看最近创建的用户
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

### 2. 检查 profiles 表
```sql
-- 查看 profiles 表数据
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
```

### 3. 测试插入权限
```sql
-- 测试是否可以插入数据（替换为实际的用户ID）
INSERT INTO profiles (id, email, username) 
VALUES ('test-uuid', 'test@example.com', 'testuser');
```

## 🆘 如果修复失败

### 方案A: 重新创建表
1. 备份现有数据（如果有）
2. 删除 profiles 表
3. 重新执行 `database_fix.sql`

### 方案B: 检查项目设置
1. 确认项目没有暂停
2. 检查数据库连接状态
3. 验证API密钥权限

### 方案C: 联系支持
如果问题持续，请提供：
- 完整的错误消息
- Supabase 项目 ID
- 执行的 SQL 语句结果

## ✅ 修复完成检查清单

- [ ] profiles 表已创建
- [ ] RLS 策略已正确设置
- [ ] 触发器函数正常工作
- [ ] 权限配置正确
- [ ] 新用户注册测试成功

执行完 `database_fix.sql` 后，重新尝试注册用户，应该不会再出现数据库错误。
