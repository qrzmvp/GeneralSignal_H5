# 第三方信号接收 API 部署指南

## 🌐 Vercel 部署配置

### 1. 环境变量设置

在 Vercel Dashboard 中，进入你的项目设置，添加以下环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 生产环境标识
NODE_ENV=production
```

### 2. 域名配置

你的 API 端点将会是：
```
https://your-domain.vercel.app/api/third-party/signals
```

### 3. CORS 配置

已在代码中配置了 CORS 支持：
- 允许所有来源 (`*`)
- 支持 POST 和 OPTIONS 方法
- 接受 `Content-Type` 和 `Authorization` 头部

## 🔌 第三方调用示例

### 基本 cURL 调用

```bash
curl -X POST https://your-domain.vercel.app/api/third-party/signals \
  -H "Content-Type: application/json" \
  -d '{
    "trader_id": "trader-uuid-here",
    "signals": [
      {
        "pair": "BTC-USDT-SWAP",
        "direction": "做多",
        "entry_price": "50000",
        "stop_loss": "48000",
        "order_type": "限价单",
        "contract_type": "永续合约",
        "margin_mode": "全仓"
      }
    ]
  }'
```

### JavaScript/Node.js 调用

```javascript
const response = await fetch('https://your-domain.vercel.app/api/third-party/signals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    trader_id: 'trader-uuid-here',
    signals: [
      {
        pair: 'BTC-USDT-SWAP',
        direction: '做多',
        entry_price: '50000',
        stop_loss: '48000',
        order_type: '限价单',
        contract_type: '永续合约',
        margin_mode: '全仓'
      }
    ]
  })
});

const result = await response.json();
```

### Python 调用

```python
import requests
import json

url = 'https://your-domain.vercel.app/api/third-party/signals'
headers = {'Content-Type': 'application/json'}
data = {
    'trader_id': 'trader-uuid-here',
    'signals': [
        {
            'pair': 'BTC-USDT-SWAP',
            'direction': '做多',
            'entry_price': '50000',
            'stop_loss': '48000',
            'order_type': '限价单',
            'contract_type': '永续合约',
            'margin_mode': '全仓'
        }
    ]
}

response = requests.post(url, headers=headers, data=json.dumps(data))
result = response.json()
```

## ✅ 支持的订单类型

- `限价单` (limit)
- `市价单` (market)

## 📊 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "message": "成功处理 1 条信号数据",
    "processed_signals": 1
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## 🔧 常见错误码

- `INVALID_CONTENT_TYPE`: Content-Type 必须是 application/json
- `INVALID_JSON`: 请求体必须是有效的 JSON 格式
- `MISSING_TRADER_ID`: 缺少交易员ID
- `MISSING_SIGNALS`: 缺少信号数据或信号数据格式不正确
- `TRADER_NOT_FOUND`: 指定的交易员不存在
- `INVALID_SIGNAL_DATA`: 信号数据验证失败
- `INVALID_ORDER_TYPE`: 不支持的订单类型
- `INTERNAL_ERROR`: 服务器内部错误

## 🛠 Vercel 部署步骤

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "feat: 添加第三方信号接收API"
   git push origin dev-2
   ```

2. **连接 Vercel**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 导入你的 GitHub 仓库
   - 选择 `dev-2` 分支进行部署

3. **配置环境变量**
   - 在 Vercel 项目设置中添加所需环境变量
   - 确保 Supabase 配置正确

4. **部署确认**
   - 部署完成后，访问你的域名
   - 测试 API 端点是否可访问

## 🔐 安全建议

1. **API Key 认证** (可选)
   - 可以添加 API Key 验证
   - 在请求头中包含认证信息

2. **速率限制**
   - 考虑添加速率限制
   - 防止 API 滥用

3. **日志监控**
   - 监控 API 调用频率
   - 记录错误和异常

## 📈 监控和维护

- 使用 Vercel Analytics 监控性能
- 定期检查 Supabase 数据库状态
- 监控 API 调用成功率和响应时间
