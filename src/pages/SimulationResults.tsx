import { useEffect, useState } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'
import UserPersonaCard from '../components/UserPersonaCard'
import {
  getProject,
  getProjectModels,
  getProjectSimulations,
} from '../services/api'
import { mapTargetModelToUserPersona, type TargetModelApi } from '../utils/userPersonaMapper'
import type { SimulationResultsData, AgentFeedback, AgentFeedbackDetails } from '../types/simulationResults'

type SimulationResultsProps = {
  projectId: string
  simulationId: string
  copy: Copy
  onNavigate: (path: RoutePath) => void
}

function AgentCard({ agent }: { agent: AgentFeedback }) {
  const isObj = typeof agent.Feedback === 'object' && agent.Feedback !== null
  const feedback = isObj ? agent.Feedback as AgentFeedbackDetails : null
  
  if (!feedback) {
     return (
       <article className="project-panel" style={{ padding: '24px', marginBottom: '16px' }}>
         <h3 style={{ marginBottom: '12px' }}>{agent.User}</h3>
         <p style={{ color: 'var(--text-muted)' }}>
            {typeof agent.Feedback === 'string' ? agent.Feedback : JSON.stringify(agent.Feedback)}
         </p>
       </article>
     )
  }

  // Visual cues based on purchase interest
  let intentColor = 'var(--text-muted)'
  let intentBg = 'var(--surface-sunken)'
  const rawIntent = (feedback.purchase_interest || '').toLowerCase()
  if (rawIntent.includes('high') || rawIntent.includes('alta')) {
    intentColor = '#047857' // Green
    intentBg = '#D1FAE5'
  } else if (rawIntent.includes('low') || rawIntent.includes('baja')) {
    intentColor = '#BE123C' // Red
    intentBg = '#FFE4E6'
  } else if (rawIntent.includes('medium') || rawIntent.includes('media')) {
    intentColor = '#B45309' // Orange
    intentBg = '#FEF3C7'
  }

  return (
    <article className="project-panel" style={{ 
      padding: '32px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
      borderLeft: `4px solid ${intentColor !== 'var(--text-muted)' ? intentColor : 'var(--primary)'}`
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ 
             width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #1E3A8A 100%)', 
             display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem',
             boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
           }}>
             {agent.User.slice(0, 1).toUpperCase()}
           </div>
           <div>
             <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{agent.User}</h3>
             <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Agente Simulado IA</span>
           </div>
        </div>
        <div style={{ 
          padding: '8px 16px', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 600,
          background: intentBg, color: intentColor, border: `1px solid ${intentColor}40`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          Intención de Compra: {feedback.purchase_interest || 'No detectada'}
        </div>
      </header>

      <div style={{ 
        padding: '24px', background: 'var(--surface-sunken)', borderRadius: '12px', 
        fontStyle: 'italic', fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text)',
        position: 'relative'
      }}>
        <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '2rem', opacity: 0.1, pointerEvents: 'none' }}>"</span>
        {feedback.comprehension?.interpretation || feedback.comprehension?.level || 'Sin opinión narrativa registrada.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Percepción de Precio</strong>
          <span style={{ fontWeight: 500 }}>{feedback.price_perception || '-'}</span>
        </div>
        <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Punto Destacado</strong>
          <span style={{ fontWeight: 500 }}>{feedback.standout_feature || '-'}</span>
        </div>
        <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Punto Rechazado</strong>
          <span style={{ fontWeight: 500 }}>{feedback.rejected_feature || '-'}</span>
        </div>
        <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Recomendación</strong>
          <span style={{ fontWeight: 500 }}>{feedback.recommendation_probability || '-'}</span>
        </div>
      </div>
    </article>
  )
}

function SimulationResults({ projectId, simulationId, copy, onNavigate }: SimulationResultsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [resultsData, setResultsData] = useState<SimulationResultsData | null>(null)
  const [personas, setPersonas] = useState<any[]>([])
  const [hasEmptySummary, setHasEmptySummary] = useState(false)

  const loadResults = async () => {
    try {
      const [projectData, simulationsData, modelsData] = await Promise.all([
        getProject(projectId),
        getProjectSimulations(projectId),
        getProjectModels(projectId)
      ])

      const simulation = simulationsData.find((item: any) => item.id === simulationId)

      if (!projectData || !simulation) {
        setResultsData(null)
        setPersonas([])
        return
      }

      setPersonas(
        (modelsData as TargetModelApi[]).map((model) => mapTargetModelToUserPersona(model, copy)),
      )
      
      const summaryIsEmpty = !simulation.summary || (Array.isArray(simulation.summary) && simulation.summary.length === 0)
      setHasEmptySummary(summaryIsEmpty)
      
      if (summaryIsEmpty) {
        setResultsData({
          productDescription: projectData.context?.description || '',
        })
      } else {
        if (Array.isArray(simulation.summary)) {
          setResultsData({
            productDescription: projectData.context?.description || '',
            agentFeedbacks: simulation.summary
          })
        } else {
          setResultsData({
            productDescription: projectData.context?.description || '',
            rawText: typeof simulation.summary === 'string' ? simulation.summary : JSON.stringify(simulation.summary, null, 2)
          })
        }
      }

    } catch (error) {
      console.error(error)
      setResultsData(null)
      setPersonas([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadResults()
  }, [projectId, simulationId, copy]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadResults()
  }

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

      <section className="project-shell">
        <article className="project-panel summary-panel">
          <div className="project-new-simulation-heading">
            <p className="panel-kicker">{copy.results.insightsTitle}</p>
            <h2>Desglose de Resultados Individuales</h2>
          </div>
          <div className="summary-overview">
            <p className="panel-kicker">{copy.results.productDescription}</p>
            <h3>{resultsData.productDescription || '—'}</h3>
          </div>
          
          {hasEmptySummary ? (
            <div className="summary-sections">
              <article className="summary-section-card">
                <div className="summary-content">
                  <p className="summary-p">La simulación está analizando los datos...</p>
                  <button
                    type="button"
                    className="primary-cta"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 'Actualizando...' : 'Refrescar Progreso'}
                  </button>
                </div>
              </article>
            </div>
          ) : resultsData.agentFeedbacks ? (
            <div className="summary-sections" style={{ marginTop: '40px' }}>
              {resultsData.agentFeedbacks.map((agent: AgentFeedback, index: number) => (
                <AgentCard key={`${agent.User}-${index}`} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="summary-sections">
              <article className="summary-section-card">
                <div className="summary-content">
                  <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--surface-sunken)', padding: '16px', borderRadius: '12px' }}>
                    {resultsData.rawText}
                  </pre>
                </div>
              </article>
            </div>
          )}
        </article>

        {personas.length > 0 && (
          <article className="project-panel personas-panel">
            <div className="project-new-simulation-heading">
              <p className="panel-kicker">{copy.results.personasTitle}</p>
              <h2>Contexto de los Participantes</h2>
            </div>
            <div className="user-persona-list">
              {personas.map((persona) => (
                <UserPersonaCard key={persona.id} persona={persona} copy={copy} hideActions />
              ))}
            </div>
          </article>
        )}
      </section>
    </section>
  )
}

export default SimulationResults
