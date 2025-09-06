'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function TestPage() {
  const [testEmail, setTestEmail] = useState('qrzmvp@gmail.com')
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, signOut, signIn, checkEmailExists } = useAuth()

  const testEmailCheck = async () => {
    setLoading(true)
    setTestResult('正在测试邮箱重复检查...')
    
    try {
      console.log('开始邮箱存在性检查测试，邮箱:', testEmail)
      
      const result = await checkEmailExists(testEmail)
      
      if (result.error) {
        setTestResult(`❌ 邮箱检查失败: ${result.error.message}`)
        console.log('邮箱检查错误:', result.error.message)
      } else if (result.exists) {
        if (result.confirmed) {
          setTestResult(`✅ 测试1通过: 检测到已注册邮箱（已验证）`)
        } else {
          setTestResult(`✅ 测试1通过: 检测到已注册邮箱（未验证）`) 
        }
        console.log('邮箱已存在:', result)
      } else {
        setTestResult(`✅ 邮箱可用: 该邮箱未注册，可以使用`)
        console.log('邮箱不存在，可以注册')
      }
      
    } catch (error) {
      setTestResult(`❌ 测试1异常: ${error}`)
      console.error('邮箱重复检查测试异常:', error)
    } finally {
      setLoading(false)
    }
  }

  const testSignOut = async () => {
    setLoading(true)
    setTestResult('正在测试退出登录...')
    
    // 检查退出前状态
    const beforeKeys = Object.keys(localStorage).length + Object.keys(sessionStorage).length
    console.log('退出前存储项数量:', beforeKeys)
    
    try {
      await signOut()
      
      // 稍等一下再检查
      setTimeout(() => {
        const afterKeys = Object.keys(localStorage).length + Object.keys(sessionStorage).length
        console.log('退出后存储项数量:', afterKeys)
        
        if (afterKeys === 0) {
          setTestResult('✅ 测试2通过: 退出登录成功，存储已清空')
        } else {
          setTestResult(`❌ 测试2失败: 退出后仍有 ${afterKeys} 个存储项`)
        }
        setLoading(false)
      }, 1000)
    } catch (error) {
      setTestResult(`❌ 测试2异常: ${error}`)
      console.error('退出登录测试异常:', error)
      setLoading(false)
    }
  }

  const testNewUserRegistration = async () => {
    setLoading(true)
    setTestResult('正在测试新用户注册...')
    
    try {
      console.log('开始新用户注册测试，邮箱:', testEmail)
      const result = await signUp(testEmail, 'testpassword123', 'testuser')
      
      if (result.error) {
        setTestResult(`测试结果: ${result.error.message}`)
        console.log('注册测试返回错误:', result.error.message)
      } else {
        setTestResult(`✅ 新用户注册成功，需要邮箱验证`)
        console.log('新用户注册成功:', result)
      }
    } catch (error) {
      setTestResult(`❌ 注册测试异常: ${error}`)
      console.error('注册测试异常:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLocalStorage = () => {
    const keys = Object.keys(localStorage)
    const supabaseKeys = keys.filter(key => 
      key.startsWith('supabase') || 
      key.startsWith('sb-') || 
      key.includes('auth') ||
      key.includes('token')
    )
    
    setTestResult(`本地存储检查:\n总键数: ${keys.length}\nSupabase相关键数: ${supabaseKeys.length}\n${supabaseKeys.join('\n')}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">🧪 功能测试页面</h1>
        
        <div className="space-y-6">
          {/* 邮箱重复检查测试 */}
          <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <h2 className="text-xl font-bold mb-3 text-gray-800">📧 测试1: 邮箱重复检查</h2>
            <p className="text-gray-700 mb-3">应该返回"该邮箱已被注册"的错误信息</p>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:outline-none"
                placeholder="输入已注册的邮箱 (如: qrzmvp@gmail.com)"
              />
              <button
                onClick={testEmailCheck}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? '测试中...' : '测试邮箱检查'}
              </button>
            </div>
            <p className="text-sm text-gray-700 font-medium">✅ 预期结果: 应该返回"该邮箱已被注册"的错误</p>
          </div>

          {/* 新用户注册测试 */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h2 className="text-xl font-bold mb-3 text-gray-800">📝 测试3: 新用户注册</h2>
            <p className="text-gray-700 mb-3">测试全新邮箱的注册流程</p>
            <div className="flex gap-3 mb-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-800 focus:border-green-500 focus:outline-none"
                placeholder="输入新邮箱 (如: 18775311761@163.com)"
              />
              <button
                onClick={testNewUserRegistration}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? '测试中...' : '测试新用户注册'}
              </button>
            </div>
            <p className="text-sm text-gray-700 font-medium">✅ 预期结果: 应该成功注册并发送验证邮件</p>
          </div>

          {/* 退出登录测试 */}
          <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
            <h2 className="text-xl font-bold mb-3 text-gray-800">🚪 测试2: 完整退出登录</h2>
            <p className="text-gray-700 mb-3">应该清除所有本地存储并跳转到登录页</p>
            <div className="flex gap-3 mb-3">
              <button
                onClick={testSignOut}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? '测试中...' : '测试退出登录'}
              </button>
              <button
                onClick={checkLocalStorage}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
              >
                检查本地存储
              </button>
            </div>
          </div>

          {/* 测试结果 */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h2 className="text-xl font-bold mb-3 text-gray-800">📋 测试结果</h2>
            <pre className="bg-white border p-4 rounded-lg text-sm whitespace-pre-wrap text-gray-800 font-mono shadow-inner">
              {testResult || '等待测试...'}
            </pre>
          </div>

          {/* 调试信息 */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h2 className="text-xl font-bold mb-3 text-gray-800">🔍 调试提示</h2>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>• <strong>按 F12</strong> 打开开发者工具查看详细日志</li>
              <li>• <strong>检查 Application → Local Storage</strong> 查看存储状态</li>
              <li>• <strong>测试邮箱检查前</strong>确保邮箱已在数据库中</li>
              <li>• <strong>退出登录后</strong>尝试访问受保护页面验证</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
