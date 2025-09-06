import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查环境变量是否正确设置
const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseUrl.includes('supabase.co')
)

if (!isConfigured) {
  console.warn('⚠️ Supabase 环境变量未正确设置。请在 .env.local 文件中配置正确的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY')
} else {
  console.log('✅ Supabase 配置成功！')
}

// 使用默认值以避免错误，但功能不会正常工作
const defaultUrl = 'https://placeholder.supabase.co'
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDU3NzEyMDAsImV4cCI6MTk2MTM0NzIwMH0.placeholder'

export const supabase = createClient(
  isConfigured ? supabaseUrl! : defaultUrl,
  isConfigured ? supabaseAnonKey! : defaultKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// 认证相关类型定义
export interface AuthUser {
  id: string
  email: string
  username?: string
  created_at: string
  updated_at: string
}

// 注册数据类型
export interface RegisterData {
  email: string
  password: string
  username: string
  invitationCode?: string
}

// 登录数据类型
export interface LoginData {
  email: string
  password: string
}

// Helper: check whether an email exists using a secure RPC
export async function rpcEmailExists(email: string): Promise<{ exists: boolean; confirmed: boolean; error?: any }> {
  try {
    const { data, error } = await supabase
      .rpc('email_exists', { email_input: email })
    if (error) return { exists: false, confirmed: false, error }

    // data can be null or an array of one row depending on client; normalize
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return { exists: false, confirmed: false }
  return { exists: Boolean(row.email_exists), confirmed: Boolean(row.email_confirmed) }
  } catch (error) {
    return { exists: false, confirmed: false, error }
  }
}

export async function rpcUsernameExists(username: string): Promise<{ taken: boolean; error?: any }> {
  try {
    const { data, error } = await supabase
      .rpc('username_exists', { username_input: username })
    if (error) return { taken: false, error }
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return { taken: false }
    return { taken: Boolean(row.username_taken) }
  } catch (error) {
    return { taken: false, error }
  }
}
