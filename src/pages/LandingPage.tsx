import type { MouseEvent, ReactNode } from 'react'
import type { Copy } from '../i18n'

type RoutePath = '/' | '/login' | '/signup'

type LandingPageProps = {
  onNavigate: (path: RoutePath) => void
  copy: Copy
  topControls: ReactNode
}

function LandingPage({ onNavigate, copy, topControls }: LandingPageProps) {
  const handleRouteClick =
    (path: RoutePath) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      onNavigate(path)
    }

  return (
    <>
      <header className="topbar">
        <div className="topbar-actions">
          {topControls}
          <div className="auth-actions">
          <a href="/login" className="login-link" onClick={handleRouteClick('/login')}>
            {copy.common.login}
          </a>
          <a href="/signup" className="signup-link" onClick={handleRouteClick('/signup')}>
            {copy.common.signup}
          </a>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">{copy.landing.eyebrow}</div>
          <h1>
            {copy.landing.title}
            <span> {copy.landing.titleAccent}</span>
          </h1>
          <p className="hero-text">{copy.landing.description}</p>
          <div className="hero-actions">
            <a href="/signup" className="primary-cta" onClick={handleRouteClick('/signup')}>
              {copy.landing.primaryCta}
            </a>
            <a href="#como-funciona" className="secondary-cta">
              {copy.landing.secondaryCta}
            </a>
          </div>
          <div className="hero-proof">
            {copy.landing.proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="hero-panel" aria-label={copy.landing.heroPanelAria}>
          <div className="orb orb-one" />
          <div className="orb orb-two" />

          <div className="panel-header">
            <div>
              <p className="panel-kicker">{copy.landing.sessionLive}</p>
              <h2>{copy.landing.heroPanelTitle}</h2>
            </div>
            <div className="score-pill">
              <strong>73%</strong>
              <span>{copy.landing.demandSignal}</span>
            </div>
          </div>

          <div className="persona-grid">
            {copy.landing.personas.map((persona) => (
              <article key={persona.name} className="persona-card">
                <span className="persona-dot" />
                <h3>{persona.name}</h3>
                <p>{persona.mood}</p>
              </article>
            ))}
          </div>

          <div className="insight-card">
            <p className="insight-label">{copy.landing.insightLabel}</p>
            <p className="insight-text">{copy.landing.insightText}</p>
          </div>

          <div className="signal-bars" aria-hidden="true">
            {copy.landing.bars.map((bar) => (
              <div key={bar.label}>
                <span>{bar.label}</span>
                <i style={{ width: bar.width }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="signal-section">
        {copy.landing.signals.map((signal, index) => (
          <article key={signal.title} className="signal-card">
            <p className="card-index">0{index + 1}</p>
            <h3>{signal.title}</h3>
            <p>{signal.description}</p>
          </article>
        ))}
      </section>

      <section id="como-funciona" className="workflow-section">
        <div className="section-heading">
          <p className="section-tag">{copy.landing.howItWorksTag}</p>
          <h2>{copy.landing.howItWorksTitle}</h2>
        </div>

        <div className="workflow-grid">
          {copy.landing.steps.map((step, index) => (
            <article key={step} className="workflow-card">
              <span className="workflow-step">
                {copy.landing.stepLabel} {index + 1}
              </span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="cta" className="cta-section">
        <div>
          <p className="section-tag">{copy.landing.readyTag}</p>
          <h2>{copy.landing.readyTitle}</h2>
          <p>{copy.landing.readyDescription}</p>
        </div>
        <a href="/signup" className="primary-cta cta-inline" onClick={handleRouteClick('/signup')}>
          {copy.landing.readyCta}
        </a>
      </section>
    </>
  )
}

export default LandingPage
