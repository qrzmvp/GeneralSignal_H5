# 数据库文件说明

## 📁 目录结构

### setup/ - 数据库初始化文件
- `supabase_setup.sql` - 核心Supabase配置（必须执行）
- `membership_system_setup.sql` - 会员系统设置
- `create_signals_tables.sql` - 信号表创建
- `production_data_deploy.sql` - 生产环境数据部署
- `rpc_*.sql` - 存储过程和函数
- `setup_avatar_storage.sql` - 头像存储配置

### test-data/ - 测试数据
- `insert_*.sql` - 各种测试数据插入脚本
- `create_test_payment_records.sql` - 测试支付记录
- `verify_test_data.sql` - 数据验证脚本

### maintenance/ - 维护和修复
- `database_fix.sql` - 数据库修复脚本（重要）
- `fix_*.sql` - 各种修复脚本
- `update_*.sql` - 数据更新脚本
- `validate_*.sql` - 数据验证脚本

## 🚀 执行顺序

1. **首次设置**：
   ```sql
   -- 1. 执行核心设置
   setup/supabase_setup.sql
   
   -- 2. 执行会员系统
   setup/membership_system_setup.sql
   
   -- 3. 创建信号表
   setup/create_signals_tables.sql
   ```

2. **开发环境测试数据**：
   ```sql
   -- 执行任意 test-data/ 中的脚本
   ```

3. **生产环境**：
   ```sql
   -- 执行生产数据部署
   setup/production_data_deploy.sql
   ```

## ⚠️ 注意事项

- 所有setup文件都是幂等的，可以重复执行
- test-data文件仅用于开发和测试
- maintenance文件用于问题修复，谨慎使用