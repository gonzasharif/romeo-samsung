import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'
import {
  getProject,
  updateProject,
  getProjectModels,
  getProjectAgents,
  createProjectModel,
  updateProjectModel,
  deleteProjectModel,
  createProjectAgent,
  updateProjectAgent,
  deleteProjectAgent
} from '../services/api'
import ModelModal from '../modals/ModelModal'
import AgentModal from '../modals/AgentModal'

type ProjectPageProps = {
  projectId: string
  onNavigate: (path: RoutePath) => void
  copy: Copy
  topControls: ReactNode
}

function ProjectPage({ projectId, onNavigate, copy }: ProjectPageProps) {
  const [project, setProject] = useState<any>(null)
  const [models, setModels] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  
  const [isEditingConfig, setIsEditingConfig] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  // Modals state
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<any>(null)

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [agentModelId, setAgentModelId] = useState<string>('')

  const loadData = async () => {
    try {
      const [projData, modelsData, agentsData] = await Promise.all([
        getProject(projectId),
        getProjectModels(projectId),
        getProjectAgents(projectId)
      ])
      setProject(projData)
      setEditForm({ name: projData.name, ...projData.context })
      setModels(modelsData)
      setAgents(agentsData)
    } catch (err: any) {
      console.error(err)
      onNavigate('/profile')
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const payload = {
        name: editForm.name,
        context: {
          company_summary: editForm.company_summary,
          product_name: editForm.name,
          product_description: editForm.product_description,
          target_audience: editForm.target_audience,
          pricing_notes: editForm.pricing_notes || '',
          market_context: editForm.market_context || '',
          category: editForm.category || ''
        }
      }
      const updated = await updateProject(projectId, payload)
      setProject(updated)
      setIsEditingConfig(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveModel = async (payload: any) => {
    try {
      if (selectedModel) {
        await updateProjectModel(projectId, selectedModel.id, payload)
      } else {
        await createProjectModel(projectId, payload)
      }
      loadData()
      setIsModelModalOpen(false)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteModel = async (id: string) => {
    if (!window.confirm(copy.project.deleteModelConfirm)) return
    try {
      await deleteProjectModel(projectId, id)
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleSaveAgent = async (payload: any) => {
    try {
      if (selectedAgent) {
        await updateProjectAgent(projectId, selectedAgent.id, payload)
      } else {
        await createProjectAgent(projectId, payload)
      }
      loadData()
      setIsAgentModalOpen(false)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!window.confirm(copy.project.deleteAgentConfirm)) return
    try {
      await deleteProjectAgent(projectId, id)
      loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (!project) {
    return (
      <section className="project-shell">
        <header className="project-topbar">
          <p>{copy.project.loadingProjectInfo}</p>
        </header>
      </section>
    )
  }

  return (
    <section className="project-shell">
      <header className="project-topbar">
        <div>
          <p className="section-tag">{copy.project.tag}</p>
          <h1 className="project-title">{project.name}</h1>
        </div>
        <div className="project-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate('/profile')}>
            {copy.project.backToProfile}
          </button>
        </div>
      </header>

      <div className="project-dashboard">
        {/* Context Panel */}
        <section className="project-panel" style={{ maxWidth: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>{copy.project.heading}</h2>
            <button 
              className={isEditingConfig ? 'primary-cta' : 'secondary-button'} 
              onClick={() => isEditingConfig ? handleSaveConfig() : setIsEditingConfig(true)}
              disabled={isSaving}
            >
                {isEditingConfig ? (isSaving ? copy.project.saving : copy.project.save) : copy.project.edit}
            </button>
          </div>
          
          {isEditingConfig ? (
              <div className="edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <label className="field">
                      <span>{copy.project.projectNameLabel}</span>
                      <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </label>
                  <label className="field">
                      <span>{copy.project.companySummaryLabel}</span>
                      <textarea rows={3} value={editForm.company_summary || ''} onChange={e => setEditForm({...editForm, company_summary: e.target.value})} />
                  </label>
                  <label className="field">
                      <span>{copy.project.productDescriptionLabel}</span>
                      <textarea rows={3} value={editForm.product_description || ''} onChange={e => setEditForm({...editForm, product_description: e.target.value})} />
                  </label>
                  <label className="field">
                      <span>{copy.project.targetAudienceLabel}</span>
                      <textarea rows={2} value={editForm.target_audience || ''} onChange={e => setEditForm({...editForm, target_audience: e.target.value})} />
                  </label>
              </div>
          ) : (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p><strong>{copy.project.companySummaryLabel}:</strong> {project.context?.company_summary}</p>
                  <p><strong>{copy.project.productDescriptionLabel}:</strong> {project.context?.product_description}</p>
                  <p><strong>{copy.project.targetAudienceLabel}:</strong> {project.context?.target_audience}</p>
              </div>
          )}
        </section>

        {/* Models & Agents Panel */}
        <section className="models-section">
          <div className="models-section-header">
            <div>
              <h2 style={{ margin: 0 }}>{copy.project.modelsTitle}</h2>
              <p style={{ color: 'var(--muted-strong)', marginTop: '0.4rem' }}>{copy.project.modelsDescription}</p>
            </div>
            <button 
              className="primary-cta" 
              onClick={() => {
                setSelectedModel(null)
                setIsModelModalOpen(true)
              }}
            >
              + {copy.project.addModel}
            </button>
          </div>

          {models.length === 0 ? (
            <div className="empty-projects" style={{ marginTop: '1rem', maxWidth: 'none', borderStyle: 'dashed' }}>
              <p>{copy.project.emptyModels}</p>
            </div>
          ) : (
            <div className="model-grid">
              {models.map(model => {
                const modelAgents = agents.filter(a => a.model_id === model.id)
                return (
                  <div key={model.id} className="model-card">
                    <div className="model-card-header">
                      <h3>{model.name}</h3>
                      <div className="model-actions">
                        <button className="icon-button" title={copy.project.editModel} onClick={() => {
                          setSelectedModel(model)
                          setIsModelModalOpen(true)
                        }}>✏️</button>
                        <button className="icon-button danger" title={copy.project.deleteModel} onClick={() => handleDeleteModel(model.id)}>🗑️</button>
                      </div>
                    </div>
                    <div className="model-card-info">
                      <span title={copy.project.modelAgeRangeLabel}>🎂 {model.age_range || '-'}</span>
                      <span title={copy.project.modelAttitudeLabel}>🎭 {model.attitude ?? '-'}</span>
                    </div>

                    <div className="agents-container">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-strong)' }}>
                          {copy.project.agentsTitle}
                        </span>
                        <button className="icon-button" style={{ padding: '0.2rem', fontSize: '0.8rem' }} onClick={() => {
                          setSelectedAgent(null)
                          setAgentModelId(model.id)
                          setIsAgentModalOpen(true)
                        }}>+ Add</button>
                      </div>
                      
                      {modelAgents.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text)', opacity: 0.6, margin: 0 }}>
                          {copy.project.emptyAgents}
                        </p>
                      ) : (
                        modelAgents.map(agent => (
                          <div key={agent.id} className="agent-card">
                            <div className="agent-card-header">
                              <h4>{agent.name} <span style={{opacity: 0.6, fontWeight: 'normal'}}>{agent.gender ? `(${agent.gender})` : ''}</span></h4>
                              <div className="model-actions">
                                <button className="icon-button" style={{ padding: '0.2rem' }} onClick={() => {
                                  setSelectedAgent(agent)
                                  setAgentModelId(model.id)
                                  setIsAgentModalOpen(true)
                                }}>✏️</button>
                                <button className="icon-button danger" style={{ padding: '0.2rem' }} onClick={() => handleDeleteAgent(agent.id)}>🗑️</button>
                              </div>
                            </div>
                            <div className="agent-details">
                              {agent.segment && <p style={{margin: '0 0 0.3rem 0'}}><strong>Segmento:</strong> {agent.segment}</p>}
                              {(agent.motivations?.length > 0 || agent.objections?.length > 0) && (
                                <div className="agent-tags">
                                  {agent.motivations?.map((m: string, i: number) => <span key={`m-${i}`} className="agent-tag" style={{background: 'rgba(52, 211, 153, 0.15)', color: '#10b981'}}>+ {m}</span>)}
                                  {agent.objections?.map((o: string, i: number) => <span key={`o-${i}`} className="agent-tag" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444'}}>- {o}</span>)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {isModelModalOpen && (
        <ModelModal 
          copy={copy} 
          model={selectedModel} 
          onClose={() => setIsModelModalOpen(false)} 
          onSave={handleSaveModel} 
        />
      )}

      {isAgentModalOpen && (
        <AgentModal 
          copy={copy}
          modelId={agentModelId}
          agent={selectedAgent}
          onClose={() => setIsAgentModalOpen(false)}
          onSave={handleSaveAgent}
        />
      )}
    </section>
  )
}

export default ProjectPage
