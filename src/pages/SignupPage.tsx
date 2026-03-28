import AuthLayout from './AuthLayout'
import type { RoutePath } from '../App'

type SignupPageProps = {
  onNavigate: (path: RoutePath) => void
}

function SignupPage({ onNavigate }: SignupPageProps) {
  return (
    <AuthLayout mode="signup" onNavigate={onNavigate}>
      <form
        className="auth-form signup-form"
        onSubmit={(event) => {
          event.preventDefault()
          onNavigate('/profile')
        }}
      >
        <div className="field-grid">
          <label className="field">
            <span>Nombre completo</span>
            <input type="text" name="full_name" placeholder="Ada Founder" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="ada@empresa.com" required />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Password</span>
            <input type="password" name="password" placeholder="Mínimo 8 caracteres" required />
          </label>
          <label className="field">
            <span>Confirmar password</span>
            <input
              type="password"
              name="confirm_password"
              placeholder="Volvé a ingresar tu password"
              required
            />
          </label>
        </div>

        <button type="submit" className="submit-button">
          Crear cuenta
        </button>
      </form>
    </AuthLayout>
  )
}

export default SignupPage
