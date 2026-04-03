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

function AnalyticsDashboard({ personas, agentFeedbacks }: { personas: any[], agentFeedbacks: AgentFeedback[] }) {
  // Calcular edad promedio iterando los perfiles de agentes
  let totalAge = 0
  let countAge = 0
  personas.forEach(p => {
    const a = parseInt(String(p.age).replace(/\D/g, ''), 10)
    if (!isNaN(a)) {
      totalAge += a
      countAge++
    }
  })
  const avgAge = countAge > 0 ? Math.round(totalAge / countAge) : '?'

  // Contar frecuencias de intención
  const intents = { high: 0, medium: 0, low: 0, neutral: 0 }
  const totalIntents = agentFeedbacks.length || 1
  
  agentFeedbacks.forEach(agent => {
    const isObj = typeof agent.Feedback === 'object' && agent.Feedback !== null
    const feedback = isObj ? agent.Feedback as AgentFeedbackDetails : null
    const rawIntent = (feedback?.purchase_interest || '').toLowerCase()
    
    if (rawIntent.includes('high') || rawIntent.includes('alta') || rawIntent.includes('muy alta')) intents.high++
    else if (rawIntent.includes('low') || rawIntent.includes('baja') || rawIntent.includes('muy baja')) intents.low++
    else if (rawIntent.includes('medium') || rawIntent.includes('media')) intents.medium++
    else intents.neutral++
  })

  // Estilos de píldoras dinámicas
  return (
    <article className="project-panel" style={{ padding: '32px', marginBottom: '32px', background: 'var(--surface-raised)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', letterSpacing: '-0.02em' }}>Resumen Analítico</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
        
        {/* Progress Bar de Intención de Compra */}
        <div style={{ paddingRight: '20px', borderRight: '1px solid var(--border)' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontWeight: 600 }}>Distribución de Intención de Compra</p>
           
           <div style={{ display: 'flex', height: '28px', width: '100%', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px', background: 'var(--surface-sunken)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: `${(intents.high / totalIntents) * 100}%`, background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} title={`Alta: ${intents.high}`} />
              <div style={{ width: `${(intents.medium / totalIntents) * 100}%`, background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} title={`Media: ${intents.medium}`} />
              <div style={{ width: `${(intents.low / totalIntents) * 100}%`, background: 'linear-gradient(90deg, #E11D48 0%, #EF4444 100%)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} title={`Baja: ${intents.low}`} />
              <div style={{ width: `${(intents.neutral / totalIntents) * 100}%`, background: 'linear-gradient(90deg, #4B5563 0%, #6B7280 100%)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} title={`Neutral: ${intents.neutral}`} />
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, padding: '0 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <span style={{ color: '#10B981', fontSize: '1.25rem' }}>{Math.round(intents.high/totalIntents*100)}%</span>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>Alta</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <span style={{ color: '#F59E0B', fontSize: '1.25rem' }}>{Math.round(intents.medium/totalIntents*100)}%</span>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>Media</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <span style={{ color: '#EF4444', fontSize: '1.25rem' }}>{Math.round(intents.low/totalIntents*100)}%</span>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>Baja</span>
              </div>
           </div>
        </div>

        {/* Métrica Global de Edad Promedio */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Edad Promedio de Audiencia Testeada</p>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
             <span style={{ fontSize: '4.5rem', fontWeight: '800', color: 'var(--primary)', lineHeight: '1', letterSpacing: '-0.03em' }}>
               {avgAge}
             </span>
             <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>años</span>
           </div>
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
              <AnalyticsDashboard personas={personas} agentFeedbacks={resultsData.agentFeedbacks} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {resultsData.agentFeedbacks.map((agent: AgentFeedback, index: number) => (
                  <AgentCard key={`${agent.User}-${index}`} agent={agent} />
                ))}
              </div>
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
