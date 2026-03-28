import AuthLayout from './AuthLayout'
import type { RoutePath } from '../App'

type LoginPageProps = {
  onNavigate: (path: RoutePath) => void
}

function LoginPage({ onNavigate }: LoginPageProps) {
  return (
    <AuthLayout mode="login" onNavigate={onNavigate}>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          onNavigate('/profile')
        }}
      >
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="vos@empresa.com" required />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" name="password" placeholder="Ingresá tu contraseña" required />
        </label>

        <div className="auth-row">
          <label className="checkbox">
            <input type="checkbox" name="remember" />
            <span>Recordarme</span>
          </label>
          <button
            type="button"
            className="subtle-link subtle-link-button"
            onClick={() => onNavigate('/signup')}
          >
            Recuperar acceso
          </button>
        </div>

        <button type="submit" className="submit-button">
          Entrar al dashboard
        </button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
