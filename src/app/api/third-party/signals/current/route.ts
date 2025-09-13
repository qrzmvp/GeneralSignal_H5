import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertDBSignalToUnified } from '@/lib/signals';
import { checkRateLimit, logApiRequest, getApiKeyId } from '@/lib/rate-limit';

// 定义查询参数类型
interface QueryParams {
  trader_id?: string;
  page?: string;
  page_size?: string;
}

// 定义错误响应类型
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// 定义成功响应类型
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// 验证API密钥的函数
async function verifyApiKey(apiKey: string): Promise<boolean> {
  // 查询数据库验证API密钥的有效性
  const { data, error } = await supabase
    .from('third_party_api_keys')
    .select('id, is_active')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();
  
  // 如果没有错误且数据存在，则API密钥有效
  return !error && !!data;
}

export async function GET(request: Request) {
  try {
    // 验证API密钥
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '缺少API密钥或格式不正确'
        }
      } as ErrorResponse, { status: 401 });
    }
    
    const apiKey = authHeader.substring(7);
    const isApiKeyValid = await verifyApiKey(apiKey);
    
    if (!isApiKeyValid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API密钥无效'
        }
      } as ErrorResponse, { status: 401 });
    }
    
    // 获取API密钥ID
    const apiKeyId = await getApiKeyId(apiKey);
    if (!apiKeyId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API密钥无效'
        }
      } as ErrorResponse, { status: 401 });
    }
    
    // 检查请求频率限制
    const rateLimitCheck = await checkRateLimit(apiKeyId, '/api/third-party/signals/current');
    if (!rateLimitCheck.isAllowed) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitCheck.message || '请求频率超过限制'
        }
      } as ErrorResponse, { status: 429 });
    }
    
    // 记录API请求日志
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    await logApiRequest(apiKeyId, '/api/third-party/signals/current', clientIp);
    
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get('trader_id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);
    
    // 验证必需参数
    if (!traderId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_TRADER_ID',
          message: '缺少交易员ID参数'
        }
      } as ErrorResponse, { status: 400 });
    }
    
    // 验证分页参数
    if (page < 1) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PAGE',
          message: '页码必须大于0'
        }
      } as ErrorResponse, { status: 400 });
    }
    
    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PAGE_SIZE',
          message: '页面大小必须在1-100之间'
        }
      } as ErrorResponse, { status: 400 });
    }
    
    // 查询当前信号数据
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await supabase
      .from('trader_signals')
      .select('*', { count: 'exact' })
      .eq('trader_id', traderId)
      .eq('signal_type', 'current')
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('查询当前信号数据失败:', error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '查询当前信号数据失败'
        }
      } as ErrorResponse, { status: 500 });
    }
    
    // 转换数据格式
    const signals = (data || []).map(convertDBSignalToUnified);
    
    // 计算分页信息
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        signals,
        pagination: {
          current_page: page,
          page_size: pageSize,
          total_items: total,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_previous_page: hasPreviousPage
        }
      }
    } as SuccessResponse<any>, { status: 200 });
    
  } catch (error) {
    console.error('查询当前信号数据时发生错误:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    } as ErrorResponse, { status: 500 });
  }
}