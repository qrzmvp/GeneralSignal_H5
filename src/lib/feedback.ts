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
    const { error } = await supabase.storage.from(bucket).upload(key, f, { upsert: false, cacheControl: '3600' })
    if (error) {
      dbg('upload error', error)
      throw error
    }
    dbg('upload ok', key)
    paths.push(key)
  }
  return paths
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
  const imagePaths = params.images?.length ? await uploadImages(userId, feedbackId, params.images) : []
  dbg('images done', imagePaths)

  dbg('insert start')
  const { error } = await supabase.from('feedbacks').insert({
    id: feedbackId,
    categories: params.categories,
    description: params.description.trim(),
    images: imagePaths,
    contact: params.contact ?? null,
      env: params.env ?? null
  } as any)
  if (error) {
    dbg('insert error', error)
    throw error
  }
  dbg('insert ok', feedbackId)

  return { id: feedbackId }
}
