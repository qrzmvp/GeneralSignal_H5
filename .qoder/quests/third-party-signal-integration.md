# 第三方信号数据对接技术方案

## 1. 概述

本技术方案旨在设计并实现一个第三方信号数据对接系统，用于接收外部交易信号数据并生成每个交易员的信号数据。该系统将作为现有GeneralSignal_H5平台的扩展功能，通过API接口接收第三方信号数据，经过验证和处理后存储到数据库中，并实时更新交易员的统计数据。

## 2. 系统架构

```
graph TD
    A[第三方信号提供方] --> B[信号接收API]
    B --> C[数据验证层]
    C --> D[信号数据存储]
    D --> E[交易员统计数据更新]
    E --> F[前端展示层]
    D --> G[历史信号查询API]
    D --> H[当前信号查询API]
```

### 2.1 核心组件

1. **信号接收API**：提供RESTful接口供第三方系统推送信号数据
2. **数据验证层**：验证信号数据的完整性和有效性
3. **信号数据存储**：将验证通过的信号数据存储到数据库
4. **统计数据更新**：根据新信号数据更新交易员统计信息
5. **查询API**：提供历史信号和当前信号的查询接口

## 3. 信号接收API设计

### 3.1 接收方式

信号接收将通过Webhook方式实现，第三方系统可以通过HTTP POST请求将信号数据推送到我们的API接口。该接口将部署在Next.js应用中，利用Next.js的API路由功能实现。

### 3.2 接口详情

**Endpoint**: `POST /api/third-party/signals`

**Headers**:
- `Content-Type`: `application/json`
- `Authorization`: `Bearer {api_key}` (用于身份验证)

**Request Body**:
```json
{
  "trader_id": "交易员ID",
  "signals": [
    {
      "pair": "交易对",
      "direction": "方向",
      "entry_price": "入场价格",
      "take_profit_1": "止盈点位1",
      "take_profit_2": "止盈点位2",
      "stop_loss": "止损点位",
      "suggested_pnl_ratio": "建议盈亏比",
      "order_type": "订单类型",
      "contract_type": "合约类型",
      "margin_mode": "保证金模式",
      "status": "状态",
      "created_at": "创建时间",
      "ended_at": "结束时间"
    }
  ]
}
```

#### 字段必填性说明

##### 信号对象必填字段：
- `pair`: 交易对
- `direction`: 方向 ("做多" 或 "做空")
- `entry_price`: 入场价格
- `stop_loss`: 止损点位
- `suggested_pnl_ratio`: 建议盈亏比

##### 信号对象可选字段：
- `take_profit_1`: 止盈点位1
- `take_profit_2`: 止盈点位2
- `order_type`: 订单类型，默认为"限价单"
- `contract_type`: 合约类型，默认为"永续合约"
- `margin_mode`: 保证金模式，默认为"全仓"
- `status`: 状态
- `created_at`: 创建时间，如果不提供则使用服务器当前时间
- `ended_at`: 结束时间

关于订单类型，目前系统中默认使用"限价单"，但数据库表设计已支持存储不同类型的订单。未来如果需要支持市价单，只需在`order_type`字段中传入"市价单"即可，数据库层面无需改动。系统在展示时会根据`order_type`字段的值进行显示。

### 3.3 认证机制

为确保API安全，我们将采用API密钥认证机制：
1. 为每个第三方合作伙伴生成唯一的API密钥
2. 第三方系统在请求时需在Header中包含`Authorization: Bearer {api_key}`
3. 服务端验证API密钥的有效性后才处理请求

### 3.4 接口调用时序图

```
sequenceDiagram
    participant ThirdParty as 第三方系统
    participant API as 信号接收API
    participant DB as 数据库
    participant Stats as 统计服务
    
    ThirdParty->>API: POST /api/third-party/signals
    API->>API: 验证API密钥
    alt API密钥无效
        API-->>ThirdParty: 401 Unauthorized
    else API密钥有效
        API->>API: 验证数据格式
        alt 数据格式错误
            API-->>ThirdParty: 400 Bad Request
        else 数据格式正确
            API->>DB: 存储信号数据
            DB-->>API: 存储结果
            API->>Stats: 触发统计数据更新
            Stats->>DB: 查询并计算统计数据
            DB-->>Stats: 返回计算结果
            Stats->>DB: 更新交易员统计数据
            DB-->>Stats: 更新结果
            Stats-->>API: 更新完成
            API-->>ThirdParty: 200 OK
        end
    end
```

### 3.5 错误处理机制

接口在处理请求时可能会返回以下错误：

#### 400 Bad Request
- **缺少必填字段**：请求中缺少必填字段时返回
- **字段格式错误**：字段值不符合预期格式时返回
- **数据验证失败**：数据验证不通过时返回

#### 401 Unauthorized
- **API密钥缺失**：请求头中未包含Authorization字段时返回
- **API密钥无效**：提供的API密钥无效或已过期时返回

#### 404 Not Found
- **交易员不存在**：指定的交易员ID在系统中不存在时返回

#### 500 Internal Server Error
- **服务器内部错误**：服务器处理请求时发生未预期的错误时返回

错误响应格式：
```json
{
  "success": false,
  "error": {
    "code": "错误代码",
    "message": "错误描述"
  }
}
```

### 3.6 示例

第三方系统可以通过以下方式推送信号数据：

```
curl -X POST https://yourdomain.com/api/third-party/signals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "trader_id": "0f3a1d5a-1a8e-4f8b-8c8d-1b8e1f8a8c8d",
    "signals": [
      {
        "pair": "BTC-USDT-SWAP",
        "direction": "做多",
        "entry_price": "45000",
        "take_profit_1": "46000",
        "take_profit_2": "47000",
        "stop_loss": "44000",
        "suggested_pnl_ratio": "2.5:1",
        "order_type": "限价单",
        "contract_type": "永续合约",
        "margin_mode": "全仓",
        "status": "进行中",
        "created_at": "2023-05-20 10:00:00"
      }
    ]
  }'
```

## 4. 数据模型设计

### 4.1 交易员信号表 (trader_signals)

该表结构已存在于系统中，用于存储交易信号数据：

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | uuid | 主键 |
| trader_id | uuid | 关联的交易员ID |
| signal_type | text | 信号类型 ('current' 或 'historical') |
| pair | text | 交易对 |
| direction | text | 方向 ('做多' 或 '做空') |
| entry_price | text | 入场价格 |
| take_profit_1 | text | 止盈点位1 |
| take_profit_2 | text | 止盈点位2 |
| stop_loss | text | 止损点位 |
| suggested_pnl_ratio | text | 建议盈亏比 |
| order_type | text | 订单类型 |
| contract_type | text | 合约类型 |
| margin_mode | text | 保证金模式 |
| status | text | 状态 |
| created_at | timestamptz | 创建时间 |
| ended_at | timestamptz | 结束时间 |
| actual_exit_price | text | 实际退出价格 |
| actual_pnl | numeric | 实际盈亏 |

### 4.2 交易员表 (traders)

交易员表存储交易员基本信息和统计数据：

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | uuid | 主键 |
| name | text | 交易员名称 |
| description | text | 描述 |
| yield_rate | numeric | 收益率 |
| win_rate | numeric | 胜率 |
| profit_loss_ratio | numeric | 盈亏比 |
| total_signals | integer | 总信号数 |
| avatar_url | text | 头像URL |
| tags | text[] | 标签数组 |

## 5. 现有API接口分析

### 5.1 信号查询接口

目前系统中已存在信号查询相关的功能，主要在前端通过Supabase客户端直接访问数据库实现。相关的API接口包括：

#### 获取交易员信号数据

在`src/lib/signals.ts`中已实现以下函数：

1. `getTraderSignals(traderId: string)` - 获取指定交易员的所有信号数据
2. `getTraderSignalsPaged(traderId: string, page: number, pageSize: number, signalType?: 'current' | 'historical')` - 获取指定交易员的分页信号数据

这些函数通过Supabase客户端查询`trader_signals`表获取数据，并将数据库中的信号数据转换为前端统一信号格式。

#### 获取历史信号

前端通过调用`getTraderSignalsPaged`函数并传入`signalType: 'historical'`参数获取历史信号数据。

#### 获取当前信号

前端通过调用`getTraderSignalsPaged`函数并传入`signalType: 'current'`参数获取当前信号数据。

### 5.2 信号展示

在交易员详情页面(`src/app/trader/[id]/page.tsx`)中，系统通过`useEffect`钩子调用`getTraderSignals`函数获取信号数据，并分别展示当前信号和历史信号。

```
// 获取交易员信号数据的示例
useEffect(() => {
  const fetchSignals = async () => {
    const { signals, error } = await getTraderSignals(traderId);
    if (!error) {
      // 处理并展示信号数据
    }
  };
  fetchSignals();
}, [traderId]);
```

### 5.3 信号查询API的改进建议

为了更好地支持第三方系统查询信号数据，建议将现有的信号查询功能封装为独立的API接口：

#### 获取历史信号

**GET** `/api/third-party/signals/history?trader_id={trader_id}&page={page}&page_size={page_size}`

#### 获取当前信号

**GET** `/api/third-party/signals/current?trader_id={trader_id}&page={page}&page_size={page_size}`

这些API接口将复用现有的`getTraderSignalsPaged`函数实现，并提供标准的RESTful接口供外部系统调用。

## 6. 业务逻辑处理

### 6.1 数据验证流程

```
flowchart TD
    A[接收信号数据] --> B{验证必需字段}
    B -- 缺失字段 --> C[返回错误]
    B -- 字段完整 --> D{验证交易员ID}
    D -- 无效ID --> E[返回错误]
    D -- 有效ID --> F{验证信号类型}
    F -- 无效类型 --> G[返回错误]
    F -- 有效类型 --> H[存储信号数据]
    H --> I[更新统计数据]
    I --> J[返回成功响应]
```

### 6.2 统计数据更新机制

当接收到新的信号数据后，系统将自动调用统计计算函数更新交易员的统计数据：

1. 胜率计算：基于历史信号中"止盈平仓"状态的信号数量
2. 盈亏比计算：基于历史信号的实际盈亏数据
3. 收益率计算：基于历史信号的实际盈亏和固定仓位(1000 USDT)
4. 总信号数更新：统计当前和历史信号总数

## 7. 安全与权限控制

在设计中已经考虑了对第三方系统推送信号的频率或次数进行限制，以防止恶意请求和过载。具体的限制措施包括：

1. **请求频率限制**：通过限制每个API密钥的请求频率（例如每分钟不超过60次请求）来防止过载
2. **信号数量限制**：可以限制单次请求中信号数据的数量（例如每次请求不超过100条信号）
3. **数据量限制**：限制单次请求的数据大小（例如不超过1MB）

### 限制配置

这些限制默认配置如下：
- 请求频率限制：每分钟60次请求
- 单次请求信号数量限制：每次请求最多100条信号
- 单次请求数据大小限制：每次请求不超过1MB

后续可以通过以下方式修改这些限制：
1. **配置文件修改**：在应用的配置文件中调整相应的参数值
2. **环境变量设置**：通过设置环境变量来覆盖默认配置
3. **数据库配置表**：创建专门的配置表存储这些限制参数，支持运行时动态调整
4. **管理后台**：开发管理后台界面，允许管理员动态调整这些限制参数

修改限制时需要考虑服务器性能、数据库负载以及业务需求的平衡，避免设置过于宽松导致系统过载或设置过于严格影响正常使用。

这些限制将在API网关或应用层实现，确保系统的稳定性和安全性。

### 7.1 API访问控制

1. **API密钥认证**：第三方系统需要通过API密钥进行身份验证
2. **IP白名单**：限制允许访问的IP地址范围
3. **请求频率限制**：防止恶意请求和过载，限制每个API密钥的请求频率（例如每分钟不超过60次请求）

### 7.2 数据安全

1. **传输加密**：使用HTTPS协议传输数据
2. **数据验证**：严格验证所有输入数据
3. **错误处理**：敏感信息不在错误响应中暴露

## 8. 部署与监控

### 8.1 部署方案

1. **集成部署**：作为现有Next.js应用的一部分部署
2. **独立部署**：作为独立的微服务部署

### 8.2 监控指标

1. **API响应时间**：监控接口响应时间
2. **数据处理成功率**：监控信号数据处理成功率
3. **错误日志**：记录和分析处理错误

## 9. 测试策略

### 9.1 单元测试

1. 数据验证函数测试
2. 信号数据处理逻辑测试
3. 统计数据计算测试

### 9.2 集成测试

1. API接口测试
2. 数据库读写测试
3. 第三方系统对接测试
