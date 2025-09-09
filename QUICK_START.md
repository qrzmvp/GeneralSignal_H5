# 🚀 快速启动指南

您的项目已经集成了 Supabase 认证系统！现在您可以看到项目运行正常，只需要配置 Supabase 即可启用完整的认证功能。

## 当前状态 ✅

- ✅ 项目正常运行在 http://localhost:9002
- ✅ Supabase 集成代码已完成
- ✅ 登录/注册页面已更新
- ✅ 路由保护已设置
- ⚠️ 需要配置 Supabase 环境变量

## 快速配置 Supabase

### 1. 创建 Supabase 项目
1. 访问 [supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 创建新项目并等待初始化完成

### 2. 获取项目配置
在 Supabase 项目面板中：
1. 点击 Settings（设置）
2. 点击 API
3. 复制 `Project URL` 和 `Project API keys` 中的 `anon` `public` key

### 3. 配置环境变量
编辑项目根目录的 `.env.local` 文件，替换为您的实际值：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 设置数据库
在 Supabase 项目的 SQL Editor 中运行 `supabase_setup.sql` 文件中的 SQL 代码。

### 5. 重启服务器
配置完成后，重启开发服务器即可使用完整功能！

## 功能演示

配置完成后，您将可以：

1. **访问首页** → 自动跳转到登录页面
2. **用户注册** → 邮箱 + 密码 + 用户名 + 邀请码（可选）
3. **邮箱验证** → 收到验证邮件并点击链接
4. **用户登录** → 邮箱 + 密码登录
5. **首页访问** → 登录后自动跳转到将军榜单页面
6. **登录状态** → 页面顶部显示用户信息和退出按钮

## 当前不配置的情况

如果暂时不配置 Supabase，项目会：
- 显示配置提示页面
- 不会出现错误
- 可以正常开发其他功能

## 需要帮助？

- 详细文档：`SUPABASE_SETUP.md`
- 数据库脚本：`supabase_setup.sql`
- 如有问题，随时联系我！
