# 头像编辑功能使用说明

## 功能概述

本功能为GeneralSignal_H5项目添加了完整的用户头像编辑功能，包括：
- 头像上传（拍摄/相册选择）
- 图片裁剪和缩放
- 实时圆形预览
- Supabase存储集成
- 错误处理和用户反馈

## 新增文件

### 1. SQL配置文件
- `setup_avatar_storage.sql` - Supabase存储桶和RLS策略配置

### 2. 工具函数库
- `src/lib/avatar-utils.ts` - 头像相关的工具函数和类型定义

### 3. 组件更新
- `src/app/components/AvatarEditor.tsx` - 头像编辑器组件（已优化）
- `src/app/profile/page.tsx` - 个人信息页面（已集成头像编辑）

## 使用步骤

### 1. 配置Supabase存储
在Supabase项目中执行SQL脚本：
```sql
-- 执行 setup_avatar_storage.sql 文件内容
```

### 2. 启动项目
```bash
cd /Users/qrz/Desktop/GeneralSignal_H5
npm run dev
# 如果端口9002被占用，使用其他端口
npx next dev --turbopack -p 3001
```

### 3. 访问功能
1. 打开浏览器访问 http://localhost:3001
2. 登录用户账号
3. 进入"我的"页面
4. 点击头像区域进行编辑

## 功能特性

### 头像编辑器功能
- **图片选择**：支持拍摄或从相册选择
- **格式验证**：仅支持JPG、PNG、WebP格式
- **大小限制**：最大5MB
- **实时裁剪**：1:1比例正方形裁剪
- **缩放调节**：0.5x - 3.0x缩放范围
- **圆形预览**：160x160像素实时预览
- **高质量输出**：400x400像素，90%JPEG质量

### 用户界面
- **悬停效果**：鼠标悬停头像显示编辑提示
- **编辑图标**：右下角相机图标提示可编辑
- **Sheet弹窗**：从底部滑出的编辑界面
- **响应式设计**：适配移动端操作

### 存储管理
- **自动清理**：上传新头像时删除旧文件
- **路径管理**：用户ID/时间戳.jpg命名规则
- **权限控制**：RLS策略确保用户只能管理自己的头像
- **缓存优化**：3600秒缓存控制

## 技术实现

### 依赖库
- `react-image-crop`: 图片裁剪功能
- `@supabase/supabase-js`: 存储和数据库操作
- `lucide-react`: 图标组件
- `@radix-ui/react-*`: UI组件库

### 核心工具函数
```typescript
// 文件验证
validateAvatarFile(file: File): AvatarValidationResult

// 头像上传
uploadAvatar(options: AvatarUploadOptions): Promise<AvatarUploadResult>

// 更新用户资料
updateUserAvatarUrl(userId: string, avatarUrl: string)

// 删除头像
deleteUserAvatar(userId: string, avatarUrl: string)

// 显示URL处理
getAvatarDisplayUrl(avatarUrl?: string | null): string
```

### 配置常量
```typescript
export const AVATAR_CONFIG = {
  BUCKET_NAME: 'avatars',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  OUTPUT_SIZE: 400, // 输出尺寸
  PREVIEW_SIZE: 160, // 预览尺寸
  JPEG_QUALITY: 0.9 // 压缩质量
}
```

## 安全考虑

### 文件验证
- 前端验证文件类型和大小
- 后端Supabase存储桶限制
- MIME类型白名单

### 权限控制
- RLS策略限制用户只能访问自己的文件
- 身份验证检查
- 文件路径隔离（用户ID作为文件夹）

### 数据保护
- 自动删除旧文件防止存储空间浪费
- 错误处理防止敏感信息泄露
- 上传失败时的回滚机制

## 错误处理

### 常见错误及解决方案
1. **"图片大小不能超过5MB"** - 选择更小的图片文件
2. **"仅支持JPG、PNG、WebP格式"** - 使用支持的图片格式
3. **"网络连接失败"** - 检查网络连接和Supabase配置
4. **"权限不足"** - 确认用户已登录且RLS策略正确配置

### 调试信息
所有错误都会记录到浏览器控制台，包括：
- 文件验证失败原因
- 上传过程中的具体错误
- Supabase操作的详细信息

## 性能优化

### 客户端优化
- Canvas压缩减少上传时间
- 及时释放ObjectURL防止内存泄漏
- 图片尺寸标准化

### 服务端优化
- CDN缓存控制
- 文件压缩
- 按需加载

### 用户体验
- 加载状态提示
- 操作反馈Toast
- 流畅的动画过渡

## 测试建议

### 功能测试
1. 测试不同格式的图片上传
2. 测试大尺寸图片的处理
3. 测试网络中断时的错误处理
4. 测试多次连续操作的稳定性

### 兼容性测试
1. 不同浏览器的兼容性
2. 移动端触摸操作
3. 网络条件较差时的表现

### 安全测试
1. 尝试上传非图片文件
2. 测试超大文件的拒绝
3. 验证权限隔离是否有效

## 后续优化建议

### 功能增强
- 添加图片滤镜效果
- 支持多种裁剪比例
- 添加头像历史记录
- 支持从URL导入头像

### 性能提升
- 实现图片懒加载
- 添加离线缓存
- 优化大图片的处理速度

### 用户体验
- 添加更多动画效果
- 支持键盘快捷键
- 提供更多自定义选项

## 维护说明

### 定期检查
- 监控存储空间使用情况
- 检查RLS策略是否正常工作
- 验证图片压缩质量是否满足需求

### 版本更新
- 关注react-image-crop库的更新
- 跟进Supabase API的变化
- 更新依赖库的安全补丁