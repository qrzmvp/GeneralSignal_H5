# Supabase 邮件发送问题排查指南

## 当前问题
用户注册和重发邮件验证时，无法收到邮件验证链接。

## 排查步骤

### 1. 检查 Supabase 项目配置

访问 Supabase Dashboard > Authentication > Settings：

1. **确认邮件服务启用**
   - 检查 "Enable email confirmations" 是否已开启
   - 确认 "Confirm email" 开关已打开

2. **检查邮件模板**
   - 在 Authentication > Email Templates 中
   - 确认 "Confirm signup" 模板存在且内容正确
   - 检查模板中的链接格式：`{{ .ConfirmationURL }}`

3. **验证重定向 URL**
   - 在 Authentication > URL Configuration 中
   - 添加允许的重定向 URL：`http://localhost:3001/login?verified=true`
   - 如果是生产环境，添加生产域名

### 2. 检查代码配置

1. **环境变量验证**
   ```bash
   # .env.local 文件内容
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **注册代码检查**
   - 确认 `emailRedirectTo` 参数设置正确
   - 验证用户数据结构符合预期

### 3. 常见问题及解决方案

#### 问题 1: 邮件服务未配置
**症状**: 注册成功但完全不发送邮件  
**解决**: 
- 在 Supabase Dashboard 中启用邮件确认功能
- 检查 Authentication > Settings > "Enable email confirmations"

#### 问题 2: 邮件被过滤
**症状**: 邮件发送但用户收不到  
**解决**:
- 检查垃圾邮件文件夹
- 对于国内邮箱（163、QQ等），配置自定义 SMTP
- 建议用户使用 Gmail 或企业邮箱

#### 问题 3: 重定向 URL 未授权
**症状**: 邮件发送但点击链接出错  
**解决**:
- 在 Supabase > Authentication > URL Configuration 中添加重定向 URL
- 确保 URL 完全匹配（包括协议、端口等）

#### 问题 4: 用户已存在但未验证
**症状**: 提示用户已注册但实际未完成验证  
**解决**:
- 使用重发邮件功能
- 或在 Supabase Dashboard 中删除用户后重新注册

### 4. 自定义 SMTP 配置（推荐）

为了确保邮件投递率，特别是对国内用户，建议配置自定义 SMTP：

1. **选择邮件服务商**
   - SendGrid（国际）
   - 腾讯企业邮（国内）
   - 阿里云邮件推送（国内）

2. **在 Supabase 中配置**
   - Authentication > Settings > SMTP Settings
   - 输入 SMTP 服务器信息

### 5. 实时调试方法

1. **查看浏览器控制台**
   - 打开开发者工具 > Console
   - 查看详细的注册和邮件发送日志

2. **检查 Supabase Dashboard**
   - Authentication > Users 查看用户状态
   - Logs 查看实时日志

3. **使用调试页面**
   - 访问 `/debug` 路径进行系统检查

### 6. 测试邮件功能

```javascript
// 测试注册邮件
const testEmailSending = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@yourdomain.com',
    password: 'testpass123',
    options: {
      emailRedirectTo: `${window.location.origin}/login?verified=true`
    }
  })
  
  console.log('Test result:', { data, error })
}
```

## 当前代码增强

已添加的日志功能：
- 详细的注册过程日志
- Supabase 响应完整记录
- 邮件重发过程追踪
- 环境配置验证

## 下一步操作

1. 访问 `/debug` 页面查看系统状态
2. 检查浏览器控制台的详细日志
3. 验证 Supabase 项目的邮件设置
4. 考虑配置自定义 SMTP 服务

## 联系支持

如果问题持续存在：
1. 记录浏览器控制台的完整错误信息
2. 截图 Supabase Dashboard 的邮件配置
3. 提供测试邮箱地址和注册时间
