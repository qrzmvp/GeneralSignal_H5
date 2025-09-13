import { GET } from '../route';
import { supabase } from '@/lib/supabase';
import { convertDBSignalToUnified } from '@/lib/signals';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    count: jest.fn(),
  },
}));

// Mock signals module
jest.mock('@/lib/signals', () => ({
  convertDBSignalToUnified: jest.fn(),
}));

// Mock rate-limit module
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ isAllowed: true }),
  logApiRequest: jest.fn(),
  getApiKeyId: jest.fn().mockResolvedValue('test-api-key-id'),
  verifyApiKey: jest.fn().mockResolvedValue(true),
}));

describe('GET /api/third-party/signals/history', () => {
  const mockRequest = (queryParams: Record<string, string> = {}, headers: Record<string, string> = {}) => {
    const url = new URL('http://localhost/api/third-party/signals/history');
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return {
      url: url.toString(),
      headers: {
        get: (key: string) => headers[key] || null,
      },
    } as unknown as Request;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization header is missing', async () => {
    const request = mockRequest({ trader_id: 'trader-id' });
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '缺少API密钥或格式不正确',
      },
    });
  });

  it('should return 400 if trader_id is missing', async () => {
    const request = mockRequest(
      {},
      { authorization: 'Bearer valid-key' }
    );
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'MISSING_TRADER_ID',
        message: '缺少交易员ID参数',
      },
    });
  });

  it('should return 400 if page is invalid', async () => {
    const request = mockRequest(
      { trader_id: 'trader-id', page: '0' },
      { authorization: 'Bearer valid-key' }
    );
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'INVALID_PAGE',
        message: '页码必须大于0',
      },
    });
  });

  it('should return 400 if page_size is invalid', async () => {
    const request = mockRequest(
      { trader_id: 'trader-id', page_size: '0' },
      { authorization: 'Bearer valid-key' }
    );
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'INVALID_PAGE_SIZE',
        message: '页面大小必须在1-100之间',
      },
    });
  });

  it('should successfully return historical signals', async () => {
    (supabase.from('').select('').eq('').eq('').order('').range as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'signal-1',
          trader_id: 'trader-id',
          signal_type: 'historical',
          pair: 'BTC-USDT-SWAP',
          direction: '做多',
          entry_price: '45000',
          stop_loss: '44000',
          suggested_pnl_ratio: '2.5:1',
          created_at: '2023-01-01T00:00:00Z',
        },
      ],
      error: null,
      count: 1,
    });

    (convertDBSignalToUnified as jest.Mock).mockImplementation((dbSignal) => ({
      id: 1,
      signalType: 'historical',
      pair: dbSignal.pair,
      direction: dbSignal.direction,
      entryPrice: dbSignal.entry_price,
      stopLoss: dbSignal.stop_loss,
      pnlRatio: dbSignal.suggested_pnl_ratio,
      createdAt: '2023-01-01 00:00:00',
      endedAt: '2023-01-01 01:00:00',
      status: '止盈平仓',
    }));

    const request = mockRequest(
      { trader_id: 'trader-id', page: '1', page_size: '10' },
      { authorization: 'Bearer valid-key' }
    );
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.signals).toHaveLength(1);
    expect(responseBody.data.pagination).toEqual({
      current_page: 1,
      page_size: 10,
      total_items: 1,
      total_pages: 1,
      has_next_page: false,
      has_previous_page: false,
    });
  });

  it('should return 500 if database query fails', async () => {
    (supabase.from('').select('').eq('').eq('').order('').range as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Database error'),
      count: null,
    });

    const request = mockRequest(
      { trader_id: 'trader-id' },
      { authorization: 'Bearer valid-key' }
    );
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '查询历史信号数据失败',
      },
    });
  });
});