# 第三方信号数据对接API

## 概述

本API系统用于接收第三方交易信号数据并提供查询接口。系统包括信号接收、数据验证、存储和查询功能。

## API端点

### 1. 信号接收接口

**POST** `/api/third-party/signals`

接收第三方系统推送的交易信号数据。

#### 请求头
```
Authorization: Bearer {api_key}
Content-Type: application/json
```

#### 请求体
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

#### 响应
```json
{
  "success": true,
  "data": {
    "message": "成功处理 1 条信号数据",
    "processed_signals": 1
  }
}
```

### 2. 历史信号查询接口

**GET** `/api/third-party/signals/history`

查询指定交易员的历史信号数据。

#### 请求头
```
Authorization: Bearer {api_key}
```

#### 查询参数
- `trader_id` (必需): 交易员ID
- `page` (可选): 页码，默认为1
- `page_size` (可选): 每页大小，默认为20，最大100

#### 响应
```json
{
  "success": true,
  "data": {
    "signals": [...],
    "pagination": {
      "current_page": 1,
      "page_size": 20,
      "total_items": 100,
      "total_pages": 5,
      "has_next_page": true,
      "has_previous_page": false
    }
  }
}
```

### 3. 当前信号查询接口

**GET** `/api/third-party/signals/current`

查询指定交易员的当前信号数据。

#### 请求头
```
Authorization: Bearer {api_key}
```

#### 查询参数
- `trader_id` (必需): 交易员ID
- `page` (可选): 页码，默认为1
- `page_size` (可选): 每页大小，默认为20，最大100

#### 响应
```json
{
  "success": true,
  "data": {
    "signals": [...],
    "pagination": {
      "current_page": 1,
      "page_size": 20,
      "total_items": 10,
      "total_pages": 1,
      "has_next_page": false,
      "has_previous_page": false
    }
  }
}
```

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "success": false,
  "error": {
    "code": "错误代码",
    "message": "错误描述"
  }
}
```

### 常见错误代码

- `UNAUTHORIZED`: 缺少或无效的API密钥
- `RATE_LIMIT_EXCEEDED`: 请求频率超过限制
- `MISSING_TRADER_ID`: 缺少交易员ID
- `TRADER_NOT_FOUND`: 指定的交易员不存在
- `INVALID_SIGNAL_DATA`: 信号数据验证失败
- `DATABASE_ERROR`: 数据库操作失败
- `INTERNAL_ERROR`: 服务器内部错误

## 认证与安全

### API密钥

所有API请求都需要在请求头中包含有效的API密钥：

```
Authorization: Bearer {your_api_key}
```

### 请求频率限制

为防止滥用，系统对API请求频率进行了限制：

- 每分钟最多60次请求
- 每小时最多1000次请求

超过限制的请求将返回429状态码。

## 数据模型

### 信号对象

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| pair | string | 是 | 交易对 |
| direction | string | 是 | 方向 ("做多" 或 "做空") |
| entry_price | string | 是 | 入场价格 |
| stop_loss | string | 是 | 止损点位 |
| suggested_pnl_ratio | string | 是 | 建议盈亏比 |
| take_profit_1 | string | 否 | 止盈点位1 |
| take_profit_2 | string | 否 | 止盈点位2 |
| order_type | string | 否 | 订单类型，默认为"限价单" |
| contract_type | string | 否 | 合约类型，默认为"永续合约" |
| margin_mode | string | 否 | 保证金模式，默认为"全仓" |
| status | string | 否 | 状态 |
| created_at | string | 否 | 创建时间，如果不提供则使用服务器当前时间 |
| ended_at | string | 否 | 结束时间 |

## 使用示例

### 发送信号数据

```bash
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

### 查询历史信号

```bash
curl -X GET "https://yourdomain.com/api/third-party/signals/history?trader_id=0f3a1d5a-1a8e-4f8b-8c8d-1b8e1f8a8c8d&page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 查询当前信号

```bash
curl -X GET "https://yourdomain.com/api/third-party/signals/current?trader_id=0f3a1d5a-1a8e-4f8b-8c8d-1b8e1f8a8c8d&page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_API_KEY"
```