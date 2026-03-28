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
          product_name: editForm.product_name || editForm.name,
          product_description: editForm.product_description || '',
          product_value_proposition: editForm.product_value_proposition || '',
          product_pricing: editForm.product_pricing || 'medium',
          product_brand_message: editForm.product_brand_message || '',
          audience_min_age: editForm.audience_min_age || '',
          audience_max_age: editForm.audience_max_age || '',
          audience_region: editForm.audience_region || '',
          audience_gender: editForm.audience_gender || 'all'
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
            <div className="edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                <label className="field">
                    <span>{copy.project.projectNameLabel}</span>
                    <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </label>
                <label className="field">
                    <span>{copy.project.companySummaryLabel}</span>
                    <textarea rows={3} value={editForm.company_summary || ''} onChange={e => setEditForm({...editForm, company_summary: e.target.value})} />
                </label>

                <div style={{ borderTop: '1px solid rgba(23, 37, 84, 0.1)', paddingTop: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>{copy.project.productDescriptionLabel}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="field">
                            <span>{copy.project.productNameLabel}</span>
                            <input type="text" value={editForm.product_name || ''} onChange={e => setEditForm({...editForm, product_name: e.target.value})} />
                        </label>
                        <label className="field">
                            <span>{copy.project.productDetailsLabel}</span>
                            <textarea rows={3} value={editForm.product_description || ''} onChange={e => setEditForm({...editForm, product_description: e.target.value})} />
                        </label>
                        <label className="field">
                            <span>{copy.project.productValuePropositionLabel}</span>
                            <textarea rows={2} value={editForm.product_value_proposition || ''} onChange={e => setEditForm({...editForm, product_value_proposition: e.target.value})} />
                        </label>
                        <label className="field">
                            <span>{copy.project.productPricingLabel}</span>
                            <select value={editForm.product_pricing || 'medium'} onChange={e => setEditForm({...editForm, product_pricing: e.target.value})} style={{ padding: '0.95rem 1rem', borderRadius: '1rem', border: '1px solid rgba(23, 37, 84, 0.1)', background: 'rgba(255, 255, 255, 0.8)', color: 'var(--text-h)', font: 'inherit', cursor: 'pointer' }}>
                                <option value="low">{copy.project.productPricingLow}</option>
                                <option value="medium">{copy.project.productPricingMedium}</option>
                                <option value="high">{copy.project.productPricingHigh}</option>
                            </select>
                        </label>
                        <label className="field">
                            <span>{copy.project.productBrandMessageLabel}</span>
                            <textarea rows={2} value={editForm.product_brand_message || ''} onChange={e => setEditForm({...editForm, product_brand_message: e.target.value})} />
                        </label>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(23, 37, 84, 0.1)', paddingTop: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>{copy.project.targetAudienceLabel}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <label className="field">
                            <span>{copy.project.audienceMinAgeLabel}</span>
                            <input type="number" min="0" max="120" value={editForm.audience_min_age || ''} onChange={e => setEditForm({...editForm, audience_min_age: parseInt(e.target.value) || ''})} />
                        </label>
                        <label className="field">
                            <span>{copy.project.audienceMaxAgeLabel}</span>
                            <input type="number" min="0" max="120" value={editForm.audience_max_age || ''} onChange={e => setEditForm({...editForm, audience_max_age: parseInt(e.target.value) || ''})} />
                        </label>
                        <label className="field" style={{ gridColumn: '1 / -1' }}>
                            <span>{copy.project.audienceRegionLabel}</span>
                            <input type="text" value={editForm.audience_region || ''} onChange={e => setEditForm({...editForm, audience_region: e.target.value})} placeholder="Ej. Argentina, LATAM, Global" />
                        </label>
                        <label className="field" style={{ gridColumn: '1 / -1' }}>
                            <span>{copy.project.audienceGenderLabel}</span>
                            <select value={editForm.audience_gender || 'all'} onChange={e => setEditForm({...editForm, audience_gender: e.target.value})} style={{ padding: '0.95rem 1rem', borderRadius: '1rem', border: '1px solid rgba(23, 37, 84, 0.1)', background: 'rgba(255, 255, 255, 0.8)', color: 'var(--text-h)', font: 'inherit', cursor: 'pointer' }}>
                                <option value="women">{copy.project.audienceGenderWomen}</option>
                                <option value="men">{copy.project.audienceGenderMen}</option>
                                <option value="other">{copy.project.audienceGenderOther}</option>
                                <option value="all">{copy.project.audienceGenderAll}</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        ) : (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <p><strong>{copy.project.companySummaryLabel}:</strong> {project.context?.company_summary}</p>
                </div>

                <div style={{ borderTop: '1px solid rgba(23, 37, 84, 0.1)', paddingTop: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>{copy.project.productDescriptionLabel}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <p style={{ margin: 0 }}><strong>{copy.project.productNameLabel}:</strong> {project.context?.product_name}</p>
                        <p style={{ margin: 0 }}><strong>{copy.project.productDetailsLabel}:</strong> {project.context?.product_description}</p>
                        <p style={{ margin: 0 }}><strong>{copy.project.productValuePropositionLabel}:</strong> {project.context?.product_value_proposition}</p>
                        <p style={{ margin: 0 }}><strong>{copy.project.productPricingLabel}:</strong> {project.context?.product_pricing}</p>
                        <p style={{ margin: 0 }}><strong>{copy.project.productBrandMessageLabel}:</strong> {project.context?.product_brand_message}</p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(23, 37, 84, 0.1)', paddingTop: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>{copy.project.targetAudienceLabel}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <p style={{ margin: 0 }}><strong>{copy.project.audienceMinAgeLabel}:</strong> {project.context?.audience_min_age}</p>
                        <p style={{ margin: 0 }}><strong>{copy.project.audienceMaxAgeLabel}:</strong> {project.context?.audience_max_age}</p>
                        <p style={{ margin: 0 }}><strong>{copy.project.audienceRegionLabel}:</strong> {project.context?.audience_region}</p>
                        <p style={{ margin: 0 }}><strong>{copy.project.audienceGenderLabel}:</strong> {project.context?.audience_gender}</p>
                    </div>
                </div>

                <hr style={{ opacity: 0.2, margin: '1rem 0' }} />
                <p className="modal-copy">{copy.project.description}</p>
            </div>
        )}
      </section>
    </section>
  )
}

export default ProjectPage
