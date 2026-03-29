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

type SimulationResultsProps = {
  projectId: string
  simulationId: string
  copy: Copy
  onNavigate: (path: RoutePath) => void
}

function parseInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="summary-strong">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="summary-em">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="summary-code">{part.slice(1, -1)}</code>
    }
    return <span key={i}>{part}</span>
  })
}

function parseMarkdownToElements(text: string) {
  if (!text) return null
  const blocks = text.split('\n\n').filter(b => b.trim())
  
  return blocks.map((block, i) => {
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
      return (
        <ul key={i} className="summary-list">
          {items.map((item, j) => {
            const content = item.replace(/^[-*]\s+/, '')
            return <li key={j}>{parseInline(content)}</li>
          })}
        </ul>
      )
    }
    
    if (block.startsWith('### ')) return <h4 key={i} className="summary-h4">{parseInline(block.slice(4))}</h4>
    if (block.startsWith('## ')) return <h3 key={i} className="summary-h3">{parseInline(block.slice(3))}</h3>
    if (block.startsWith('# ')) return <h2 key={i} className="summary-h2">{parseInline(block.slice(2))}</h2>
    
    return <p key={i} className="summary-p">{parseInline(block)}</p>
  })
}

function SimulationResults({ projectId, simulationId, copy, onNavigate }: SimulationResultsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [resultsData, setResultsData] = useState<any>(null)
  const [personas, setPersonas] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    const loadResults = async () => {
      try {
        const [projectData, simulationsData, modelsData] = await Promise.all([
          getProject(projectId),
          getProjectSimulations(projectId),
          getProjectModels(projectId)
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
          summary: simulation.summary || copy.results.noInsights
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

      <section className="project-shell">
        <article className="project-panel summary-panel">
          <div className="project-new-simulation-heading">
            <p className="panel-kicker">{copy.results.insightsTitle}</p>
            <h2>Analysis Summary</h2>
          </div>
          <div className="summary-content">
            {parseMarkdownToElements(resultsData.summary)}
          </div>
        </article>

        {personas.length > 0 && (
          <article className="project-panel personas-panel">
            <div className="project-new-simulation-heading">
              <p className="panel-kicker">{copy.results.personasTitle}</p>
              <h2>Participants Context</h2>
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
