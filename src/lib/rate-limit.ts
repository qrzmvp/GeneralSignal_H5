import { supabase } from '@/lib/supabase';

// 频率限制配置
const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 60,  // 每分钟最多60次请求
  requestsPerHour: 1000,  // 每小时最多1000次请求
};

/**
 * 检查API请求频率是否超出限制
 * @param apiKeyId API密钥ID
 * @param endpoint 请求的端点
 * @returns { isAllowed: boolean, message?: string }
 */
export async function checkRateLimit(apiKeyId: string, endpoint: string) {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // 查询最近一分钟的请求数量
    const { count: minuteCount, error: minuteError } = await supabase
      .from('api_request_logs')
      .select('*', { count: 'exact' })
      .eq('api_key_id', apiKeyId)
      .eq('endpoint', endpoint)
      .gte('requested_at', oneMinuteAgo.toISOString());
    
    if (minuteError) {
      console.error('查询分钟请求频率时出错:', minuteError);
      // 出错时允许请求，避免影响正常功能
      return { isAllowed: true };
    }
    
    // 检查每分钟限制
    if (minuteCount && minuteCount >= RATE_LIMIT_CONFIG.requestsPerMinute) {
      return { 
        isAllowed: false, 
        message: `每分钟请求次数超过限制 (${RATE_LIMIT_CONFIG.requestsPerMinute}次/分钟)` 
      };
    }
    
    // 查询最近一小时的请求数量
    const { count: hourCount, error: hourError } = await supabase
      .from('api_request_logs')
      .select('*', { count: 'exact' })
      .eq('api_key_id', apiKeyId)
      .eq('endpoint', endpoint)
      .gte('requested_at', oneHourAgo.toISOString());
    
    if (hourError) {
      console.error('查询小时请求频率时出错:', hourError);
      // 出错时允许请求，避免影响正常功能
      return { isAllowed: true };
    }
    
    // 检查每小时限制
    if (hourCount && hourCount >= RATE_LIMIT_CONFIG.requestsPerHour) {
      return { 
        isAllowed: false, 
        message: `每小时请求次数超过限制 (${RATE_LIMIT_CONFIG.requestsPerHour}次/小时)` 
      };
    }
    
    return { isAllowed: true };
  } catch (error) {
    console.error('检查请求频率时发生错误:', error);
    // 出错时允许请求，避免影响正常功能
    return { isAllowed: true };
  }
}

/**
 * 记录API请求日志
 * @param apiKeyId API密钥ID
 * @param endpoint 请求的端点
 * @param ipAddress 请求的IP地址
 */
export async function logApiRequest(apiKeyId: string, endpoint: string, ipAddress?: string) {
  try {
    await supabase
      .from('api_request_logs')
      .insert({
        api_key_id: apiKeyId,
        endpoint: endpoint,
        ip_address: ipAddress || null,
        requested_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('记录API请求日志时出错:', error);
  }
}

/**
 * 获取API密钥ID
 * @param apiKey API密钥
 * @returns API密钥ID或null
 */
export async function getApiKeyId(apiKey: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('third_party_api_keys')
      .select('id')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('获取API密钥ID时出错:', error);
    return null;
  }
}