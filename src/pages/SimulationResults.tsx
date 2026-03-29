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
import type { SimulationResultsData } from '../types/simulationResults'
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
  const [resultsData, setResultsData] = useState<SimulationResultsData | null>(null)
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
        const simulation = simulationsData.find((item: any) => item.id === simulationId)

        if (!projectData || !simulation) {
          setResultsData(null)
          setPersonas([])
          return
        }

        setPersonas(
          (modelsData as TargetModelApi[]).map((model) => mapTargetModelToUserPersona(model, copy)),
        )
        setResultsData({
          productDescription: projectData.context?.product_description || '',
          pricePerception:
            typeof statsData?.willingness_to_pay_score === 'number'
              ? statsData.willingness_to_pay_score
              : null,
          purchaseIntent:
            typeof statsData?.willingness_to_pay_score === 'number'
              ? statsData.willingness_to_pay_score
              : null,
          demandSignal:
            typeof statsData?.demand_score === 'number' ? statsData.demand_score : null,
          messageClarity:
            typeof statsData?.clarity_score === 'number' ? statsData.clarity_score : null,
          insights: [
            simulation.summary || copy.results.noInsights,
            simulation.summary || copy.results.noInsights,
            simulation.summary || copy.results.noInsights,
          ],
        })

      } catch (error) {
        console.error(error)
        if (!isMounted) return
        setResultsData(null)
        setPersonas([])
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

  if (!resultsData) {
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
          <h2>{resultsData.productDescription || '—'}</h2>
        </article>

        <article className="project-panel results-panel">
          <p className="panel-kicker">{copy.results.metricsTitle}</p>
          <div className="results-metrics-grid">
            <div className="results-metric-card">
              <span>{copy.results.demandScore}</span>
              <strong>{typeof resultsData.demandSignal === 'number' ? `${Math.round(resultsData.demandSignal)}%` : '—'}</strong>
            </div>
            <div className="results-metric-card">
              <span>{copy.results.purchaseIntent}</span>
              <strong>{typeof resultsData.purchaseIntent === 'number' ? `${Math.round(resultsData.purchaseIntent)}%` : '—'}</strong>
            </div>
            <div className="results-metric-card">
              <span>{copy.results.priceAcceptance}</span>
              <strong>{typeof resultsData.pricePerception === 'number' ? `${Math.round(resultsData.pricePerception)}%` : '—'}</strong>
            </div>
            <div className="results-metric-card">
              <span>{copy.results.messageClarity}</span>
              <strong>{typeof resultsData.messageClarity === 'number' ? `${Math.round(resultsData.messageClarity)}%` : '—'}</strong>
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
            <MetricBar label={copy.results.demandScore} value={resultsData.demandSignal} />
            <MetricBar label={copy.results.purchaseIntent} value={resultsData.purchaseIntent} />
            <MetricBar label={copy.results.priceAcceptance} value={resultsData.pricePerception} />
            <MetricBar label={copy.results.messageClarity} value={resultsData.messageClarity} />
          </div>
        </article>

        <article className="project-panel results-panel">
          <div className="project-new-simulation-heading">
            <p className="panel-kicker">{copy.results.insightsTitle}</p>
            <h2>{copy.results.insightsTitle}</h2>
          </div>
          <div className="results-insights">
            {resultsData.insights.map((insight, index) => (
              <div key={`${index}-${insight}`} className="results-insight-card">
                {insight}
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  )
}

export default SimulationResults
