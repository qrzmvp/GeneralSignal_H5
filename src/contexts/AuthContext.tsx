'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, rpcEmailExists } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  signUp: (email: string, password: string, username: string, invitationCode?: string) => Promise<{ error: any, data?: any, needsEmailConfirmation?: boolean, user?: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resendEmailConfirmation: (email: string) => Promise<{ error: any }>
  checkEmailExists: (email: string) => Promise<{ exists?: boolean, confirmed?: boolean, error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 检查 Supabase 是否正确配置
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')
  )

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    console.log('✅ Supabase 配置成功！')

    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [isConfigured])

  // 专门的邮箱检查方法（优先使用 RPC；失败时退化为旧的推断方式）
  const checkEmailExists = async (email: string) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase 未正确配置，请检查环境变量设置' } }
    }

    try {
      // 1) Try secure RPC backed by auth.users
      const rpc = await rpcEmailExists(email)
      if (!rpc.error) {
        return { exists: rpc.exists, confirmed: rpc.confirmed, error: null }
      }
      console.warn('email_exists RPC failed, fallback to heuristic:', rpc.error)

      // 2) Fallback: attempt password sign-in with impossible password to infer
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'impossible-password-12345678901234567890',
      })

      if (error) {
        if (error.message?.includes('Email not confirmed')) {
          return { exists: true, confirmed: false, error: null }
        }
        return { exists: false, error: null }
      }
      await supabase.auth.signOut()
      return { exists: true, confirmed: true, error: null }
    } catch (error) {
      console.error('邮箱检查异常:', error)
      return { error: { message: '邮箱检查服务异常，请稍后重试' } }
    }
  }

  const signUp = async (email: string, password: string, username: string, invitationCode?: string) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase 未正确配置，请检查环境变量设置' } }
    }

    try {
      console.log('=== 开始注册过程 ===')
      console.log('注册参数:', { email, username, invitationCode })
      // 直接执行注册，由后端判定是否重复
      console.log('步骤1: 执行新用户注册')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            invitation_code: invitationCode,
          },
          emailRedirectTo: `${window.location.origin}/login?verified=true`
        }
      })

      console.log('注册结果:', { data, error })

      if (error) {
        console.log('注册错误:', error.message)
        
        if (error.message?.includes('User already registered')) {
          return { 
            error: { 
              message: '该邮箱已被注册，请使用其他邮箱或尝试登录' 
            } 
          }
        } else if (error.message?.includes('rate limit')) {
          return {
            error: {
              message: '请求过于频繁，请稍后再试'
            }
          }
    } else if (error.message?.includes('Database error saving new user')) {
          return {
            error: {
      message: '注册失败：资料写入异常（可能是邮箱或资料字段冲突），请更换邮箱或稍后重试'
            }
          }
        } else {
          return { error }
        }
      }

      if (data.user) {
        console.log('✅ 注册成功')
        return { 
          error: null, 
          data,
          needsEmailConfirmation: !data.user.email_confirmed_at,
          user: data.user
        }
      }

      return { error: { message: '注册过程中发生意外错误，请重试' } }
    } catch (error) {
      console.error('注册异常:', error)
      return { error: { message: '注册服务异常，请稍后重试' } }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase 未正确配置，请检查环境变量设置' } }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    if (!isConfigured) {
      return
    }
    
    try {
      console.log('=== 开始退出登录（硬清除） ===')

      // 1) 立即清空前端可见存储，保证 UI 立刻“无会话”
      if (typeof window !== 'undefined') {
        try {
          const localKeys = Object.keys(localStorage)
          localKeys.forEach(k => {
            if (k.startsWith('supabase') || k.startsWith('sb-') || k.includes('auth') || k.includes('token') || k.includes('session')) {
              localStorage.removeItem(k)
            }
          })
          localStorage.clear()
        } catch {}

        try {
          const sessionKeys = Object.keys(sessionStorage)
          sessionKeys.forEach(k => {
            if (k.startsWith('supabase') || k.startsWith('sb-') || k.includes('auth') || k.includes('token') || k.includes('session')) {
              sessionStorage.removeItem(k)
            }
          })
          sessionStorage.clear()
        } catch {}

        try {
          document.cookie.split(';').forEach(c => {
            const eqPos = c.indexOf('=')
            const name = (eqPos > -1 ? c.substr(0, eqPos) : c).trim()
            const paths = ['/', '/login']
            paths.forEach(p => {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${p}`
            })
          })
        } catch {}

        // 深层数据（异步，不阻塞跳转）
        try {
          const anyIndexed: any = indexedDB as any
          if (anyIndexed?.databases) {
            anyIndexed.databases().then((dbs: any[]) => {
              dbs?.forEach((db: any) => db?.name && indexedDB.deleteDatabase(db.name))
            })
          } else {
            ;['SupabaseAuth', 'supabase-auth', 'localforage', 'firebaseLocalStorageDb'].forEach(name => {
              try { indexedDB.deleteDatabase(name) } catch {}
            })
          }
        } catch {}

        try {
          if ('caches' in window) {
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
          }
        } catch {}

        try {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
          }
        } catch {}
      }

      // 2) 通知 Supabase 注销（全局）
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (e) {
        console.warn('调用 Supabase signOut 失败（忽略）:', e)
      }

      // 3) 清空内存态并跳转
      setUser(null)
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
      
    } catch (error) {
      console.error('退出登录异常:', error)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.replace('/login')
      }
    }
  }

  const resendEmailConfirmation = async (email: string) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase 未正确配置' } }
    }

    try {
      console.log('=== 开始重发邮件确认 ===')
      console.log('重发邮件参数:', {
        email,
        timestamp: new Date().toISOString()
      })

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login?verified=true`
        }
      })

      console.log('重发邮件响应:', { data, error })

      if (error) {
        console.error('重发邮件失败:', error)
        return { error }
      }

      console.log('✅ 邮件重发成功')
      return { error: null, data }
    } catch (error) {
      console.error('重发邮件异常:', error)
      return { error: { message: '重发邮件失败，请稍后重试' } }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        signUp,
        signIn,
        signOut,
        resendEmailConfirmation,
        checkEmailExists,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}