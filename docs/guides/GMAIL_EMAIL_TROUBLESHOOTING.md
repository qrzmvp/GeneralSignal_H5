# 🚨 Gmail 收不到 Supabase 验证邮件 - 解决方案

## 立即检查清单

### 1. 📧 Gmail 邮箱检查（99%的问题在这里）

#### 步骤1: 检查垃圾邮件文件夹
1. 登录 Gmail
2. 点击左侧"垃圾邮件"文件夹
3. 搜索来自 "supabase" 或 "noreply" 的邮件

#### 步骤2: 检查促销邮件标签
1. 在 Gmail 主界面
2. 点击"促销"标签页
3. 查找验证邮件

#### 步骤3: 搜索所有邮件
1. 在 Gmail 搜索框输入: `from:noreply@mail.app.supabase.io`
2. 或搜索: `subject:确认`
3. 或搜索: `qrzmvp@gmail.com`

### 2. ⏰ 等待时间
- Supabase 邮件可能需要 2-5 分钟才能到达
- 某些情况下可能需要 15-30 分钟

### 3. 🔧 Supabase Dashboard 配置检查

点击绿色按钮 "🌐 打开 Supabase Dashboard" 然后检查：

#### Authentication > Settings
- ✅ "Enable email confirmations" 必须开启
- ✅ "Confirm email" 必须开启

#### Authentication > Email Templates
- ✅ "Confirm signup" 模板必须存在
- ✅ 模板内容应包含 `{{ .ConfirmationURL }}`

#### Authentication > URL Configuration
- ✅ 添加重定向 URL: `http://localhost:3001/login?verified=true`

### 4. 🛠️ 如果仍然收不到邮件

#### 方案A: 使用不同的邮箱测试
```
尝试用以下类型的邮箱注册：
- @outlook.com
- @hotmail.com  
- @yahoo.com
```

#### 方案B: 配置自定义 SMTP（推荐）
1. 在 Supabase Dashboard > Authentication > Settings
2. 向下滚动找到 "SMTP Settings"
3. 配置自定义邮件服务（如 Gmail SMTP、SendGrid 等）

#### 方案C: 检查 Supabase 项目限制
- 免费计划每小时邮件发送数量有限制
- 检查是否触达发送限制

### 5. 🔍 调试技巧

1. **查看 Supabase Dashboard Logs**
   - Authentication > Logs
   - 查看邮件发送记录

2. **检查项目状态**
   - Project Settings > General
   - 确认项目状态正常

### 6. ⚡ 临时解决方案

如果急需验证邮箱，可以：

1. **直接在 Supabase Dashboard 确认用户**
   - Authentication > Users
   - 找到你的用户
   - 点击用户邮箱旁的 "Confirm" 按钮

2. **删除用户重新注册**
   - 删除现有用户
   - 等待 5 分钟
   - 重新注册

## 🎯 下一步操作

1. **首先**: 仔细检查 Gmail 的垃圾邮件和促销文件夹
2. **其次**: 等待 10-15 分钟再检查一次
3. **然后**: 检查 Supabase Dashboard 配置
4. **最后**: 考虑配置自定义 SMTP

## 📞 如果问题持续

请提供以下信息：
- 是否检查了垃圾邮件文件夹
- 等待了多长时间
- Supabase Dashboard 中的配置截图
- 其他邮箱是否可以正常接收
