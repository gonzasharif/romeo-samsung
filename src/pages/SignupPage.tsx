import AuthLayout from './AuthLayout'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'
import { signup } from '../services/api'

type SignupPageProps = {
  onNavigate: (path: RoutePath) => void
  copy: Copy
}

function SignupPage({ onNavigate, copy }: SignupPageProps) {
  return (
    <AuthLayout mode="signup" onNavigate={onNavigate} copy={copy}>
      <form
        className="auth-form signup-form"
        onSubmit={async (event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          const data = Object.fromEntries(formData.entries())
          
          if (data.password !== data.confirm_password) {
            alert('Las contraseñas no coinciden')
            return
          }

          try {
            const responseData = await signup({
              full_name: data.full_name,
              email: data.email,
              password: data.password,
              company: { name: data.company_name },
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
        <div className="field-grid">
          <label className="field">
            <span>{copy.auth.fullName}</span>
            <input type="text" name="full_name" placeholder={copy.auth.fullNamePlaceholder} required />
          </label>
          <label className="field">
            <span>{copy.auth.email}</span>
            <input type="email" name="email" placeholder={copy.auth.emailPlaceholderSignup} required />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>{copy.auth.password}</span>
            <input type="password" name="password" placeholder={copy.auth.passwordPlaceholderMin} required />
          </label>
          <label className="field">
            <span>{copy.auth.confirmPassword}</span>
            <input
              type="password"
              name="confirm_password"
              placeholder={copy.auth.confirmPasswordPlaceholder}
              required
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>{copy.auth.company}</span>
            <input type="text" name="company_name" placeholder={copy.auth.companyPlaceholder} required />
          </label>
        </div>

        <button type="submit" className="submit-button">
          {copy.common.createAccount}
        </button>
      </form>
    </AuthLayout>
  )
}

export default SignupPage
