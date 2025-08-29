'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { CryptoBackground } from '../components/CryptoBackground'

type AppState = 'login' | 'register'

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppState>('login')
  const router = useRouter();

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
            />
          )}
        </div>
      </div>
    </main>
  )
}
