
'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { CryptoBackground } from '../components/CryptoBackground'

type AppState = 'login' | 'register'

function LoginPageContent() {
  const [currentPage, setCurrentPage] = useState<AppState>('login')
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationCode = searchParams.get('ref');

  // 如果链接带有 ref，则默认切换到注册页并自动带上邀请码
  useEffect(() => {
    if (invitationCode) {
      setCurrentPage('register')
    }
  }, [invitationCode])

  const handleSwitchToRegister = () => {
    setCurrentPage('register')
  }

  const handleSwitchToLogin = () => {
    setCurrentPage('login')
  }

  const handleLoginSuccess = () => {
    router.push('/')
  }

  const handleRegisterSuccess = () => {
    router.push('/')
  }

  return (
    <main className="min-h-screen relative flex justify-center pt-20">
      <CryptoBackground />
      
      <div className="relative z-10 w-full max-w-sm px-4 py-8 sm:px-6 md:px-8">
        <div className="space-y-6">
          {currentPage === 'login' && (
            <LoginForm 
              onSwitchToRegister={handleSwitchToRegister}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
          
          {currentPage === 'register' && (
            <RegisterForm 
              onSwitchToLogin={handleSwitchToLogin}
              onRegisterSuccess={handleRegisterSuccess}
              invitationCode={invitationCode}
            />
          )}
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
