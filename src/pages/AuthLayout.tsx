import type { ReactNode } from 'react'
import type { RoutePath } from '../App'

type AuthLayoutProps = {
  mode: 'login' | 'signup'
  onNavigate: (path: RoutePath) => void
  children: ReactNode
}

function AuthLayout({ mode, onNavigate, children }: AuthLayoutProps) {
  const isSignup = mode === 'signup'

  return (
    <section className="auth-layout">
      <button type="button" className="back-home" onClick={() => onNavigate('/')}>
        Volver al inicio
      </button>

      <div className="auth-showcase">
        <div className="auth-badge">{isSignup ? 'Nuevo workspace' : 'Acceso seguro'}</div>
        <h1>{isSignup ? 'Creá tu cuenta y empezá a validar' : 'Volvé a tu laboratorio de ideas'}</h1>
        <p className="auth-lead">
          {isSignup
            ? 'Registrate para crear proyectos, generar perfiles de agentes y lanzar simulaciones con señales reales de demanda.'
            : 'Entrá para revisar corridas, comparar escenarios y seguir ajustando tu producto con evidencia.'}
        </p>

        <div className="auth-visual">
          <div className="pulse-ring ring-one" />
          <div className="pulse-ring ring-two" />
          <div className="visual-core">
            <span>AI</span>
          </div>
          <div className="floating-card float-a">
            <strong>72%</strong>
            <span>demanda estimada</span>
          </div>
          <div className="floating-card float-b">
            <strong>3 perfiles</strong>
            <span>listos para simular</span>
          </div>
          <div className="floating-card float-c">
            <strong>+1 escenario</strong>
            <span>compará precio y propuesta</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-inner">
          <p className="section-tag">{isSignup ? 'Registro' : 'Log in'}</p>
          <h2>{isSignup ? 'Abrí tu cuenta' : 'Ingresá a tu cuenta'}</h2>
          <p className="auth-copy">
            {isSignup
              ? 'Completá tus datos para crear tu espacio de trabajo.'
              : 'Usá tu email corporativo y tu contraseña para entrar.'}
          </p>

          {children}

          <p className="auth-switch">
            {isSignup ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
            <button
              type="button"
              className="inline-link-button"
              onClick={() => onNavigate(isSignup ? '/login' : '/signup')}
            >
              {isSignup ? 'Iniciá sesión' : 'Registrate'}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}

export default AuthLayout
