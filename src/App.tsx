import './App.css'

const signals = [
  {
    title: 'Demanda real antes de invertir',
    description:
      'Probá pricing, propuesta de valor y objeciones con agentes que reaccionan como clientes de distintos perfiles.',
  },
  {
    title: 'Insights accionables en minutos',
    description:
      'Detectá qué genera interés, qué confunde y qué frena la compra sin esperar semanas de investigación.',
  },
  {
    title: 'Decisiones con menos intuición ciega',
    description:
      'Convertí una idea en evidencia: segmentos, gatillos de compra, objeciones y señales de tracción.',
  },
]

const personas = [
  { name: 'Luz, founder bootstrap', mood: 'Necesita validar rápido sin quemar caja' },
  { name: 'Marco, buyer escéptico', mood: 'Quiere pruebas concretas y compara alternativas' },
  { name: 'Sofía, early adopter', mood: 'Se entusiasma si el problema duele de verdad' },
]

const steps = [
  'Describís tu idea, público objetivo y precio tentativo.',
  'Lanzamos varios agentes de IA con perfiles de clientes y moderación automática.',
  'Recibís un focus group simulado con señales de demanda, objeciones y próximos pasos.',
]

function App() {
  return (
    <main className="landing-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            Validá demanda con agentes de IA antes de construir
          </div>
          <h1>
            Descubrí si tu idea de negocio
            <span> despierta ganas reales de compra</span>
          </h1>
          <p className="hero-text">
            Simulamos un focus group con agentes de IA que representan distintos
            perfiles de cliente. Vos traés la idea; la plataforma devuelve
            interés percibido, objeciones, intención de pago y oportunidades de
            mejora.
          </p>
          <div className="hero-actions">
            <a href="#cta" className="primary-cta">
              Quiero validar mi idea
            </a>
            <a href="#como-funciona" className="secondary-cta">
              Ver cómo funciona
            </a>
          </div>
          <div className="hero-proof">
            <span>Focus group simulado</span>
            <span>Segmentación automática</span>
            <span>Señales de demanda</span>
          </div>
        </div>

        <div className="hero-panel" aria-label="Vista previa del focus group IA">
          <div className="orb orb-one" />
          <div className="orb orb-two" />

          <div className="panel-header">
            <div>
              <p className="panel-kicker">Sesión en vivo</p>
              <h2>Focus group IA para una app de viandas saludables</h2>
            </div>
            <div className="score-pill">
              <strong>73%</strong>
              <span>señal de demanda</span>
            </div>
          </div>

          <div className="persona-grid">
            {personas.map((persona) => (
              <article key={persona.name} className="persona-card">
                <span className="persona-dot" />
                <h3>{persona.name}</h3>
                <p>{persona.mood}</p>
              </article>
            ))}
          </div>

          <div className="insight-card">
            <p className="insight-label">Hallazgo principal</p>
            <p className="insight-text">
              El problema interesa mucho en profesionales con poco tiempo, pero
              el precio mensual necesita una propuesta más clara de ahorro y
              conveniencia.
            </p>
          </div>

          <div className="signal-bars" aria-hidden="true">
            <div>
              <span>Interés</span>
              <i style={{ width: '84%' }} />
            </div>
            <div>
              <span>Intención de pago</span>
              <i style={{ width: '66%' }} />
            </div>
            <div>
              <span>Claridad de propuesta</span>
              <i style={{ width: '58%' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="signal-section">
        {signals.map((signal) => (
          <article key={signal.title} className="signal-card">
            <p className="card-index">0{signals.indexOf(signal) + 1}</p>
            <h3>{signal.title}</h3>
            <p>{signal.description}</p>
          </article>
        ))}
      </section>

      <section id="como-funciona" className="workflow-section">
        <div className="section-heading">
          <p className="section-tag">Cómo funciona</p>
          <h2>Una landing pensada para que el valor se entienda en 20 segundos</h2>
        </div>

        <div className="workflow-grid">
          {steps.map((step, index) => (
            <article key={step} className="workflow-card">
              <span className="workflow-step">Paso {index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="cta" className="cta-section">
        <div>
          <p className="section-tag">Listo para probar</p>
          <h2>No adivines el mercado. Hacelo hablar.</h2>
          <p>
            Mostrale a potenciales clientes simulados tu propuesta y obtené una
            lectura clara de demanda antes de invertir tiempo y plata.
          </p>
        </div>
        <a href="/" className="primary-cta cta-inline">
          Empezar validación
        </a>
      </section>
    </main>
  )
}

export default App
