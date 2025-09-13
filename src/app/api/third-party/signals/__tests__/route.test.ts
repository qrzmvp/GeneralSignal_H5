import { POST } from '../route';
import { supabase } from '@/lib/supabase';
import { calculateRealTimeStats } from '@/lib/signals';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn().mockReturnThis(),
  },
}));

// Mock signals module
jest.mock('@/lib/signals', () => ({
  calculateRealTimeStats: jest.fn(),
  convertDBSignalToUnified: jest.fn(),
}));

// Mock rate-limit module
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ isAllowed: true }),
  logApiRequest: jest.fn(),
  getApiKeyId: jest.fn().mockResolvedValue('test-api-key-id'),
}));

describe('POST /api/third-party/signals', () => {
  const mockRequest = (body: any, headers: Record<string, string> = {}) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: (key: string) => headers[key] || null,
      },
    } as unknown as Request;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization header is missing', async () => {
    const request = mockRequest({}, {});
    const response = await POST(request);
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

  it('should return 401 if API key is invalid', async () => {
    (supabase.from('').select('').eq('').eq('').single as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    });

    const request = mockRequest(
      {},
      { authorization: 'Bearer invalid-key' }
    );
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'API密钥无效',
      },
    });
  });

  it('should return 400 if trader_id is missing', async () => {
    (supabase.from('').select('').eq('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'test-api-key-id', is_active: true },
      error: null,
    });

    const request = mockRequest(
      { signals: [] },
      { authorization: 'Bearer valid-key' }
    );
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'MISSING_TRADER_ID',
        message: '缺少交易员ID',
      },
    });
  });

  it('should return 400 if signals array is missing or empty', async () => {
    (supabase.from('').select('').eq('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'test-api-key-id', is_active: true },
      error: null,
    });

    (supabase.from('').select('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'trader-id' },
      error: null,
    });

    const request = mockRequest(
      { trader_id: 'trader-id' },
      { authorization: 'Bearer valid-key' }
    );
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'MISSING_SIGNALS',
        message: '缺少信号数据或信号数据格式不正确',
      },
    });
  });

  it('should return 404 if trader does not exist', async () => {
    (supabase.from('').select('').eq('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'test-api-key-id', is_active: true },
      error: null,
    });

    (supabase.from('').select('').eq('').single as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    });

    const request = mockRequest(
      {
        trader_id: 'non-existent-trader',
        signals: [
          {
            pair: 'BTC-USDT-SWAP',
            direction: '做多',
            entry_price: '45000',
            stop_loss: '44000',
            suggested_pnl_ratio: '2.5:1',
          },
        ],
      },
      { authorization: 'Bearer valid-key' }
    );
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      success: false,
      error: {
        code: 'TRADER_NOT_FOUND',
        message: '指定的交易员不存在',
      },
    });
  });

  it('should return 400 if signal data is invalid', async () => {
    (supabase.from('').select('').eq('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'test-api-key-id', is_active: true },
      error: null,
    });

    (supabase.from('').select('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'trader-id' },
      error: null,
    });

    const request = mockRequest(
      {
        trader_id: 'trader-id',
        signals: [
          {
            // Missing required fields
          },
        ],
      },
      { authorization: 'Bearer valid-key' }
    );
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error.code).toBe('INVALID_SIGNAL_DATA');
  });

  it('should successfully process valid signals', async () => {
    (supabase.from('').select('').eq('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'test-api-key-id', is_active: true },
      error: null,
    });

    (supabase.from('').select('').eq('').single as jest.Mock).mockResolvedValue({
      data: { id: 'trader-id' },
      error: null,
    });

    (supabase.from('').insert as jest.Mock).mockResolvedValue({
      error: null,
    });

    (calculateRealTimeStats as jest.Mock).mockResolvedValue({
      stats: {
        winRate: 80,
        pnlRatio: 2.5,
        yieldRate: 150,
        totalSignals: 10,
      },
      error: null,
    });

    (supabase.from('').update('').eq as jest.Mock).mockResolvedValue({
      error: null,
    });

    const request = mockRequest(
      {
        trader_id: 'trader-id',
        signals: [
          {
            pair: 'BTC-USDT-SWAP',
            direction: '做多',
            entry_price: '45000',
            stop_loss: '44000',
            suggested_pnl_ratio: '2.5:1',
          },
        ],
      },
      { authorization: 'Bearer valid-key' }
    );
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.processed_signals).toBe(1);
  });
});