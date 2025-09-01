# 技术设计文档：将军令 GeneralSignal_H5

本文档旨在为“将军令”应用提供精简、核心的后端技术设计方案，涵盖环境配置、数据库选型、核心库表结构，以及关键API接口功能。

---

## 1. 环境管理与配置 (Environment Management & Setup)

为确保开发流程的规范性、安全性和可维护性，项目将采用**多环境部署**策略，严格区分**本地开发环境**和**线上生产环境**。这意味着我们将为每个环境创建一套完全独立的云资源（包括用户认证、数据库、文件存储等）。

以下是您需要配合完成的前置步骤，请在启动编码工作前完成**开发环境**的配置。

### 1.1. 开发环境 (Development Environment)

此环境用于日常开发、功能测试和 bug 修复。

#### **需要您操作：配置开发环境**

- **第一步：创建独立的 Firebase 开发项目**
    - **访问 Firebase 控制台**: 使用您的 Google 账户登录 [Firebase 控制台](https://console.firebase.google.com/)。
    - **创建新项目**: 点击“添加项目”或“创建项目”。
    - **项目命名**: 为您的**开发**项目命名，我们推荐使用 `GeneralSignal-dev` 以便清晰区分。
    - **Google Analytics**: 您可以选择禁用或启用 Google Analytics，这不影响核心功能。
    - **完成创建**: 等待项目创建完成。

- **第二步：激活开发环境的云服务**
    - 在新创建的 `GeneralSignal-dev` 项目控制台中，您需要激活以下云服务：

    - **激活 Firebase Authentication (用户认证)**
        - 在左侧菜单中，找到并点击 “**Build**” > “**Authentication**”。
        - 点击“**开始使用**”。
        - 在“登录方法”标签页中，选择并启用“**邮箱/密码**”作为登录方式。

    - **激活 Cloud Firestore (云数据库)**
        - 在左侧菜单中，找到并点击 “**Build**” > “**Firestore Database**”。
        - 点击 “**创建数据库**”。
        - **选择模式**: 为了便于开发，请选择“**测试模式**”开始。这会提供一个较为宽松的安全规则，方便我们调试。**注意：生产环境必须使用“生产模式”**。
        - **选择位置**: 选择一个离您最近的云服务器位置。
        - 点击“**启用**”。

    - **激活 Cloud Storage (云存储)**
        - 在左侧菜单中，找到并点击 “**Build**” > “**Storage**”。
        - 点击“**开始使用**”。
        - **重要提示**: 系统可能会提示您“**升级项目**”到 **Blaze (随用随付)** 套餐。这是一个**必要的前置步骤**。尽管 Storage 服务本身有慷慨的免费额度，但启用它需要项目关联一个结算账户。请按照指引完成升级。
        - **安全规则**: 升级后，同样选择“**测试模式**”以方便开发阶段的文件上传。
        - **选择位置**: 系统通常会为您自动选择与 Firestore 相同的位置，保持默认即可。
        - 点击“**完成**”。

- **第三步：将开发配置提供给我**
    - 在您完成以上步骤后，我需要获取连接到这个开发项目的客户端配置。
    - 在您的 `GeneralSignal-dev` 项目主页，点击“项目概览”旁边的**齿轮图标**，进入“**项目设置**”。
    - 在“**您的应用**”卡片中，点击**Web应用图标** (`</>`)来注册一个新的Web应用。
    - **应用别名**: 输入 `GeneralSignal-dev-web`。
    - **注册应用**: 点击“注册应用”。
    - **获取配置**: 在下一步中，您会看到一个名为 `firebaseConfig` 的 JavaScript 对象。**请将这个完整的对象代码复制给我**。这是我将开发环境前端代码连接到您创建的云服务的唯一凭证。

### 1.2. 生产环境 (Production Environment)

此环境面向最终用户，拥有独立的数据和最高的安全级别。**您可以在开发阶段完成后，再按照同样的步骤配置生产环境。**

- **创建独立的 Firebase 生产项目**: 再次执行 `1.1` 中的步骤，但这次将项目命名为 `GeneralSignal-prod`。
- **激活生产环境的云服务**:
    - **激活 Authentication, Firestore, Storage**: 流程同上。
    - **注意**：对于生产环境，Firestore 和 Storage 的安全规则**必须选择“生产模式”**，以确保数据安全。我们会在部署前一起完善正式的安全规则。
- **生成生产配置**: 同样地，为 `GeneralSignal-prod` 项目创建一个Web应用，并妥善保管生成的 `firebaseConfig` 对象。在项目部署时，我们会将其作为**环境变量**配置到您的托管平台中，而不会硬编码在代码里。

### 1.3. 应用如何连接到正确的环境

我将通过**环境变量**机制来管理不同环境的配置，您无需担心代码中的环境判断问题。

-   **本地开发**: 我会将您在`第三步`中提供的开发配置，写入到项目的 `.env.local` 文件中。Next.js 会在开发时自动加载此文件。
    ```.env.local
    # 此文件不提交到版本控制
    NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey": "...", "authDomain": "GeneralSignal-dev.firebaseapp.com", ...}'
    ```
-   **生产部署**: 在部署到 Firebase App Hosting 或其他平台时，我们会将生产项目的 `firebaseConfig` JSON 字符串作为环境变量注入到构建流程中。

这样，同一份代码在不同环境下运行时，会自动连接到对应环境的数据库和存储服务，实现了完美的隔离。

---

## 2. 数据库设计

### 2.1. 数据库选型

考虑到应用的业务场景，我推荐使用 **Google Cloud Firestore**。

**选择理由**:

- **完全托管与弹性伸缩**: Firestore 是一个 Serverless NoSQL 文档数据库，能根据流量自动扩缩容，无需担心运维。
- **实时数据同步**: 内置的实时监听器 (real-time listeners) 能轻松实现需要实时更新的场景。
- **灵活的数据模型**: 文档型结构非常适合存储用户资料等半结构化数据，便于未来快速迭代和扩展字段。
- **与 Firebase 生态无缝集成**: 能与 Firebase Authentication、Cloud Storage 等服务紧密结合，简化开发流程。

### 2.2. 库表结构设计 (Firestore Collections)

#### `users` - 用户表

存储应用用户的核心信息。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | **主键**。通常使用 Firebase Auth UID。 | `abcde12345` |
| `username` | `string` | 用户名，唯一。 | `CryptoKing` |
| `email` | `string` | 邮箱，用于登录或通知。 | `user@example.com` |
| `avatarUrl` | `string` | 用户头像图片的 URL。该 URL 指向 Firebase Cloud Storage 中存储的图片文件。 | `https://firebasestorage.googleapis.com/...` |
| `invitationCode` | `string` | 用户的邀请码，唯一。 | `INVT8888` |
| `invitedBy` | `string` | 邀请者的 `userId` (外键)。 | `fghij67890` |
| `createdAt` | `timestamp` | 账户创建时间。 | `2023-10-27T10:00:00Z` |

---

## 3. API 接口设计

### 3.1. 技术选型

推荐使用 **Next.js API Routes**。此方案将后端逻辑与前端代码一同存放在 Next.js 项目中，简化了开发和部署流程，且无需预先为所有服务开通 Firebase Blaze 套餐。我们将使用 TypeScript 编写接口，以确保类型安全和代码质量。

### 3.2. 接口功能详情

#### 用户模块 (`user`)

- **`getUserProfile()` - 获取用户资料**
  - **描述**: 获取当前登录用户的完整个人信息。
  - **触发方式**: HTTP (通过客户端调用 Next.js API Route，例如 `GET /api/user/profile`)。
  - **入参**: 无 (用户身份通过请求头中的 Authorization Token 获取)。
  - **出参**:
    ```json
    {
      "success": true,
      "data": {
        "userId": "abcde12345",
        "username": "CryptoKing",
        "avatarUrl": "https://...",
        "invitationCode": "INVT8888"
      }
    }
    ```
  - **内部逻辑**:
    - 在 API 路由中验证请求头中的 Firebase Auth ID Token。
    - 从 `users` 表查询用户信息。
    - 组合数据并返回。

- **`updateUserProfile()` - 更新用户资料**
  - **描述**: 允许用户更新自己的用户名、头像等信息。
  - **触发方式**: HTTP (例如 `POST /api/user/profile`)
  - **入参**:
    ```json
    {
      "username": "CryptoKing_New",
      "avatarUrl": "https://.../new.png"
    }
    ```
  - **出参**: `{ "success": true, "message": "Profile updated successfully." }`
  - **内部逻辑**:
    - 验证用户身份。
    - 校验入参（如用户名是否已存在）。
    - **头像更新流程**:
        - 前端（客户端）负责将用户选择的新头像图片上传到 **Firebase Cloud Storage**。
        - 上传成功后，Cloud Storage 会返回一个永久性的公开访问URL。
        - 前端将这个新的 URL 作为 `avatarUrl` 字段的值，调用此 `updateUserProfile` 接口。
    - 后端接收到请求后，将 `username` 和/或新的 `avatarUrl` 更新到 `users` 表中对应用户的字段。

### 3.3. 核心功能实现详解

#### 用户注册 (User Registration)

- **达成效果**: 新用户通过表单（用户名、密码、可选邀请码）创建账户，并记录邀请关系，成功后自动登录并跳转至主页。
- **后端接口 (Next.js API Route)**:
    - **路径**: `POST /api/register`
    - **入参**: `{ username, password, invitationCode? }`
    - **内部逻辑**:
        - **初始化 Firebase Admin SDK**: 在 API 路由中安全地初始化 Admin SDK，用于执行特权操作。
        - **查询 `users` 表**: 验证 `username` 是否已存在，防止重复注册。
        - **(可选) 查询 `users` 表**: 若 `invitationCode` 存在，通过查询找到邀请人，记录其 `userId`。
        - **调用 Firebase Admin SDK**: 使用 `auth().createUser()` 方法创建认证用户，获取 `uid`。
        - **写入 `users` 表**: 在 `users` 集合中创建一个以 `uid` 为主键的新文档，存入 `username`、新生成的唯一 `invitationCode`、`invitedBy` (如有) 等信息。

#### 用户登录 (User Login)

- **达成效果**: 已注册用户通过账号密码登录，成功后进入主页。
- **后端接口 (Next.js API Route)**: **不使用**。
- **技术说明**: 登录功能由客户端直接调用 **Firebase Authentication SDK** 的 `signInWithEmailAndPassword()` 方法完成。这是最安全、最高效的方式，可以充分利用 Firebase 的安全令牌机制和会话管理，无需自定义后端接口。
- **云数据库 (Firestore)**: 无直接交互。用户信息将在登录成功后，通过调用 `getUserProfile` 接口获取。

#### 邀请好友 (Invite Friends)

- **达成效果**: 已登录用户在个人中心或邀请页面，获取自己专属的邀请码和邀请链接，用于分享。
- **后端接口 (Next.js API Route)**:
    - **复用 `GET /api/user/profile`**: 无需新增接口。此接口从 `users` 表中获取当前登录用户的完整资料，其中就包含了 `invitationCode` 字段。
- **前端逻辑**:
    - 调用 `getUserProfile` 接口。
    - 从返回数据中提取 `invitationCode`。
    - 动态生成邀请链接 (例如: `https://[your-app-url]/register?ref=INVT8888`)。
    - 将邀请码和链接展示给用户。
- **云数据库 (Firestore)**:
    - `users` 表被 `getUserProfile` 接口**读取**，以获取用户的邀请码。
