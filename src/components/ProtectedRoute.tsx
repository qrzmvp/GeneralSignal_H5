'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 如果 Supabase 未配置，不需要跳转
    if (!isConfigured) {
      return
    }

    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, isConfigured, router])

  // 如果 Supabase 未配置，显示配置提示页面
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">⚙️ 配置 Supabase</h1>
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p>请按照以下步骤配置 Supabase：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>创建 Supabase 项目</li>
                <li>在 .env.local 文件中设置环境变量</li>
                <li>运行数据库设置脚本</li>
              </ol>
              <p className="mt-4">
                详细说明请查看 <code className="bg-muted px-1 py-0.5 rounded">SUPABASE_SETUP.md</code> 文件
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">正在跳转到登录页...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
