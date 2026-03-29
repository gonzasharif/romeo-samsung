import { useEffect, useState } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'
import UserPersonaCard from '../components/UserPersonaCard'
import {
  getProject,
  getProjectModels,
  getProjectSimulations,
  getProjectStats,
} from '../services/api'
import { mapTargetModelToUserPersona, type TargetModelApi } from '../utils/userPersonaMapper'

type SimulationResultsProps = {
  projectId: string
  simulationId: string
  copy: Copy
  onNavigate: (path: RoutePath) => void
}

function MetricBar({
  label,
  value,
}: {
  label: string
  value: number | null | undefined
}) {
  const normalizedValue = typeof value === 'number' ? value : 0

  return (
    <div className="results-metric-bar">
      <div className="results-metric-bar-top">
        <span>{label}</span>
        <strong>{typeof value === 'number' ? `${value}%` : '—'}</strong>
      </div>
      <div className="results-metric-track">
        <i style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  )
}

function SimulationResults({ projectId, simulationId, copy, onNavigate }: SimulationResultsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [simulation, setSimulation] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [personas, setPersonas] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    const loadResults = async () => {
      try {
        const [projectData, simulationsData, modelsData, statsData] = await Promise.all([
          getProject(projectId),
          getProjectSimulations(projectId),
          getProjectModels(projectId),
          getProjectStats(projectId),
        ])

        if (!isMounted) return

        setProject(projectData)
        setSimulation(simulationsData.find((item: any) => item.id === simulationId) || null)
        setPersonas(
          (modelsData as TargetModelApi[]).map((model) => mapTargetModelToUserPersona(model, copy)),
        )
        setStats(statsData)
      } catch (error) {
        console.error(error)
        if (!isMounted) return
        setProject(null)
        setSimulation(null)
        setPersonas([])
        setStats(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadResults()

    return () => {
      isMounted = false
    }
  }, [projectId, simulationId, copy])

  if (isLoading) {
    return (
      <section className="results-shell">
        <header className="project-topbar">
          <p>{copy.results.loading}</p>
        </header>
      </section>
    )
  }

  if (!simulation || !project) {
    return (
      <section className="results-shell">
        <header className="project-topbar">
          <div>
            <p className="section-tag">{copy.results.tag}</p>
            <h1 className="project-title">{copy.results.title}</h1>
          </div>
          <div className="project-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate(`/project/${projectId}`)}
            >
              {copy.results.backToProject}
            </button>
          </div>
        </header>

        <section className="project-panel empty-projects">
          <h3>{copy.results.noResult}</h3>
          <button
            type="button"
            className="primary-cta"
            onClick={() => onNavigate(`/project/${projectId}`)}
          >
            {copy.results.reloadProject}
          </button>
        </section>
      </section>
    )
  }

  return (
    <section className="results-shell">
      <header className="project-topbar">
        <div>
          <p className="section-tag">{copy.results.tag}</p>
          <h1 className="project-title">{copy.results.title}</h1>
        </div>
        <div className="project-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate(`/project/${projectId}`)}
          >
            {copy.results.backToProject}
          </button>
        </div>
      </header>

      <section className="results-grid">
        <article className="project-panel results-panel">
          <p className="panel-kicker">{copy.results.productDescription}</p>
          <h2>{project.context?.product_description || '—'}</h2>
        </article>

        <article className="project-panel results-panel">
          <p className="panel-kicker">{copy.results.metricsTitle}</p>
          <div className="results-metrics-grid">
            <div className="results-metric-card">
              <span>{copy.results.demandScore}</span>
              <strong>
                {typeof stats?.demand_score === 'number' ? `${Math.round(stats.demand_score)}%` : '—'}
              </strong>
            </div>
            <div className="results-metric-card">
              <span>{copy.results.purchaseIntent}</span>
              <strong>
                {typeof stats?.willingness_to_pay_score === 'number'
                  ? `${Math.round(stats.willingness_to_pay_score)}%`
                  : '—'}
              </strong>
            </div>
            <div className="results-metric-card">
              <span>{copy.results.priceAcceptance}</span>
              <strong>
                {typeof stats?.willingness_to_pay_score === 'number'
                  ? `${Math.round(stats.willingness_to_pay_score)}%`
                  : '—'}
              </strong>
            </div>
            <div className="results-metric-card">
              <span>{copy.results.messageClarity}</span>
              <strong>
                {typeof stats?.clarity_score === 'number' ? `${Math.round(stats.clarity_score)}%` : '—'}
              </strong>
            </div>
          </div>
        </article>

        <article className="project-panel results-panel results-panel-wide">
          <div className="project-new-simulation-heading">
            <p className="panel-kicker">{copy.results.personasTitle}</p>
            <h2>{copy.results.personasTitle}</h2>
          </div>
          <div className="user-persona-list">
            {personas.map((persona) => (
              <UserPersonaCard key={persona.id} persona={persona} copy={copy} hideActions />
            ))}
          </div>
        </article>

        <article className="project-panel results-panel">
          <div className="project-new-simulation-heading">
            <p className="panel-kicker">{copy.results.chartsTitle}</p>
            <h2>{copy.results.chartsTitle}</h2>
          </div>
          <div className="results-bars">
            <MetricBar label={copy.results.demandScore} value={stats?.demand_score} />
            <MetricBar
              label={copy.results.purchaseIntent}
              value={stats?.willingness_to_pay_score}
            />
            <MetricBar
              label={copy.results.priceAcceptance}
              value={stats?.willingness_to_pay_score}
            />
            <MetricBar label={copy.results.messageClarity} value={stats?.clarity_score} />
          </div>
        </article>

        <article className="project-panel results-panel">
          <div className="project-new-simulation-heading">
            <p className="panel-kicker">{copy.results.insightsTitle}</p>
            <h2>{copy.results.insightsTitle}</h2>
          </div>
          <div className="results-insights">
            {simulation.summary ? (
              <div className="results-insight-card">{simulation.summary}</div>
            ) : (
              <div className="results-insight-card">{copy.results.noInsights}</div>
            )}
          </div>
        </article>
      </section>
    </section>
  )
}

export default SimulationResults
