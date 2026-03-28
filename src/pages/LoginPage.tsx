import AuthLayout from './AuthLayout'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'
import { login } from '../services/api'

type LoginPageProps = {
  onNavigate: (path: RoutePath) => void
  copy: Copy
}

function LoginPage({ onNavigate, copy }: LoginPageProps) {
  return (
    <AuthLayout mode="login" onNavigate={onNavigate} copy={copy}>
      <form
        className="auth-form"
        onSubmit={async (event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          const data = Object.fromEntries(formData.entries())
          
          try {
            const responseData = await login({
              email: data.email,
              password: data.password,
            })
            if (responseData.session) {
                localStorage.setItem('session', JSON.stringify(responseData.session))
            }
            onNavigate('/profile')
          } catch (error: any) {
            console.error(error)
            alert('Error: ' + error.message)
          }
        }}
      >
        <label className="field">
          <span>{copy.auth.email}</span>
          <input type="email" name="email" placeholder={copy.auth.emailPlaceholderLogin} required />
        </label>

        <label className="field">
          <span>{copy.auth.password}</span>
          <input type="password" name="password" placeholder={copy.auth.passwordPlaceholder} required />
        </label>

        <div className="auth-row">
          <label className="checkbox">
            <input type="checkbox" name="remember" />
            <span>{copy.auth.rememberMe}</span>
          </label>
          <button
            type="button"
            className="subtle-link subtle-link-button"
            onClick={() => onNavigate('/signup')}
          >
            {copy.auth.recoverAccess}
          </button>
        </div>

        <button type="submit" className="submit-button">
          {copy.auth.dashboardCta}
        </button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
