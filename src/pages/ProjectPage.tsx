import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'
import { getProject, updateProject } from '../services/api'

type ProjectPageProps = {
  projectId: string
  onNavigate: (path: RoutePath) => void
  copy: Copy
  topControls: ReactNode
}

function ProjectPage({ projectId, onNavigate, copy }: ProjectPageProps) {
  const [project, setProject] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getProject(projectId)
      .then(data => {
        setProject(data)
        setEditForm({ name: data.name, ...data.context })
      })
      .catch(err => {
        console.error(err)
        onNavigate('/profile')
      })
  }, [projectId, onNavigate])

  const handleSave = async () => {
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
      setIsEditing(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!project) {
    return (
      <section className="project-shell">
        <header className="project-topbar">
          <p>{project.loadingProjectInfo}</p>
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

      <section className="project-panel" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>{copy.project.heading}</h2>
            <button 
              className={isEditing ? 'primary-cta' : 'secondary-button'} 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
            >
                {isEditing ? (isSaving ? copy.project.saving : copy.project.save) : copy.project.edit}
            </button>
        </div>
        
        {isEditing ? (
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
                <hr style={{ opacity: 0.2, margin: '1rem 0' }} />
                <p className="modal-copy">{copy.project.description}</p>
            </div>
        )}
      </section>
    </section>
  )
}

export default ProjectPage
