'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 检查环境变量
    const checkConfig = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('=== 环境变量检查 ===')
      console.log('NEXT_PUBLIC_SUPABASE_URL:', url)
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY 长度:', key?.length)
      console.log('URL 有效性:', url?.includes('supabase.co'))
      
      return {
        url,
        key,
        isValid: url?.includes('supabase.co') && key && key.length > 100
      }
    }

    const config = checkConfig()
    setTestResult(`环境配置: ${config.isValid ? '✅ 正常' : '❌ 异常'}`)
  }, [])

  const testEmailSending = async () => {
    setLoading(true)
    try {
      console.log('=== 测试邮件发送 ===')
      
      // 使用有效的测试邮箱
      const testEmail = 'qrzmvp@gmail.com'
      console.log('使用测试邮箱:', testEmail)
      
      // 尝试发送测试邮件
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          data: {
            username: 'testuser'
          },
          emailRedirectTo: `${window.location.origin}/login?verified=true`
        }
      })

      console.log('测试注册响应:', { data, error })
      
      if (error) {
        console.error('测试邮件发送错误:', error)
        setTestResult(prev => prev + `\n📧 邮件测试: ❌ ${error.message}`)
        
        // 如果是用户已存在的错误，尝试重发邮件
        if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
          console.log('用户已存在，尝试重发确认邮件...')
          
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: testEmail,
            options: {
              emailRedirectTo: `${window.location.origin}/login?verified=true`
            }
          })
          
          if (resendError) {
            console.error('重发邮件错误:', resendError)
            setTestResult(prev => prev + `\n🔄 重发邮件: ❌ ${resendError.message}`)
          } else {
            console.log('重发邮件成功')
            setTestResult(prev => prev + `\n🔄 重发邮件: ✅ 已发送到 ${testEmail}`)
          }
        }
      } else {
        console.log('测试邮件发送成功')
        setTestResult(prev => prev + `\n📧 邮件测试: ✅ 已发送到 ${testEmail}`)
        
        // 显示用户信息
        if (data?.user) {
          setTestResult(prev => prev + `\n👤 用户ID: ${data.user!.id}`)
          setTestResult(prev => prev + `\n📧 邮箱状态: ${data.user!.email_confirmed_at ? '已确认' : '待确认'}`)
        }
      }
    } catch (err) {
      console.error('测试异常:', err)
      setTestResult(prev => prev + `\n📧 邮件测试: ❌ 异常: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const checkSupabaseProject = async () => {
    setLoading(true)
    try {
      console.log('=== 检查 Supabase 项目状态 ===')
      
      // 1. 检查会话信息
      const { data: session, error: sessionError } = await supabase.auth.getSession()
      console.log('会话检查:', { session, sessionError })
      
      // 2. 检查数据库访问
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      console.log('数据库访问测试:', { users, usersError })
      
      // 3. 检查 Auth 配置
      console.log('=== Auth 配置检查 ===')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Current origin:', window.location.origin)
      
      // 4. 尝试获取现有用户信息
      const { data: existingUser, error: userError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('email', 'qrzmvp@gmail.com')
        .single()
      
      console.log('现有用户检查:', { existingUser, userError })
      
      let result = `\n🔍 项目连接: ${sessionError ? '❌' : '✅'}`
      result += `\n🗄️ 数据库访问: ${usersError ? '❌' : '✅'}`
      
      if (usersError) {
        result += `\n❌ 数据库错误: ${usersError.message}`
      }
      
      // 检查邮件发送历史
      try {
        console.log('=== 检查邮件发送历史 ===')
        // 注意：这个API可能需要服务端权限
        const { data: logs, error: logsError } = await supabase
          .from('auth.audit_log_entries')
          .select('*')
          .eq('payload->email', 'qrzmvp@gmail.com')
          .order('created_at', { ascending: false })
          .limit(5)
        
        console.log('邮件日志:', { logs, logsError })
        
        if (logs && logs.length > 0) {
          result += `\n📧 邮件发送记录: 找到 ${logs.length} 条记录`
        } else {
          result += `\n📧 邮件发送记录: 无记录或无权限访问`
        }
      } catch (logErr) {
        console.log('无法访问邮件日志（需要特殊权限）:', logErr)
        result += `\n📧 邮件日志: 无法访问（正常现象）`
      }
      
      setTestResult(prev => prev + result)
      
      // 显示关键的排查信息
      setTestResult(prev => prev + `\n\n🔍 关键排查点:`)
      setTestResult(prev => prev + `\n1. 检查 Supabase Dashboard > Authentication > Settings`)
      setTestResult(prev => prev + `\n2. 确认 "Enable email confirmations" 已开启`)
      setTestResult(prev => prev + `\n3. 检查 "Email Templates" 中的确认邮件模板`)
      setTestResult(prev => prev + `\n4. 验证 "URL Configuration" 中的重定向设置`)
      setTestResult(prev => prev + `\n5. 查看 Gmail 的垃圾邮件和促销邮件文件夹`)
      
    } catch (err) {
      console.error('项目检查异常:', err)
      setTestResult(prev => prev + `\n🔍 项目检查: ❌ 异常: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white text-center">🔧 Supabase 邮件调试工具</h1>
        
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">📊 系统检查结果</h2>
          <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm">
            <pre className="whitespace-pre-wrap">
              {testResult || '等待检查...'}
            </pre>
          </div>
        </div>

  const checkEmailConfiguration = async () => {
    setLoading(true)
    try {
      console.log('=== 邮件配置深度检查 ===')
      
      // 检查 Supabase 项目设置
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const projectRef = projectUrl?.split('//')[1]?.split('.')[0]
      
      console.log('项目信息:', {
        url: projectUrl,
        ref: projectRef,
        origin: window.location.origin
      })
      
      // 尝试获取项目的公开配置信息
      try {
        const response = await fetch(`${projectUrl}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          }
        })
        
        console.log('API 连接测试:', {
          status: response.status,
          ok: response.ok
        })
        
        setTestResult(prev => prev + `\n🌐 API 连接: ${response.ok ? '✅' : '❌'} (${response.status})`)
      } catch (apiErr) {
        console.error('API 连接失败:', apiErr)
        setTestResult(prev => prev + `\n🌐 API 连接: ❌ ${apiErr}`)
      }
      
      // 检查重定向 URL 格式
      const redirectUrl = `${window.location.origin}/login?verified=true`
      console.log('重定向 URL:', redirectUrl)
      setTestResult(prev => prev + `\n🔗 重定向 URL: ${redirectUrl}`)
      
      // 模拟邮件模板检查
      setTestResult(prev => prev + `\n\n📧 邮件配置检查清单:`)
      setTestResult(prev => prev + `\n□ Authentication > Settings > "Enable email confirmations"`)
      setTestResult(prev => prev + `\n□ Authentication > Settings > "Confirm email"`)
      setTestResult(prev => prev + `\n□ Authentication > Email Templates > "Confirm signup"`)
      setTestResult(prev => prev + `\n□ Authentication > URL Configuration > 添加: ${redirectUrl}`)
      setTestResult(prev => prev + `\n□ 检查 Gmail 垃圾邮件/促销邮件文件夹`)
      
    } catch (err) {
      console.error('邮件配置检查异常:', err)
      setTestResult(prev => prev + `\n📧 邮件配置检查: ❌ ${err}`)
    } finally {
      setLoading(false)
    }
  }
          <button
            onClick={checkSupabaseProject}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 检查中...' : '🔍 检查 Supabase 项目'}
          </button>
          
          <button
            onClick={testEmailSending}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '📧 测试中...' : '📧 测试邮件发送'}
          </button>
        </div>

        <div className="bg-blue-100 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-blue-800 text-lg mb-3">📮 测试邮件信息</h3>
          <div className="text-blue-800">
            <p><strong>测试邮箱:</strong> qrzmvp@gmail.com</p>
            <p><strong>说明:</strong> 点击"测试邮件发送"将尝试向此邮箱发送验证邮件</p>
            <p><strong>注意:</strong> 如果邮箱已注册，系统会自动尝试重发确认邮件</p>
          </div>
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 rounded-lg p-6">
          <h3 className="font-bold text-yellow-800 text-xl mb-4">⚠️ 调试指南</h3>
          <div className="space-y-3 text-yellow-800">
            <div className="flex items-start space-x-3">
              <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              <span>打开浏览器开发者工具 (F12) → Console 标签页查看详细日志</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              <span>确认 Supabase 项目的邮件设置已正确配置</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              <span>检查邮件服务是否启用 (Authentication → Settings → Auth Providers)</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              <span>验证邮件模板是否正确设置</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-red-100 border-l-4 border-red-500 rounded-lg p-6">
          <h3 className="font-bold text-red-800 text-xl mb-4">🚨 常见问题</h3>
          <div className="text-red-800 space-y-2">
            <p><strong>问题1:</strong> 邮件发送但收不到 → 检查垃圾邮件文件夹</p>
            <p><strong>问题2:</strong> 163/QQ邮箱收不到 → 配置自定义SMTP或使用Gmail</p>
            <p><strong>问题3:</strong> 点击链接出错 → 检查重定向URL配置</p>
            <p><strong>问题4:</strong> 完全不发送邮件 → 检查Supabase邮件确认功能是否启用</p>
          </div>
        </div>
      </div>
    </div>
  )
}
