# 技术设计文档：将军令 GeneralSignal_H5

本文档旨在为“将军令”应用提供精简、核心的后端技术设计方案，涵盖环境配置、数据库选型、核心库表结构，以及关键API接口功能。

---

## 1. 环境管理与配置 (Environment Management & Setup)

为确保开发流程的规范性、安全性和可维护性，项目将采用**多环境部署**策略，严格区分**本地开发环境**和**线上生产环境**。这意味着我们将为每个环境创建一套完全独立的云资源（包括用户认证、数据库等）。

以下是您需要配合完成的前置步骤，请在启动编码工作前完成**开发环境**的配置。

### 1.1. 开发环境 (Development Environment)

此环境用于日常开发、功能测试和 bug 修复。

#### **需要您操作：配置开发环境**

*   **第一步：创建独立的 Firebase 开发项目**
    *   **访问 Firebase 控制台**: 使用您的 Google 账户登录 [Firebase 控制台](https://console.firebase.google.com/)。
    *   **创建新项目**: 点击“添加项目”或“创建项目”。
    *   **项目命名**: 为您的**开发**项目命名，我们推荐使用 `GeneralSignal-dev` 以便清晰区分。
    *   **Google Analytics**: 您可以选择禁用或启用 Google Analytics，这不影响核心功能。
    *   **完成创建**: 等待项目创建完成。

*   **第二步：激活开发环境的云服务**
    *   在新创建的 `GeneralSignal-dev` 项目控制台中，您需要激活以下云服务：

    *   **激活 Firebase Authentication (用户认证)**
        *   在左侧菜单中，找到并点击 “**Build**” > “**Authentication**”。
        *   点击“**开始使用**”。
        *   在“登录方法”标签页中，选择并启用“**邮箱/密码**”作为登录方式。

    *   **激活 Cloud Firestore (云数据库)**
        *   在左侧菜单中，找到并点击 “**Build**” > “**Firestore Database**”。
        *   点击 “**创建数据库**”。
        *   **选择模式**: 为了便于开发，请选择“**测试模式**”开始。这会提供一个较为宽松的安全规则，方便我们调试。**注意：生产环境必须使用“生产模式”**。
        *   **选择位置**: 选择一个离您最近的云服务器位置。
        *   点击“**启用**”。

*   **第三步：将开发配置提供给我**
    *   在您完成以上步骤后，我需要获取连接到这个开发项目的客户端配置。
    *   在您的 `GeneralSignal-dev` 项目主页，点击“项目概览”旁边的**齿轮图标**，进入“**项目设置**”。
    *   在“**您的应用**”卡片中，点击**Web应用图标** (`</>`)来注册一个新的Web应用。
    *   **应用别名**: 输入 `GeneralSignal-dev-web`。
    *   **注册应用**: 点击“注册应用”。
    *   **获取配置**: 在下一步中，您会看到一个名为 `firebaseConfig` 的 JavaScript 对象。**请将这个完整的对象代码复制给我**。这是我将开发环境前端代码连接到您创建的云服务的唯一凭证。

### 1.2. 生产环境部署 (Production Deployment)

当您完成开发和测试，准备将应用发布给真实用户时，请遵循以下步骤配置生产环境并进行部署。

*   **第一步：创建独立的 Firebase 生产项目**
    *   **目标**: 为生产环境创建一套完全独立的云资源，确保与开发数据隔离。
    *   **操作**:
        *   返回 [Firebase 控制台](https://console.firebase.google.com/)。
        *   再次点击“添加项目”，创建一个新项目。
        *   **项目命名**: 为您的**生产**项目命名，我们强烈推荐使用 `GeneralSignal-prod` 以便清晰区分。
        *   **完成创建**。

*   **第二步：激活生产环境的云服务**
    *   **目标**: 启用生产环境所需的用户认证和数据库服务。
    *   **操作**:
        *   在新建的 `GeneralSignal-prod` 项目中，重复**开发环境**的步骤，激活以下服务：
            *   **Firebase Authentication** (用户认证)
            *   **Cloud Firestore** (云数据库)
        *   **重要区别**：在激活 Cloud Firestore 时，当系统询问安全规则模式时，**必须选择“生产模式”**。这将默认拒绝所有数据库读写，以最大限度地保护您的线上数据安全。我们稍后会一起配置具体的安全规则。

*   **第三步：获取生产环境配置**
    *   **目标**: 获取用于连接生产环境 Firebase 服务的密钥。
    *   **操作**:
        *   在您的 `GeneralSignal-prod` 项目主页，点击“项目概览”旁边的**齿轮图标**，进入“**项目设置**”。
        *   在“**您的应用**”卡片中，点击**Web应用图标** (`</>`)来注册一个新的Web应用。
        *   **应用别名**: 输入 `GeneralSignal-prod-web`。
        *   **注册应用**: 点击“注册应用”。
        *   **获取配置**: 在下一步中，您会看到一个名为 `firebaseConfig` 的 JavaScript 对象。
        *   **请妥善保管这个配置对象，不要泄露。** 我们在下一步部署时会用到它。

*   **第四步：通过 Firebase App Hosting 部署**
    *   **目标**: 将您的 Next.js 应用部署到 Firebase 官方推荐的、经过优化的托管平台。
    *   **操作**:
        *   **安装 Firebase CLI**: 如果您的本地机器尚未安装 Firebase 命令行工具，请打开终端并运行：`npm install -g firebase-tools`。
        *   **登录 Firebase**: 运行 `firebase login` 并按照提示在浏览器中登录您的 Google 账户。
        *   **初始化 Firebase**:
            *   在您的项目代码根目录下，打开终端，运行 `firebase init`。
            *   选择 “**App Hosting**” (使用方向键选择，按空格键确认)。
            *   选择 “**Use an existing project**”，然后从列表中选择您刚刚创建的 `GeneralSignal-prod` 生产项目。
            *   系统会询问您的应用根目录，直接按回车键接受默认值即可。
        *   **配置环境变量 (关键步骤)**:
            *   打开项目根目录下的 `apphosting.yaml` 文件。
            *   将您在 **第三步** 中获取的生产环境 `firebaseConfig` 对象，作为一个单行的 JSON 字符串，添加到环境变量中。修改后的文件应如下所示：
                ```yaml
                # Settings to manage and configure a Firebase App Hosting backend.
                # https://firebase.google.com/docs/app-hosting/configure
                
                runConfig:
                  # Increase this value if you'd like to automatically spin up
                  # more instances in response to increased traffic.
                  maxInstances: 1
                  environmentVariables:
                    - variable: NEXT_PUBLIC_FIREBASE_CONFIG
                      value: '{"apiKey":"...", "authDomain":"...", ...}' # <--- 将您生产项目的配置粘贴在这里
                
                ```
        *   **执行部署**:
            *   在终端中运行命令：`firebase deploy`。
            *   Firebase CLI 将会开始构建您的 Next.js 应用，并将其部署到 App Hosting。
            *   部署成功后，终端会显示您的线上应用访问 URL。

*   **第五步：配置安全规则**
    *   **目标**: 保护您的生产数据库，只允许授权用户进行合法的读写操作。
    *   **操作**:
        *   部署完成后，访问您的 `GeneralSignal-prod` 项目的 Firebase 控制台。
        *   进入 “**Build**” > “**Firestore Database**” > “**规则**” 标签页。
        *   在这里，我们将一起编写正式的安全规则。例如，一条基本的规则可能是“只允许登录用户读取和写入自己的用户数据”。
        *   这是一个持续性的工作，随着应用功能的增加，我们会不断完善这些规则。

### 1.3. 应用如何连接到正确的环境

我将通过**环境变量**机制来管理不同环境的配置，您无需担心代码中的环境判断问题。

*   **本地开发**: 我会将您在`第三步`中提供的开发配置，写入到项目的 `.env.local` 文件中。Next.js 会在开发时自动加载此文件。
    ```.env.local
    # 此文件不提交到版本控制
    NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey": "...", "authDomain": "GeneralSignal-dev.firebaseapp.com", ...}'
    ```
*   **生产部署**: 在部署到 Firebase App Hosting 或其他平台时，我们会将生产项目的 `firebaseConfig` JSON 字符串作为环境变量注入到构建流程中。

这样，同一份代码在不同环境下运行时，会自动连接到对应环境的数据库和存储服务，实现了完美的隔离。

---

## 2. 数据库设计

### 2.1. 数据库选型

考虑到应用的业务场景，我推荐使用 **Google Cloud Firestore**。

**选择理由**:

*   **完全托管与弹性伸缩**: Firestore 是一个 Serverless NoSQL 文档数据库，能根据流量自动扩缩容，无需担心运维。
*   **实时数据同步**: 内置的实时监听器 (real-time listeners) 能轻松实现需要实时更新的场景。
*   **灵活的数据模型**: 文档型结构非常适合存储用户资料等半结构化数据，便于未来快速迭代和扩展字段。
*   **与 Firebase 生态无缝集成**: 能与 Firebase Authentication 等服务紧密结合，简化开发流程。
*   **免费启动**: 拥有慷慨的免费额度，无需预先开通付费套餐即可在生产环境使用。

### 2.2. 库表结构设计 (Firestore Collections)

#### `users` - 用户表

存储应用用户的核心信息。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | **主键**。通常使用 Firebase Auth UID。 | `abcde12345` |
| `username` | `string` | 用户名，唯一。 | `CryptoKing` |
| `email` | `string` | 邮箱，用于登录或通知。 | `user@example.com` |
| `avatarUrl` | `string` | 用户头像图片的 URL。当前阶段统一使用默认头像，此字段可为空或指向一个默认图片地址。 | `https://.../default-avatar.png` |
| `invitationCode` | `string` | 用户的邀请码，唯一。 | `INVT8888` |
| `invitedBy` | `string` | 邀请者的 `userId` (外键)。 | `fghij67890` |
| `createdAt` | `timestamp`| 账户创建时间。 | `2023-10-27T10:00:00Z` |

---

## 3. API 接口设计

### 3.1. 技术选型

推荐使用 **Next.js API Routes**。此方案将后端逻辑与前端代码一同存放在 Next.js 项目中，简化了开发和部署流程，且无需预先为所有服务开通 Firebase Blaze 套餐。我们将使用 TypeScript 编写接口，以确保类型安全和代码质量。

### 3.2. 接口功能详情

#### 用户模块 (`user`)

*   **`getUserProfile()` - 获取用户资料**
    *   **描述**: 获取当前登录用户的完整个人信息。
    *   **触发方式**: HTTP (通过客户端调用 Next.js API Route，例如 `GET /api/user/profile`)。
    *   **入参**: 无 (用户身份通过请求头中的 Authorization Token 获取)。
    *   **出参**:
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
    *   **内部逻辑**:
        *   在 API 路由中验证请求头中的 Firebase Auth ID Token。
        *   从 `users` 表查询用户信息。
        *   组合数据并返回。

*   **`updateUserProfile()` - 更新用户资料**
    *   **描述**: 允许用户更新自己的用户名信息。
    *   **触发方式**: HTTP (例如 `POST /api/user/profile`)
    *   **入参**:
        ```json
        {
          "username": "CryptoKing_New"
        }
        ```
    *   **出参**: `{ "success": true, "message": "Profile updated successfully." }`
    *   **内部逻辑**:
        *   验证用户身份。
        *   校验入参（如用户名是否已存在）。
        *   将新的 `username` 更新到 `users` 表中对应用户的字段。

### 3.3. 核心功能实现详解

#### 用户注册 (User Registration)

*   **达成效果**: 新用户通过表单（用户名、密码、可选邀请码）创建账户，并记录邀请关系，成功后自动登录并跳转至主页。
*   **后端接口 (Next.js API Route)**:
    *   **路径**: `POST /api/register`
    *   **入参**: `{ username, password, invitationCode? }`
    *   **内部逻辑**:
        *   **初始化 Firebase Admin SDK**: 在 API 路由中安全地初始化 Admin SDK，用于执行特权操作。
        *   **查询 `users` 表**: 验证 `username` 是否已存在，防止重复注册。
        *   **(可选) 查询 `users` 表**: 若 `invitationCode` 存在，通过查询找到邀请人，记录其 `userId`。
        *   **调用 Firebase Admin SDK**: 使用 `auth().createUser()` 方法创建认证用户，获取 `uid`。
        *   **写入 `users` 表**: 在 `users` 集合中创建一个以 `uid` 为主键的新文档，存入 `username`、新生成的唯一 `invitationCode`、`invitedBy` (如有) 等信息。

#### 用户登录 (User Login)

*   **达成效果**: 已注册用户通过账号密码登录，成功后进入主页。
*   **后端接口 (Next.js API Route)**: **不使用**。
*   **技术说明**: 登录功能由客户端直接调用 **Firebase Authentication SDK** 的 `signInWithEmailAndPassword()` 方法完成。这是最安全、最高效的方式，可以充分利用 Firebase 的安全令牌机制和会话管理，无需自定义后端接口。
*   **云数据库 (Firestore)**: 无直接交互。用户信息将在登录成功后，通过调用 `getUserProfile` 接口获取。

#### 邀请好友 (Invite Friends)

*   **达成效果**: 已登录用户在个人中心或邀请页面，获取自己专属的邀请码和邀请链接，用于分享。
*   **后端接口 (Next.js API Route)**:
    *   **复用 `GET /api/user/profile`**: 无需新增接口。此接口从 `users` 表中获取当前登录用户的完整资料，其中就包含了 `invitationCode` 字段。
*   **前端逻辑**:
    *   调用 `getUserProfile` 接口。
    *   从返回数据中提取 `invitationCode`。
    *   动态生成邀请链接 (例如: `https://[your-app-url]/register?ref=INVT8888`)。
    *   将邀请码和链接展示给用户。
*   **云数据库 (Firestore)**:
    *   `users` 表被 `getUserProfile` 接口**读取**，以获取用户的邀请码。
