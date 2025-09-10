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
        throw error
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
        throw insErr
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
}
