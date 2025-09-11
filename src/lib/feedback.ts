import { supabase } from '@/lib/supabase'

const dbg = (...args: any[]) => {
  try { console.debug('[feedback]', ...args) } catch {}
}

export type FeedbackCategory = 'feature' | 'account' | 'ui' | 'other'

export interface SubmitFeedbackParams {
  categories: FeedbackCategory[]
  description: string
  images?: File[]
  contact?: string
  env?: Record<string, any>
}

export interface SubmitFeedbackResult { id: string }

export interface FeedbackRecord {
  id: string
  categories: string[]
  description: string
  images: string[]
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  contact?: string
}

export interface FeedbackHistoryResponse {
  data: FeedbackRecord[]
  total: number
  hasMore: boolean
}

export interface FeedbackHistoryQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
}

function genId() {
  // 浏览器/现代运行时优先
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
      // @ts-ignore
      return crypto.randomUUID() as string
    }
  } catch {}
  // 退化：简易 UUID v4 兼容
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 上传图片到私有桶并返回其 storage 路径
async function uploadImages(userId: string, feedbackId: string, files: File[]) {
  const bucket = 'feedback-attachments'
  const paths: string[] = []

  for (const f of files.slice(0, 3)) {
    const ext = (f.name.split('.').pop() || 'png').toLowerCase()
    const key = `${userId}/${feedbackId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    dbg('upload start', { bucket, key, size: f.size, type: f.type })
    
    const { error } = await supabase.storage.from(bucket).upload(key, f, {
      upsert: true,
      cacheControl: '3600',
      contentType: f.type || 'image/png',
    })
    
    if (error) {
      dbg('upload error', { 
        key, 
        code: (error as any)?.statusCode || (error as any)?.code, 
        message: error.message,
        status: (error as any)?.status
      })
      throw error
    }
    
    dbg('upload ok', key)
    paths.push(key)
  }
  return paths
}

function isTooManyRequests(err: any) {
  if (!err) return false
  const code = String(err.code || '')
  const msg = String(err.message || '')
  const details = String((err as any).details || '')
  // 服务端触发器使用 P0001 + DETAIL='TooManyRequests'
  if (details.includes('TooManyRequests')) return true
  // 某些环境可能把消息带回来
  if (/Too\s*Many\s*Requests/i.test(msg)) return true
  // PostgREST 常见 429
  if (code === '429') return true
  return false
}

export async function submitFeedback(params: SubmitFeedbackParams): Promise<SubmitFeedbackResult> {
  dbg('submit begin', { categories: params.categories, hasImages: Boolean(params.images?.length) })
  
  try {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (!userId) throw new Error('请先登录')

    if (!params.categories?.length) throw new Error('请选择问题类型')
    if (!params.description || params.description.trim().length < 10) throw new Error('问题描述至少 10 个字')

    const feedbackId = genId()
    dbg('user', userId, 'feedbackId', feedbackId)

    // 1) 先落库（不带 images），避免存储问题阻塞提交
    dbg('insert (text-only) start')
    const baseEnv: any = { ...(params.env || {}) }
    let insertedVia: 'rpc' | 'direct' | null = null
    {
      const { error } = await supabase.rpc('create_feedback', {
        p_id: feedbackId,
        p_categories: params.categories as unknown as string[],
        p_description: params.description.trim(),
        p_images: [] as any,
        p_contact: params.contact ?? null,
        p_env: baseEnv as any,
      })
      if (error) {
        dbg('rpc insert error', error)
        if (isTooManyRequests(error)) {
          throw new Error('提交太频繁，请 60 秒后再试')
        }
        const msg = String(error?.message || '')
        const code = String((error as any)?.code || '')
        const looksMissing = /Could not find the function|PGRST116|function .* does not exist/i.test(msg) || code === 'PGRST116'
        if (!looksMissing) {
          // 将错误对象转换为可读字符串
          const errorMsg = error?.message || error?.hint || '反馈提交失败'
          throw new Error(errorMsg)
        }
        dbg('fallback to direct insert (text-only)')
        const { error: insErr } = await supabase.from('feedbacks').insert({
          id: feedbackId,
          categories: params.categories,
          description: params.description.trim(),
          images: [],
          contact: params.contact ?? null,
          env: baseEnv,
        } as any)
        if (insErr) {
          dbg('direct insert error', insErr)
          if (isTooManyRequests(insErr)) throw new Error('提交太频繁，请 60 秒后再试')
          // 将错误对象转换为可读字符串
          const errorMsg = insErr?.message || insErr?.hint || '反馈提交失败'
          throw new Error(errorMsg)
        }
        insertedVia = 'direct'
      } else {
        insertedVia = 'rpc'
      }
      dbg('text-only insert ok via', insertedVia)
    }

    // 2) 再尝试上传图片；若全部失败，记录错误但不影响提交成功
    const toUpload = params.images?.length ? params.images : []
    let imagePaths: string[] = []
    let uploadErr: any = null
    if (toUpload && toUpload.length) {
      try {
        imagePaths = await uploadImages(userId, feedbackId, toUpload)
      } catch (e) {
        uploadErr = e
        dbg('images failed after insert, keep text-only', e)
      }
    }

    // 3) 若有成功的图片，补写 feedbacks.images；同时把 uploaded / upload_error 记到 env
    try {
      const patch: any = {
        env: { ...baseEnv, uploaded: imagePaths, upload_error: uploadErr ? String((uploadErr as any)?.message || uploadErr) : null },
      }
      if (imagePaths.length) patch.images = imagePaths
      if (imagePaths.length || uploadErr) {
        const { error: upErr } = await supabase.from('feedbacks').update(patch).eq('id', feedbackId)
        if (upErr) dbg('patch images/env error', upErr)
        else dbg('patch images/env ok', { n: imagePaths.length })
      }
    } catch (e) {
      dbg('patch step error', e)
    }

    return { id: feedbackId }
  } catch (error: any) {
    dbg('submitFeedback catch error', error)
    // 确保抛出的是字符串错误
    if (error instanceof Error) {
      throw error
    }
    // 如果不是Error对象，转换为字符串
    const errorMsg = error?.message || error?.hint || '反馈提交失败，请稍后重试'
    throw new Error(errorMsg)
  }
}

// 获取用户反馈历史记录
export async function getFeedbackHistory(params: FeedbackHistoryQuery = {}): Promise<FeedbackHistoryResponse> {
  const { page = 1, limit = 10, search, status } = params
  
  dbg('getFeedbackHistory', { page, limit, search, status })
  
  try {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (!userId) throw new Error('请先登录')
    
    let query = supabase
      .from('feedbacks')
      .select('id, categories, description, images, status, created_at, updated_at, contact', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    // 应用搜索过滤
    if (search && search.trim()) {
      query = query.ilike('description', `%${search.trim()}%`)
    }
    
    // 应用状态过滤
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    // 应用分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      dbg('getFeedbackHistory error', error)
      // 更友好的错误信息
      if (error.code === 'PGRST301') {
        throw new Error('没有权限查看反馈记录')
      }
      if (error.message.includes('JWT')) {
        throw new Error('登录已过期，请重新登录')
      }
      throw new Error(error.message || '加载反馈记录失败')
    }
    
    const records: FeedbackRecord[] = (data || []).map(item => ({
      id: item.id,
      categories: item.categories || [],
      description: item.description || '',
      images: Array.isArray(item.images) ? item.images : [],
      status: item.status || 'pending',
      created_at: item.created_at,
      updated_at: item.updated_at,
      contact: item.contact || undefined
    }))
    
    const total = count || 0
    const hasMore = data ? data.length === limit : false
    
    dbg('getFeedbackHistory result', { total, hasMore, recordsCount: records.length })
    
    return {
      data: records,
      total,
      hasMore
    }
  } catch (error: any) {
    dbg('getFeedbackHistory catch error', error)
    // 重新抛出错误，保持原始错误信息
    throw error
  }
}

// 获取单个反馈详情
export async function getFeedbackDetail(feedbackId: string): Promise<FeedbackRecord | null> {
  dbg('getFeedbackDetail', { feedbackId })
  
  try {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (!userId) throw new Error('请先登录')
    
    const { data, error } = await supabase
      .from('feedbacks')
      .select('id, categories, description, images, status, created_at, updated_at, contact')
      .eq('id', feedbackId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      dbg('getFeedbackDetail error', error)
      if (error.code === 'PGRST116') {
        return null // 记录不存在
      }
      // 将错误对象转换为可读字符串
      const errorMsg = error?.message || error?.hint || '获取反馈详情失败'
      throw new Error(errorMsg)
    }
    
    if (!data) return null
    
    return {
      id: data.id,
      categories: data.categories || [],
      description: data.description || '',
      images: Array.isArray(data.images) ? data.images : [],
      status: data.status || 'pending',
      created_at: data.created_at,
      updated_at: data.updated_at,
      contact: data.contact || undefined
    }
  } catch (error: any) {
    dbg('getFeedbackDetail catch error', error)
    // 确保抛出的是字符串错误
    if (error instanceof Error) {
      throw error
    }
    // 如果不是Error对象，转换为字符串
    const errorMsg = error?.message || error?.hint || '获取反馈详情失败'
    throw new Error(errorMsg)
  }
}

// 反馈类型标签映射
export const FEEDBACK_TYPE_LABELS = {
  'feature': '功能建议',
  'ui': '界面问题', 
  'account': '账号问题',
  'other': '其他问题'
} as const

// 反馈状态标签映射
export const FEEDBACK_STATUS_LABELS = {
  'pending': '待处理',
  'processing': '处理中',
  'resolved': '已解决',
  'closed': '已关闭'
} as const
