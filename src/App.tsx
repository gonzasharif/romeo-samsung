import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SignupPage from './pages/SignupPage'
import './App.css'

export type RoutePath = '/' | '/login' | '/signup' | '/profile'

function normalizePath(pathname: string): RoutePath {
  if (pathname === '/login') return '/login'
  if (pathname === '/profile') return '/profile'
  if (pathname === '/signup') return '/signup'
  return '/'
}

function App() {
  const [route, setRoute] = useState<RoutePath>(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path: RoutePath) => {
    if (path === route) return
    window.history.pushState({}, '', path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setRoute(path)
  }

  if (route === '/login') {
    return (
      <main className="landing-shell auth-shell">
        <LoginPage onNavigate={navigate} />
      </main>
    )
  }

  if (route === '/signup') {
    return (
      <main className="landing-shell auth-shell">
        <SignupPage onNavigate={navigate} />
      </main>
    )
  }

  if (route === '/profile') {
    return (
      <main className="landing-shell profile-shell-wrapper">
        <ProfilePage onNavigate={navigate} />
      </main>
    )
  }

  return (
    <main className="landing-shell">
      <LandingPage onNavigate={navigate} />
    </main>
  )
}

export default App
