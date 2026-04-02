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
import type { SimulationResultsData, SimulationResultsSection } from '../types/simulationResults'

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

const KEY_LABELS: Record<string, string> = {
  pricePerception: "Percepción de Precio",
  purchaseIntent: "Intención de Compra",
  demandSignal: "Señal de Demanda",
  messageClarity: "Claridad del Mensaje",
  insights: "Desglose Cualitativo"
}

function normalizeSummaryText(summary: unknown): string {
  if (typeof summary === 'string') {
    try {
      const parsed = JSON.parse(summary)
      if (parsed && typeof parsed === 'object') {
        return normalizeSummaryText(parsed)
      }
    } catch {
      // Not JSON, just regular Markdown/Text summary.
    }
    return summary
  }

  if (Array.isArray(summary)) {
    return summary.map((item) => normalizeSummaryText(item)).join('\n\n---\n\n')
  }

  if (summary && typeof summary === 'object') {
    return Object.entries(summary)
      .map(([key, value]) => {
        const label = KEY_LABELS[key] || key

        if (Array.isArray(value)) {
          const listText = value.map(v => `- ${normalizeSummaryText(v)}`).join('\n')
          return `### ${label}\n${listText}`
        }

        let formattedValue = normalizeSummaryText(value)
        if (typeof value === 'number' && ['pricePerception', 'purchaseIntent', 'demandSignal', 'messageClarity'].includes(key)) {
           if (value <= 1.5) formattedValue = "Bajo (1/3)"
           else if (value <= 2.5) formattedValue = "Medio (2/3)"
           else formattedValue = "Alto (3/3)"
        }
        
        return `### ${label}\n${formattedValue}`
      })
      .join('\n\n')
  }

  return String(summary || '')
}

function buildSummarySections(summaryText: string): SimulationResultsSection[] {
  const lines = summaryText.split('\n')
  const sections: SimulationResultsSection[] = []
  let currentTitle: string | null = null
  let currentContent: string[] = []

  const flushSection = () => {
    const content = currentContent.join('\n').trim()
    if (!currentTitle && !content) return
    sections.push({
      title: currentTitle,
      content,
    })
    currentTitle = null
    currentContent = []
  }

  lines.forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('### ') || trimmedLine.startsWith('## ') || trimmedLine.startsWith('# ')) {
      flushSection()
      currentTitle = trimmedLine.replace(/^#{1,3}\s+/, '')
      return
    }

    currentContent.push(line)
  })

  flushSection()

  if (sections.length === 0 && summaryText.trim()) {
    return [{ title: null, content: summaryText.trim() }]
  }

  return sections
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
      const normalizedSummary = normalizeSummaryText(simulation.summary)
      const summaryIsEmpty = !normalizedSummary || !normalizedSummary.trim()
      
      setHasEmptySummary(summaryIsEmpty)
      
      if (summaryIsEmpty) {
        setResultsData({
          productDescription: projectData.context?.product_description || '',
          summaryText: '',
          sections: [],
        })
      } else {
        setResultsData({
          productDescription: projectData.context?.product_description || '',
          summaryText: normalizedSummary,
          sections: buildSummarySections(normalizedSummary),
        })
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
  }, [projectId, simulationId, copy])

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
            <h2>{copy.results.title}</h2>
          </div>
          <div className="summary-overview">
            <p className="panel-kicker">{copy.results.productDescription}</p>
            <h3>{resultsData.productDescription || '—'}</h3>
          </div>
          
          {hasEmptySummary ? (
            <div className="summary-sections">
              <article className="summary-section-card">
                <div className="summary-content">
                  <p className="summary-p">Gathering data...</p>
                  <button
                    type="button"
                    className="primary-cta"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh Results'}
                  </button>
                </div>
              </article>
            </div>
          ) : (
            <div className="summary-sections">
              {resultsData.sections.map((section: any, index: number) => (
                <article key={`${section.title || 'section'}-${index}`} className="summary-section-card">
                  {section.title ? <h3 className="summary-section-title">{section.title}</h3> : null}
                  <div className="summary-content">
                    {parseMarkdownToElements(section.content)}
                  </div>
                </article>
              ))}
            </div>
          )}
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
