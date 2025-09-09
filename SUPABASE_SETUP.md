# Supabase 集成说明

## 设置步骤

### 1. 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 等待项目初始化完成

### 2. 配置环境变量
在项目根目录的 `.env.local` 文件中设置以下变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

您可以在 Supabase 项目的 Settings > API 中找到这些值。

### 3. 设置数据库
在 Supabase 项目的 SQL Editor 中运行 `supabase_setup.sql` 文件中的所有 SQL 语句。

### 4. 配置邮箱认证
1. 在 Supabase 项目中，进入 Authentication > Settings
2. 确保 "Enable email confirmations" 已启用
3. 配置邮件模板（可选）
4. **重要：配置邮件发送服务**
   - 默认情况下，Supabase 使用内置邮件服务，但有限制
   - 对于生产环境，建议配置自定义 SMTP 服务
   - 在 Authentication > Settings > SMTP Settings 中配置

### 5. 邮箱服务配置（解决163等邮箱接收问题）
为了确保所有邮箱都能正常接收验证邮件，建议：

1. **配置自定义 SMTP**（推荐）：
   - 使用 SendGrid、AWS SES、或其他邮件服务
   - 在 Supabase Authentication > Settings > SMTP Settings 配置

2. **检查垃圾邮件过滤**：
   - 163、QQ 等邮箱可能会将验证邮件误判为垃圾邮件
   - 提醒用户检查垃圾邮件文件夹

3. **域名白名单**：
   - 确保发送域名没有被收件服务器拉黑
   - 配置 SPF、DKIM 记录提高送达率

## 功能说明

### 已实现的功能

1. **邮箱注册**
   - 用户使用邮箱和密码注册
   - 支持用户名设置
   - 支持邀请码（可选）
   - 注册后需要邮箱验证

2. **邮箱登录**
   - 使用邮箱和密码登录
   - 自动保持登录状态
   - 登录失败时显示错误信息

3. **登录状态管理**
   - 使用 React Context 管理认证状态
   - 自动刷新token
   - 持久化会话

4. **路由保护**
   - 未登录用户自动跳转到登录页
   - 首页需要登录才能访问

5. **用户界面**
   - 显示当前登录用户信息
   - 提供退出登录功能
   - 响应式设计

### 认证流程

1. 用户访问首页
2. 如果未登录，自动跳转到 `/login`
3. 用户可以选择登录或注册
4. 注册成功后，需要查收邮箱验证链接
5. 邮箱验证后，可以正常登录
6. 登录成功后跳转到首页（将军榜单）
7. 用户可以在首页查看个人信息和退出登录

### 数据库结构

- `auth.users`: Supabase 内置的用户表
- `public.profiles`: 扩展的用户资料表
  - id: 用户ID（关联 auth.users）
  - username: 用户名
  - email: 邮箱
  - invitation_code: 邀请码
  - created_at: 创建时间
  - updated_at: 更新时间

## 下一步功能扩展

1. **用户资料管理**
   - 修改用户名
   - 修改密码
   - 上传头像

2. **社交功能**
   - 用户关注/取消关注
   - 消息通知

3. **安全功能**
   - 密码重置
   - 两步验证

## 故障排除

### 常见问题

1. **环境变量未生效**
   - 确保 `.env.local` 文件在项目根目录
   - 重启开发服务器

2. **数据库错误**
   - 检查 SQL 脚本是否完整执行
   - 确认 RLS 策略正确设置

3. **邮箱验证问题**
   - 检查 Supabase 邮件设置
   - 查看垃圾邮件文件夹
   - 163/QQ 邮箱：检查"垃圾邮件"和"广告邮件"文件夹

4. **登录失败**
   - 确认邮箱已验证
   - 检查密码是否正确
   - 查看浏览器控制台错误信息

5. **重复注册问题**
   - 系统会检测已注册邮箱并提示
   - 如果删除用户后重新注册同一邮箱不发送邮件，请：
     - 等待几分钟后重试
     - 使用"重新发送验证邮件"功能
     - 检查 Supabase Authentication > Users 确认用户状态

6. **163/QQ等国内邮箱收不到邮件**
   - 原因：Supabase 默认邮件服务可能被国内邮箱过滤
   - 解决方案：
     - 配置自定义 SMTP 服务（如 SendGrid、腾讯企业邮等）
     - 提醒用户检查垃圾邮件文件夹
     - 使用企业邮箱或 Gmail 进行注册

7. **邮件发送频率限制**
   - Supabase 对邮件发送有频率限制
   - 如果短时间内多次请求，需要等待一段时间
   - 生产环境建议配置自定义 SMTP
