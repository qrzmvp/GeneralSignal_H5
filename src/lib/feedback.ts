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
      contentType: (f as any).type || 'image/png',
    })
    if (error) {
      dbg('upload error', error)
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
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) throw new Error('请先登录')

  if (!params.categories?.length) throw new Error('请选择问题类型')
  if (!params.description || params.description.trim().length < 10) throw new Error('问题描述至少 10 个字')

  const feedbackId = genId()
  dbg('user', userId, 'feedbackId', feedbackId)
  let imagePaths: string[] = []
  let uploadErr: any = null
  try {
    imagePaths = params.images?.length ? await uploadImages(userId, feedbackId, params.images) : []
  } catch (e) {
    uploadErr = e
    dbg('images failed, continue without images', e)
  }
  dbg('images done', imagePaths)

  dbg('rpc insert start')
  const { data, error } = await supabase.rpc('create_feedback', {
    p_id: feedbackId,
    p_categories: params.categories as unknown as string[],
    p_description: params.description.trim(),
    p_images: imagePaths as unknown as any,
    p_contact: params.contact ?? null,
    p_env: { ...(params.env || {}), upload_error: uploadErr ? String((uploadErr as any)?.message || uploadErr) : null } as any,
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
      throw error
    }
    // Fallback: direct insert (requires DB to have relaxed RLS policy)
    dbg('fallback to direct insert')
    const { error: insErr } = await supabase.from('feedbacks').insert({
      id: feedbackId,
      categories: params.categories,
      description: params.description.trim(),
      images: imagePaths,
      contact: params.contact ?? null,
      env: { ...(params.env || {}), upload_error: uploadErr ? String((uploadErr as any)?.message || uploadErr) : null },
    } as any)
    if (insErr) {
      dbg('direct insert error', insErr)
      if (isTooManyRequests(insErr)) {
        throw new Error('提交太频繁，请 60 秒后再试')
      }
      throw insErr
    }
    dbg('direct insert ok', feedbackId)
  } else {
    dbg('rpc insert ok', data)
  }

  return { id: feedbackId }
}
