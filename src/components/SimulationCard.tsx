import type { Copy, Locale } from '../i18n'

type SimulationCardProps = {
  simulation: {
    id: string
    scenario_name: string
    provider: string
    status: number
    started_at?: string
    summary?: string
  }
  copy: Copy
  locale: Locale
}

function formatDate(value: string | undefined, locale: Locale) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getStatusLabel(status: number, copy: Copy) {
  if (status === 0) return copy.project.simulationQueued
  if (status === 1) return copy.project.simulationRunning
  return copy.project.simulationCompleted
}

function SimulationCard({ simulation, copy, locale }: SimulationCardProps) {
  return (
    <article className="simulation-card">
      <div className="simulation-card-top">
        <div>
          <p className="simulation-card-label">{copy.project.simulationLabel}</p>
          <h3>{simulation.scenario_name}</h3>
        </div>
        <span className="simulation-status-pill">{getStatusLabel(simulation.status, copy)}</span>
      </div>

      <div className="simulation-card-meta">
        <span>{copy.project.simulationProvider(simulation.provider)}</span>
        <span>{formatDate(simulation.started_at, locale)}</span>
      </div>

      <p className="simulation-card-summary">
        {simulation.summary || copy.project.simulationNoSummary}
      </p>
    </article>
  )
}

export default SimulationCard
