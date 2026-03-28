import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SignupPage from './pages/SignupPage'
import { messages } from './i18n'
import type { Locale } from './i18n'
import type { Copy } from './i18n'
import './App.css'

export type RoutePath = '/' | '/login' | '/signup' | '/profile'
type ThemeMode = 'light' | 'dark'

function normalizePath(pathname: string): RoutePath {
  if (pathname === '/login') return '/login'
  if (pathname === '/profile') return '/profile'
  if (pathname === '/signup') return '/signup'
  return '/'
}

function getInitialTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem('theme-mode')
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialLocale(): Locale {
  const storedLocale = window.localStorage.getItem('locale')
  if (storedLocale === 'es' || storedLocale === 'en') {
    return storedLocale
  }

  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

function App() {
  const [route, setRoute] = useState<RoutePath>(() => normalizePath(window.location.pathname))
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('theme-mode', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem('locale', locale)
  }, [locale])

  const navigate = (path: RoutePath) => {
    if (path === route) return
    window.history.pushState({}, '', path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setRoute(path)
  }

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  const copy = messages[locale]

  if (route === '/login') {
    return (
      <main className="landing-shell auth-shell">
        <TopControls
          copy={copy}
          locale={locale}
          theme={theme}
          onToggleTheme={toggleTheme}
          onChangeLocale={setLocale}
        />
        <LoginPage onNavigate={navigate} copy={copy} />
      </main>
    )
  }

  if (route === '/signup') {
    return (
      <main className="landing-shell auth-shell">
        <TopControls
          copy={copy}
          locale={locale}
          theme={theme}
          onToggleTheme={toggleTheme}
          onChangeLocale={setLocale}
        />
        <SignupPage onNavigate={navigate} copy={copy} />
      </main>
    )
  }

  if (route === '/profile') {
    return (
      <main className="landing-shell profile-shell-wrapper">
        <TopControls
          copy={copy}
          locale={locale}
          theme={theme}
          onToggleTheme={toggleTheme}
          onChangeLocale={setLocale}
        />
        <ProfilePage onNavigate={navigate} copy={copy} />
      </main>
    )
  }

  return (
    <main className="landing-shell">
      <TopControls
        copy={copy}
        locale={locale}
        theme={theme}
        onToggleTheme={toggleTheme}
        onChangeLocale={setLocale}
      />
      <LandingPage onNavigate={navigate} copy={copy} />
    </main>
  )
}

function TopControls({
  copy,
  locale,
  theme,
  onToggleTheme,
  onChangeLocale,
}: {
  copy: Copy
  locale: Locale
  theme: ThemeMode
  onToggleTheme: () => void
  onChangeLocale: (locale: Locale) => void
}) {
  return (
    <div className="top-controls">
      <div className="locale-toggle" role="group" aria-label={copy.common.languageSelector}>
        <button
          type="button"
          className={locale === 'es' ? 'locale-pill is-active' : 'locale-pill'}
          onClick={() => onChangeLocale('es')}
        >
          ES
        </button>
        <button
          type="button"
          className={locale === 'en' ? 'locale-pill is-active' : 'locale-pill'}
          onClick={() => onChangeLocale('en')}
        >
          EN
        </button>
      </div>

      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={theme === 'light' ? copy.common.themeDark : copy.common.themeLight}
        title={theme === 'light' ? copy.common.themeDark : copy.common.themeLight}
      >
        <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
      </button>
    </div>
  )
}

export default App
