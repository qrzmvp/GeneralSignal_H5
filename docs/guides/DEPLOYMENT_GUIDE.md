## 部署指南（Vercel + Supabase）

本项目使用 Next.js + Vercel + Supabase。本文档说明如何区分“预览环境（Preview）”与“生产环境（Production）”的部署步骤、环境变量、数据库与鉴权配置、回滚与排错要点。

---

## 环境配置步骤（精简版）

以下步骤按“需要人工/自动完成”标注。

### 本地开发（local）
### 本地开发（Local）
 人工：在项目根创建 `.env.local`，设置：
   `NEXT_PUBLIC_SUPABASE_URL=<你的预览或开发 Supabase 项目 URL>`
   `NEXT_PUBLIC_SUPABASE_ANON_KEY=<对应 anon key>`
 人工：如需，提高到达率可配置 SMTP（可选）。
 人工：运行开发服务并冒烟测试（注册/验证/登录/登出）。

### 开发环境（Dev / 长期开发服）
 - 目的：提供一个长期存在、可共享访问的“开发服”，与临时 Preview（按分支/PR）区分。
 - 建议：固定分支（如 `dev`/`develop`）+ 独立 Supabase Dev 项目 + 独立域名（如 `https://dev.yourdomain.com`）。
 - 人工（Vercel 分支级变量或 Preview 变量组）：
   - `NEXT_PUBLIC_SUPABASE_URL=<Dev Supabase 项目 URL>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<Dev anon key>`
 - 人工（Supabase Dev 项目）：执行 `supabase_setup.sql`、`database_fix.sql`；启用 Email；URL Configuration 添加 `https://dev.yourdomain.com/login?verified=true`（或固定 Preview 域名）。
 - 可选人工：配置 SMTP；必要时定期清理测试账号。
 - 自动：推送到 `dev` 分支即自动部署；若已绑定域名可直接访问 Dev 域名。
 - 人工：在 Dev 域名完成冒烟测试，作为团队日常联调与验收环境。
- 人工：Authentication 中启用 Email，URL Configuration 添加 `http://localhost:9002/login?verified=true`（端口按本地实际）。
- 人工：如需，提高到达率可配置 SMTP（可选）。
- 人工：运行开发服务并冒烟测试（注册/验证/登录/登出）。

### 预览环境（Preview / 分支或 PR）
- 开发环境（Dev / 长期开发服）
  - 使用固定分支（如 `dev`/`develop`）形成稳定的共享测试环境；绑定独立域名与独立 Supabase Dev 项目。
- 人工（Vercel Preview 环境变量）：
  - `NEXT_PUBLIC_SUPABASE_URL=<预览 Supabase 项目 URL>`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<预览 anon key>`
- 人工（Supabase 预览项目）：执行 `supabase_setup.sql` 与 `database_fix.sql`；启用 Email，URL Configuration 添加预览域名回跳；可选配置 SMTP。
- 自动：推送到分支/提交 PR 即触发 Vercel 预览构建并生成预览链接。
- 人工：在预览链接完成冒烟测试；调试页仅用于预览/本地，务必在生产保持占位模式。

### 生产环境（Production / main）
- 人工（Vercel Production 环境变量）：
  - `NEXT_PUBLIC_SUPABASE_URL=<生产 Supabase 项目 URL>`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<生产 anon key>`
- 人工（Supabase 生产项目）：执行 `supabase_setup.sql` 与 `database_fix.sql`；启用 Email，URL Configuration 添加正式域名回跳；强烈建议配置 SMTP。
- 自动：合并到 `main` 或在 Vercel 上 Promote to Production 即触发生产构建与部署；绑定主域。
- 人工：生产冒烟测试；如有异常，可在 Vercel 一键回滚到上一个成功版本。

### 协作流程（建议）
- 人工：feature/* 分支开发 → 提交 PR。
- 自动：Vercel 为 PR 生成 Preview 部署链接。
- 人工：代码评审 + 预览环境验证通过后合并 `main`。
- 自动：生产环境自动构建与发布。
- 人工：生产冒烟测试与观测；必要时回滚；随后将修复回合至开发分支。

提示：本项目提供的 `email_exists` RPC 用于注册前精准查重，需在每个 Supabase 项目创建并授权给 `anon` 与 `authenticated`。

---

### 环境类型与推荐策略

- 本地开发（Development）
  - 在本机运行 `next dev`，用于日常开发调试。
- 预览环境（Preview）
  - 针对每个分支或 Pull Request 自动部署，URL 形如 `https://<branch>-<project>.vercel.app`。
  - 使用“独立的 Supabase 项目（推荐）”或“同一项目但独立数据库/数据集（不推荐）”。
- 生产环境（Production）
  - 主分支（main）合并或在 Vercel 上“Promote to Production”触发。
  - 独立的 Supabase 生产项目与数据。

建议：为 Preview 和 Production 分别创建两个 Supabase 项目，并在 Vercel 为不同环境分别配置环境变量。

---

## 一、环境变量配置（Vercel）

在 Vercel 控制台 > Project > Settings > Environment Variables，分别为 Development / Preview / Production 三个环境设置：

- `NEXT_PUBLIC_SUPABASE_URL`：对应环境的 Supabase 项目 URL（形如 `https://xxxx.supabase.co`）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：对应环境的 Supabase anon 公钥

可选（视业务需要）：
- `NEXT_PUBLIC_SITE_URL`：你的网站基础 URL（用于构建邮件重定向场景）；若不设置，代码中已用 `window.location.origin` 作为默认。

注意：
- 三个环境变量集合应各自指向不同的 Supabase 项目（最安全）。
- 添加或修改后，重新部署方可生效。

---

## 二、Supabase 配置（各环境都要做）

1) Authentication（邮箱验证与重定向）
 - 打开 `Authentication > Providers`，启用 Email。建议启用 “Confirm email / Enable email confirmations”。
 - 在 `Authentication > URL Configuration` 添加允许的重定向 URL：
   - 生产环境域名，例如 `https://yourdomain.com/login?verified=true`
   - 预览域名通配或具体地址（Vercel Preview 会产生很多临时域名，可按需添加）。
 - 若使用自定义 SMTP，请在 `Authentication > SMTP` 配置发信服务，以提升到达率。

2) 数据库结构与策略
 - 在 Supabase SQL 编辑器中依次执行本仓库的脚本（每个环境各执行一次）：
   - `supabase_setup.sql`（初始化表、触发器、RLS 等）
   - `database_fix.sql`（修复/增强，幂等可重复执行）
 - 邮箱唯一真源在 `auth.users`，`public.profiles` 为资料表（触发器同步）。已按需求“用户名可重复、邮箱唯一”。

3) RPC（邮箱存在性检查）
 - 确保已创建 RPC：`public.email_exists(text)`，返回 `(email_exists boolean, email_confirmed boolean)`。
 - 权限：授予 `anon` 与 `authenticated` 角色执行该函数。
 - 如你使用自建脚本，注意不要使用保留字作为返回列名。

---

## 三、构建与部署流程

1) Git 分支与自动部署
 - 推送到任意非生产分支 → 触发 Vercel Preview 部署，生成预览链接。
 - 合并到 `main`（或在 Vercel 上 Promote）→ 触发 Production 部署并绑定正式域名。

2) Next.js 构建
 - Vercel 自动执行 `npm install` 与 `next build`。
 - 本项目的 `src/app/debug/page.tsx` 在生产环境会呈现“占位提示”，避免调试代码阻塞构建；本地/预览调试工具可按需恢复，但务必确保不会在生产编译/执行阶段报错。

3) 生产检查清单
 - 环境变量：Production 环境的 `NEXT_PUBLIC_SUPABASE_*` 已设置且值正确。
 - Supabase Auth：已开启邮件确认、配置了生产域名重定向。
 - 数据库：已执行 `supabase_setup.sql` + `database_fix.sql`，RLS 与触发器正常。
 - RPC：`email_exists` 可被匿名与已登录角色调用。

---

## 四、预览环境注意事项

- 使用独立的 Supabase 项目，避免测试数据污染生产。
- 在该项目中复制生产侧的 Auth 设置、邮件模板与 URL 允许列表。
- 预览环境的邮件验证链接应指向预览域名，以便完成回跳。
- 需要排错时，可在预览分支临时开启更多日志；合并前清理。

---

## 五、部署后的验证步骤（Smoke Test）

在每次 Preview 或 Production 部署完成后：
1) 访问 `/login` 页面是否正常加载。
2) 使用一个新邮箱执行注册：
   - 若邮箱在 `auth.users` 已存在：UI 应提示“邮箱已注册”或给出“重发验证邮件”的选项。
   - 若不存在：应收到验证邮件，点击完成跳转（检查重定向 URL）。
3) 登录后访问受保护页面，验证 `ProtectedRoute` 与 `AuthContext` 是否工作。
4) 执行登出，确认本地缓存（LocalStorage/SessionStorage/Cookies/IndexedDB/Cache/SW）被清理，返回 `/login`。

---

## 六、回滚与发布策略

- Vercel 支持一键回滚到任意成功部署版本。
- 建议通过 Pull Request + Vercel Preview 验证功能后再合入 `main`。
- 如需“热修复”，可在短分支上修正并直接合并至 `main`，触发生产快速部署；随后将修复回合至开发分支保持一致性。

---

## 七、常见问题与排错

1) 构建失败（Webpack/Turbopack 报错）
 - 查看 Vercel 构建日志，定位具体文件与行号；不要在 JSX 返回体中插入函数/语句。
 - 如遇仅用于本地的调试页，建议在生产环境降级为占位组件或条件加载。

2) 邮件无法收到
 - 确认 Supabase 已开启邮箱确认功能；检查 `Authentication > SMTP` 或改用 Gmail 测试。
 - 核对“重定向 URL”与生产/预览域名匹配。
 - 检查垃圾邮件/促销邮件文件夹；参见 `EMAIL_DEBUG_GUIDE.md`。

3) “邮箱已注册”误判
 - 以 `auth.users` 为准：在 Supabase > Authentication > Users 搜索该邮箱。
 - 我们已提供 RPC `email_exists` 精准查询；若该邮箱确有历史记录，请按需删除或完成验证。

4) Git 推送失败（端口 443 无法连接）
 - 可能是网络/代理阻断。可尝试：
   - `git config --global http.sslBackend schannel`（Windows 使用系统证书）
   - 清理错误的 `http.proxy`/`https.proxy`
   - 切换 SSH 方式：将远端改为 `git@github.com:<owner>/<repo>.git` 并配置 SSH Key；若 22 端口被封，考虑 GitHub SSH over HTTPS 的替代方案。

---

## 八、运维建议

- 预览与生产隔离（代码 + 数据 + 环境变量）。
- 数据库脚本版本化：当前项目提供 `supabase_setup.sql` 与 `database_fix.sql`，对每个环境都执行一遍，重复执行应安全。
- 记录每次部署的提交 SHA 与 Vercel 部署 ID，便于回溯与回滚。
- 对关键行为（注册/登录/登出）做一次最小化自动化检查（可后续引入 Playwright）。

---

## 九、快速清单（TL;DR）

Production 首次部署清单：
- [ ] 在 Vercel 设置 Production 环境变量：`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`
- [ ] 在 Supabase 生产项目执行：`supabase_setup.sql` + `database_fix.sql`
- [ ] 开启 Email 确认，配置生产域名重定向
- [ ] 创建/确认 RPC `email_exists` 并授予 anon/authenticated
- [ ] 合并到 `main` 或 Promote，观察日志
- [ ] 完成登录/注册/登出冒烟测试

Preview 部署清单：
- [ ] 为分支配置 Preview 环境变量（指向预览用 Supabase 项目）
- [ ] 同样执行两份 SQL 脚本与 Auth 配置
- [ ] 使用预览链接进行功能验证

如需更多细节，参考仓库内：`SUPABASE_SETUP.md`、`EMAIL_DEBUG_GUIDE.md`、`GMAIL_EMAIL_TROUBLESHOOTING.md`、`FEATURE_TESTING_GUIDE.md`、`QUICK_START.md`。
