# 技术设计文档：将军令 (SignalAuth) App

本文档旨在为“将军令”应用提供全面的后端技术设计方案，涵盖数据库选型、库表结构设计，以及 API 接口功能设计。

---

## 1. 环境管理 (Environment Management)

为确保开发流程的规范性、安全性和可维护性，项目将采用多环境部署策略，严格区分本地开发环境和线上生产环境。

-   **开发环境 (Development)**: 用于日常开发、功能测试和 bug 修复。
-   **生产环境 (Production)**: 面向最终用户的线上稳定环境。

### 1.1. Firebase 项目隔离

我们将为每个环境创建一个独立的 Firebase 项目：

-   开发项目: `signal-auth-dev` (示例)
-   生产项目: `signal-auth-prod` (示例)

这种隔离策略可以确保开发测试数据（如模拟用户、测试订单）与真实的生产用户数据完全分离，防止任何交叉污染或误操作。

### 1.2. 客户端配置

客户端 Next.js 应用将通过**环境变量**来加载对应环境的 Firebase 配置对象 (`firebaseConfig`)。

-   **本地开发**: 在项目根目录下的 `.env.local` 文件中，开发者可以配置开发项目的 `firebaseConfig` JSON 字符串。此文件不应提交到版本控制系统。
    ```.env.local
    NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey": "...", "authDomain": "signal-auth-dev.firebaseapp.com", ...}'
    ```
-   **生产部署**: 在 Firebase App Hosting 或其他托管平台的环境变量设置中，配置生产项目的 `firebaseConfig` JSON 字符串。构建流程会自动将此变量注入到生产代码中。

应用在初始化 Firebase SDK 时，会读取相应的环境变量，确保连接到正确的后端。

### 1.3. 云服务 (云函数、云数据库、云存储)

-   **云函数 (Cloud Functions)**:
    -   使用 Firebase CLI 的 `use` 命令 (`firebase use dev` / `firebase use prod`) 来切换当前工作的 Firebase 项目。
    -   部署命令 (`firebase deploy --only functions`) 会将云函数部署到当前选定的项目中。
    -   客户端调用云函数时，由于 SDK 已使用特定环境的配置初始化，因此请求会自动路由到正确的后端环境。
-   **云数据库 (Firestore) & 云存储 (Cloud Storage)**:
    -   与云函数同理，SDK 会根据初始化时加载的 `firebaseConfig`，自动连接到对应环境的数据库和存储桶，开发者无需在代码中进行任何额外的环境判断。

---

## 2. 数据库设计

### 2.1. 数据库选型

考虑到应用的业务场景（高频读写、用户关系复杂、需要实时数据同步）以及未来对 AI 功能的深度集成需求，我推荐使用 **Google Cloud Firestore**。

**选择理由**:

- **完全托管与弹性伸缩**: Firestore 是一个 Serverless NoSQL 文档数据库，能根据流量自动扩缩容，无需担心运维。
- **实时数据同步**: 内置的实时监听器 (real-time listeners) 能轻松实现交易信号、持仓状态等数据的实时更新，完美匹配应用的金融场景。
- **灵活的数据模型**: 文档型结构非常适合存储用户资料、交易信号等半结构化数据，便于未来快速迭代和扩展字段。
- **强大的查询能力**: 支持复杂的复合查询和数据聚合，能满足排行榜、历史记录筛选等各类需求。
- **与 Firebase 生态无缝集成**: 能与 Firebase Authentication, Cloud Functions 等服务紧密结合，简化开发流程。

### 2.2. 库表结构设计 (Firestore Collections)

我将 Firestore 的 `Collection` 视为关系型数据库中的 `Table` 来进行设计。

#### 2.2.1. `users` - 用户表

存储应用用户的核心信息。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | **主键**。通常使用 Firebase Auth UID。 | `abcde12345` |
| `username` | `string` | 用户名，唯一。 | `CryptoKing` |
| `email` | `string` | 邮箱，用于登录或通知。 | `user@example.com` |
| `avatarUrl` | `string` | 用户头像图片的 URL。 | `https://.../avatar.png` |
| `invitationCode` | `string` | 用户的邀请码，唯一。 | `INVT8888` |
| `invitedBy` | `string` | 邀请者的 `userId` (外键)。 | `fghij67890` |
| `membershipId` | `string` | 当前生效的会员订阅ID (外键)。 | `sub_xyz789` |
| `createdAt` | `timestamp` | 账户创建时间。 | `2023-10-27T10:00:00Z` |

#### 2.2.2. `traders` - 交易员表

存储交易信号提供者的详细信息和统计数据。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `traderId` | `string` | **主键**。 | `trader_woods` |
| `name` | `string` | 交易员名称。 | `WWG-Woods` |
| `avatarUrl` | `string` | 交易员头像 URL。 | `https://.../woods.png` |
| `description`| `string` | 个人简介。 | `盈亏同源高收益...` |
| `tags` | `array<string>` | 风格标签。 | `["波段高手", "高频交易"]` |
| `stats` | `map` | 统计数据 (为便于查询和更新，聚合存放)。 | `{ "yield": 288.0, "winRate": 95.0, ... }` |
| `followersCount`| `number` | 跟单人数 (冗余字段，用于快速读取)。 | `1288` |

#### 2.2.3. `subscriptions` - 用户订阅表

记录用户的会员购买与有效期限。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `subscriptionId`|`string`| **主键**。 | `sub_xyz789` |
| `userId` | `string` | 用户ID (外键)。 | `abcde12345` |
| `planId` | `string` | 订阅的套餐ID (如 `auto-yearly`)。 | `auto-yearly` |
| `status` | `string` | 订阅状态 (`active`, `expired`, `cancelled`)。 | `active` |
| `startDate` | `timestamp` | 订阅开始时间。 | `2023-10-27T...` |
| `endDate` | `timestamp` | 订阅结束时间。 | `2024-10-27T...` |
| `paymentId` | `string` | 关联的支付记录ID (外键)。 | `pay_123abc` |

#### 2.2.4. `payments` - 支付记录表

存储所有支付行为的详细信息。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `paymentId`| `string`| **主键**。 | `pay_123abc` |
| `userId` | `string`| 用户ID (外键)。 | `abcde12345` |
| `amount` | `number`| 支付金额。 | `240.0` |
| `currency` | `string`| 支付货币 (如 USDT)。 | `USDT` |
| `paymentMethod`| `string`| 支付方式 (`TRC20`, `ERC20`)。 | `TRC20` |
| `transactionHash`| `string`| 链上交易哈希。 | `0x...` |
| `status` | `string`| 支付状态 (`pending`, `completed`, `failed`)。 | `completed` |
| `createdAt` | `timestamp`| 记录创建时间。 | `2023-10-27T...` |

#### 2.2.5. `user_exchange_keys` - 用户API密钥表

安全地存储用户绑定的交易所 API 密钥。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `keyId` | `string` | **主键**。 | `key_okx_1` |
| `userId` | `string` | 用户ID (外键)。 | `abcde12345` |
| `exchange` | `string` | 交易所名称 (`okx`, `binance`)。 | `okx` |
| `apiKey` | `string` | API Key (**必须加密存储**)。 | `encrypted:...` |
| `apiSecret`| `string` | API Secret (**必须加密存储**)。 | `encrypted:...` |
| `passphrase`| `string` | Passphrase (如有, **必须加密存储**)。 | `encrypted:...` |
| `status` | `string` | 密钥状态 (`running`, `stopped`)。 | `running` |

#### 2.2.6. `user_follows` - 用户关注关系表

记录用户与交易员的关注关系及跟单设置。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `followId` | `string` | **主键** (`userId_traderId`)。 | `abcde12345_trader_woods` |
| `userId` | `string` | 用户ID (外键)。 | `abcde12345` |
| `traderId` | `string` | 交易员ID (外键)。 | `trader_woods` |
| `settings` | `map` | 用户的个性化跟单设置。 | `{ "fundStrategy": "ratio", "amount": 100, ... }` |
| `createdAt`| `timestamp`| 关注开始时间。 | `2023-10-28T...` |

#### 2.2.7. `trading_orders` - 交易订单表

记录所有挂单和持仓信息，是应用的核心数据表。

| 字段名 | 数据类型 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `orderId` | `string` | **主键**。 | `ord_btc_123` |
| `userAccountId` | `string`| 用户的交易所账户ID (关联`user_exchange_keys`)。| `okx-10001`|
| `pair` | `string`| 交易对。 | `BTC/USDT` |
| `status` | `string`| 订单状态 (`pending`, `active`, `closed`, `cancelled`)。|`active`|
| `type` | `string`| 订单类型 (`position`, `limit_order`)。 | `position` |
| `direction`| `string`| 交易方向 (`long`, `short`)。 | `long` |
| `entryPrice` | `number`| 开仓/委托价格。 | `68000.50` |
| `closePrice` | `number`| 平仓价格 (如有)。 | `69000.00` |
| `size` | `number`| 仓位/委托数量。 | `0.1` |
| `pnl` | `number`| 已实现/未实现盈亏。 | `120.50` |
| `pnlRate`| `number`| 盈亏率。 | `5.19` |
| `source` | `map` | 信号来源信息。 | `{ "type": "auto", "traderId": "trader_woods" }` |
| `openTime` | `timestamp`| 开仓/挂单时间。 | `2023-10-28T...` |
| `closeTime`| `timestamp`| 平仓/撤销时间 (如有)。 | `2023-10-29T...` |

---

## 3. API 接口设计

### 3.1. 技术选型

推荐使用 **Google Cloud Functions for Firebase**，并采用 TypeScript 编写，以确保类型安全和代码质量。

### 3.2. 接口功能详情

#### 3.2.1. 用户模块 (`user`)

- **`getUserProfile()` - 获取用户资料**
  - **描述**: 获取当前登录用户的完整个人信息，包括会员状态。
  - **触发方式**: HTTP (Callable Function)
  - **入参**: 无 (用户身份通过 context.auth 获取)。
  - **出参**:
    ```json
    {
      "success": true,
      "data": {
        "userId": "abcde12345",
        "username": "CryptoKing",
        "avatarUrl": "https://...",
        "invitationCode": "INVT8888",
        "membership": {
          "planName": "自动跟单 · 1年",
          "expiresAt": "2024-10-27T..."
        }
      }
    }
    ```
  - **内部逻辑**:
    1. 验证用户登录状态。
    2. 从 `users` 表查询用户信息。
    3. 根据 `membershipId` 联查 `subscriptions` 表，获取会员信息。
    4. 组合数据并返回。

- **`updateUserProfile()` - 更新用户资料**
  - **描述**: 允许用户更新自己的用户名、头像等信息。
  - **触发方式**: HTTP (Callable Function)
  - **入参**:
    ```json
    {
      "username": "CryptoKing_New",
      "avatarUrl": "https://.../new.png"
    }
    ```
  - **出参**: `{ "success": true, "message": "Profile updated successfully." }`
  - **内部逻辑**:
    1. 验证用户登录状态。
    2. 校验入参（如用户名是否已存在）。
    3. 更新 `users` 表中对应用户的字段。

#### 3.2.2. 交易员与榜单模块 (`trader`)

- **`getTraderLeaderboard()` - 获取交易员榜单**
  - **描述**: 获取交易员列表，支持分页和多种排序方式。
  - **触发方式**: HTTP (Callable Function)
  - **入参**:
    ```json
    {
      "sortBy": "yield",
      "direction": "desc",
      "pageSize": 10,
      "page": 1
    }
    ```
  - **出参**:
    ```json
    {
      "success": true,
      "data": {
        "traders": [
          { "traderId": "trader_woods", "name": "WWG-Woods", "stats": {...} }
        ],
        "hasMore": true
      }
    }
    ```
  - **内部逻辑**:
    1. 根据 `sortBy` 和 `direction` 参数，构建 Firestore 查询。
    2. 使用 `limit()` 和 `startAfter()` 实现分页。
    3. 查询 `traders` 表并返回列表。

#### 3.2.3. 跟单与交易模块 (`trade`)

- **`getAccountDetails()` - 获取指定账户的资产和订单**
  - **描述**: 获取用户单个交易所账户的总览数据、挂单列表和持仓列表。
  - **触发方式**: HTTP (Callable Function)
  - **入参**:
    ```json
    {
      "userAccountId": "okx-10001"
    }
    ```
  - **出参**:
    ```json
    {
      "success": true,
      "data": {
        "overview": { "totalAssets": 88238.39, "pnl": 54.00 },
        "pendingOrders": [ { "orderId": "..." } ],
        "positions": [ { "orderId": "..." } ]
      }
    }
    ```
  - **内部逻辑**:
    1. 验证用户身份及其对 `userAccountId` 的所有权。
    2. **异步并行执行**：
       a. 调用交易所真实 API，获取账户总览数据。
       b. 查询 `trading_orders` 表，获取 `status` 为 `pending` 的挂单。
       c. 查询 `trading_orders` 表，获取 `status` 为 `active` 或 `closed` 的持仓。
    3. 组合所有数据并返回。

- **`setFollowTrader()` - 设置跟单**
  - **描述**: 创建或更新用户对某个交易员的跟单设置。
  - **触发方式**: HTTP (Callable Function)
  - **入参**:
    ```json
    {
      "traderId": "trader_woods",
      "settings": {
        "userAccountId": "okx-10001",
        "fundStrategy": "ratio",
        "amount": 100,
        "pairs": [ { "pair": "BTC/USDT", "leverage": 20 } ]
      }
    }
    ```
  - **出参**: `{ "success": true, "message": "Follow settings saved." }`
  - **内部逻辑**:
    1. 验证用户登录状态和会员资格。
    2. 使用 `upsert` (更新或插入) 逻辑，在 `user_follows` 表中创建或更新记录。

#### 3.2.4. API 密钥管理模块 (`apiKey`)

- **`addExchangeApiKey()` - 新增/修改API密钥**
  - **描述**: 用户绑定或修改自己的交易所API密钥。
  - **触发方式**: HTTP (Callable Function)
  - **入参**:
    ```json
    {
      "exchange": "okx",
      "apiKey": "...",
      "apiSecret": "...",
      "passphrase": "..."
    }
    ```
  - **出参**: `{ "success": true, "keyId": "key_okx_1", "message": "API key saved securely." }`
  - **内部逻辑**:
    1. 验证用户登录状态。
    2. **关键安全步骤**: 使用 Google Cloud KMS 或 Secret Manager 对 `apiKey`, `apiSecret`, `passphrase` 进行加密。
    3. 将加密后的数据存入 `user_exchange_keys` 表。
    4. 返回新创建的 `keyId`。

### 3.3. 核心功能实现详解

#### 3.3.1. 用户注册 (User Registration)

- **达成效果**: 新用户通过表单（用户名、密码、可选邀请码）创建账户，并记录邀请关系，成功后自动登录并跳转至主页。
- **云函数 (Cloud Function)**:
    - **`registerUser(data, context)`**: 一个 HTTP Callable Function。
    - **入参**: `{ username, password, invitationCode? }`
    - **内部逻辑**:
        1. **查询 `users` 表**: 验证 `username` 是否已存在，防止重复注册。
        2. **(可选) 查询 `users` 表**: 若 `invitationCode` 存在，通过查询找到邀请人，记录其 `userId`。
        3. **调用 Firebase Authentication**: 使用 `auth.createUser()` 方法创建认证用户，获取 `uid`。
        4. **写入 `users` 表**: 在 `users` 集合中创建一个以 `uid` 为主键的新文档，存入 `username`、新生成的唯一 `invitationCode`、`invitedBy` (如有) 等信息。
- **云数据库 (Firestore)**:
    - `users` 表被用于**读取** (检查用户名、邀请码) 和**写入** (创建新用户记录)。

#### 3.3.2. 用户登录 (User Login)

- **达成效果**: 已注册用户通过账号密码登录，成功后进入主页。
- **云函数 (Cloud Function)**: **不使用**。
- **技术说明**: 登录功能由客户端直接调用 **Firebase Authentication SDK** 的 `signInWithEmailAndPassword()` 方法完成。这是最安全、最高效的方式，可以充分利用 Firebase 的安全令牌机制和会话管理，无需自定义后端接口。
- **云数据库 (Firestore)**: 无直接交互。用户信息将在登录成功后，通过调用 `getUserProfile` 云函数获取。

#### 3.3.3. 邀请好友 (Invite Friends)

- **达成效果**: 已登录用户在个人中心或邀请页面，获取自己专属的邀请码和邀请链接，用于分享。
- **云函数 (Cloud Function)**:
    - **复用 `getUserProfile(data, context)`**: 无需新增接口。此函数从 `users` 表中获取当前登录用户的完整资料，其中就包含了 `invitationCode` 字段。
- **前端逻辑**:
    1. 调用 `getUserProfile` 云函数。
    2. 从返回数据中提取 `invitationCode`。
    3. 动态生成邀请链接 (例如: `https://[your-app-url]/register?ref=INVT8888`)。
    4. 将邀请码和链接展示给用户。
- **云数据库 (Firestore)**:
    - `users` 表被 `getUserProfile` 函数**读取**，以获取用户的邀请码。


    