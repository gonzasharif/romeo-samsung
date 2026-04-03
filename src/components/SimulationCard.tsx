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
  onClick?: (simulationId: string) => void
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

function extractNameFromSummary(summary: unknown): string {
  if (!summary) return ''
  
  try {
    if (typeof summary === 'string') {
      const parsed = JSON.parse(summary)
      if (parsed && typeof parsed === 'object' && 'name' in parsed) {
        return String(parsed.name)
      }
    } else if (typeof summary === 'object' && summary !== null && 'name' in summary) {
      return String((summary as Record<string, any>).name)
    }
  } catch {
    // Not JSON, return empty
  }
  
  return ''
}

function SimulationCard({ simulation, copy, locale, onClick }: SimulationCardProps) {
  const isClickable = typeof onClick === 'function'

  return (
    <article
      className={isClickable ? 'simulation-card is-clickable' : 'simulation-card'}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onClick(simulation.id) : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onClick(simulation.id)
            }
          }
          : undefined
      }
    >
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
        {extractNameFromSummary(simulation.summary) || copy.project.simulationNoSummary}
      </p>
    </article>
  )
}

export default SimulationCard
