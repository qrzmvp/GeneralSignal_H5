# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## 将军榜单：示例交易员与头像种子

运行条件：
- 已在 Supabase 执行 `database_fix.sql` 的第 19 节（会创建 `public.traders` 表与 `trader-avatars` 桶）
- 已安装依赖：`npm install`

环境变量（脚本读取 `.env`）：
- `NEXT_PUBLIC_SUPABASE_URL`（项目 URL）
- `SERVICE_ROLE_KEY`（服务端密钥，仅用于脚本，不要暴露到浏览器）

快速开始：
- 新建 `.env` 文件并填入：
	- `NEXT_PUBLIC_SUPABASE_URL=...`
	- `SERVICE_ROLE_KEY=...`
- 执行：
```
npm run seed:traders
```
脚本会向 `public.traders` 插入 20 条示例交易员，并在 `trader-avatars` 桶为每人生成 `avatar.svg`。
