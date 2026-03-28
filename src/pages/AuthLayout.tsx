import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'

type AuthLayoutProps = {
  mode: 'login' | 'signup'
  onNavigate: (path: RoutePath) => void
  children: ReactNode
  copy: Copy
}

function AuthLayout({ mode, onNavigate, children, copy }: AuthLayoutProps) {
  const isSignup = mode === 'signup'

  return (
    <section className="auth-layout">
      <button type="button" className="back-home" onClick={() => onNavigate('/')}>
        {copy.common.backHome}
      </button>

      <div className="auth-showcase">
        <div className="auth-badge">{isSignup ? copy.auth.signupBadge : copy.auth.loginBadge}</div>
        <h1>{isSignup ? copy.auth.signupTitle : copy.auth.loginTitle}</h1>
        <p className="auth-lead">
          {isSignup ? copy.auth.signupLead : copy.auth.loginLead}
        </p>

        <div className="auth-visual">
          <div className="pulse-ring ring-one" />
          <div className="pulse-ring ring-two" />
          <div className="visual-core">
            <span>{copy.auth.aiCore}</span>
          </div>
          <div className="floating-card float-a">
            <strong>72%</strong>
            <span>{copy.auth.demandEstimated}</span>
          </div>
          <div className="floating-card float-b">
            <strong>{copy.auth.profilesCount}</strong>
            <span>{copy.auth.profilesReady}</span>
          </div>
          <div className="floating-card float-c">
            <strong>{copy.auth.scenarioCount}</strong>
            <span>{copy.auth.compareScenario}</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-inner">
          <p className="section-tag">{isSignup ? copy.auth.signupTag : copy.auth.loginTag}</p>
          <h2>{isSignup ? copy.auth.signupHeading : copy.auth.loginHeading}</h2>
          <p className="auth-copy">{isSignup ? copy.auth.signupCopy : copy.auth.loginCopy}</p>

          {children}

          <p className="auth-switch">
            {isSignup ? copy.auth.alreadyHaveAccount : copy.auth.noAccount}{' '}
            <button
              type="button"
              className="inline-link-button"
              onClick={() => onNavigate(isSignup ? '/login' : '/signup')}
            >
              {isSignup ? copy.auth.signIn : copy.auth.signUp}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}

export default AuthLayout
