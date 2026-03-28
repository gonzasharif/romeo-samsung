import AuthLayout from './AuthLayout'

type SignupPageProps = {
  onNavigate: (path: '/' | '/login' | '/signup') => void
}

function SignupPage({ onNavigate }: SignupPageProps) {
  return (
    <AuthLayout mode="signup" onNavigate={onNavigate}>
      <form className="auth-form signup-form" onSubmit={(event) => event.preventDefault()}>
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
            <span>Empresa</span>
            <input type="text" name="company_name" placeholder="Ada Labs" required />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Industria</span>
            <input type="text" name="industry" placeholder="SaaS, e-commerce, salud..." required />
          </label>
          <label className="field">
            <span>Website</span>
            <input type="url" name="website" placeholder="https://tuempresa.com" />
          </label>
        </div>

        <label className="field">
          <span>Descripción de la empresa</span>
          <textarea
            name="company_description"
            rows={4}
            placeholder="Qué hace la empresa, qué vende y qué tipo de cliente busca validar."
            required
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Contacto de facturación</span>
            <input type="text" name="billing_contact" placeholder="Nombre del responsable" />
          </label>
          <label className="field">
            <span>Email de facturación</span>
            <input type="email" name="billing_email" placeholder="billing@empresa.com" />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>CUIT / Tax ID</span>
            <input type="text" name="tax_id" placeholder="30-12345678-9" />
          </label>
          <label className="field">
            <span>Dirección fiscal</span>
            <input type="text" name="address" placeholder="Calle, altura, ciudad" />
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
