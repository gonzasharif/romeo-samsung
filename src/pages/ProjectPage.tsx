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
  const [form, setForm] = useState({
    productDescription: '',
    ageRange: '',
    region: '',
    price: '',
    sex: 'any',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getProject(projectId)
      .then((data) => {
        setProject(data)
        setForm({
          productDescription: data.context?.product_description || '',
          ageRange: data.context?.target_audience || '',
          region: data.context?.market_context || '',
          price: data.context?.pricing_notes || '',
          sex: data.context?.category || 'any',
        })
      })
      .catch((err) => {
        console.error(err)
        onNavigate('/profile')
      })
  }, [projectId, onNavigate])

  const handleSave = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const updated = await updateProject(projectId, {
        name: project.name,
        context: {
          company_summary: project.context?.company_summary || project.name,
          product_name: project.name,
          product_description: form.productDescription,
          target_audience: form.ageRange,
          pricing_notes: form.price,
          market_context: form.region,
          category: form.sex,
        },
      })
      setProject(updated)
    } catch (error: any) {
      alert(error.message)
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

      <section className="project-panel">
        <div className="project-form-header">
          <div>
            <p className="panel-kicker">{copy.project.formTag}</p>
            <h2>{copy.project.formTitle}</h2>
          </div>
          <button type="button" className="primary-cta" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? copy.project.saving : copy.project.save}
          </button>
        </div>

        <div className="project-form">
          <label className="field">
            <span>{copy.project.productDescriptionShortLabel}</span>
            <input
              type="text"
              maxLength={50}
              value={form.productDescription}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  productDescription: event.target.value,
                }))
              }
              placeholder={copy.project.productDescriptionShortPlaceholder}
            />
            <small className="field-hint">
              {form.productDescription.length}/50
            </small>
          </label>

          <div className="field-grid project-form-grid">
            <label className="field">
              <span>{copy.project.ageRangeLabel}</span>
              <input
                type="text"
                value={form.ageRange}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    ageRange: event.target.value,
                  }))
                }
                placeholder={copy.project.ageRangePlaceholder}
              />
            </label>

            <label className="field">
              <span>{copy.project.regionLabel}</span>
              <input
                type="text"
                value={form.region}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    region: event.target.value,
                  }))
                }
                placeholder={copy.project.regionPlaceholder}
              />
            </label>
          </div>

          <div className="field-grid project-form-grid">
            <label className="field">
              <span>{copy.project.priceLabel}</span>
              <input
                type="text"
                value={form.price}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    price: event.target.value,
                  }))
                }
                placeholder={copy.project.pricePlaceholder}
              />
            </label>

            <label className="field">
              <span>{copy.project.sexLabel}</span>
              <select
                className="field-select"
                value={form.sex}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    sex: event.target.value,
                  }))
                }
              >
                <option value="any">{copy.project.any}</option>
                <option value="female">{copy.project.female}</option>
                <option value="male">{copy.project.male}</option>
              </select>
            </label>
          </div>
        </div>
      </section>
    </section>
  )
}

export default ProjectPage
