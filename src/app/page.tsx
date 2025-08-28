'use client'

import { useState } from 'react'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { WelcomePage } from './components/WelcomePage'
import { CryptoBackground } from './components/CryptoBackground'

type AppState = 'login' | 'register' | 'welcome'

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppState>('login')

  const handleSwitchToRegister = () => {
    setCurrentPage('register')
  }

  const handleSwitchToLogin = () => {
    setCurrentPage('login')
  }

  const handleLoginSuccess = () => {
    setCurrentPage('welcome')
  }

  const handleRegisterSuccess = () => {
    setCurrentPage('welcome')
  }

  const handleLogout = () => {
    setCurrentPage('login')
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
          
          {currentPage === 'welcome' && (
            <WelcomePage onLogout={handleLogout} />
          )}
        </div>
      </div>
    </main>
  )
}
