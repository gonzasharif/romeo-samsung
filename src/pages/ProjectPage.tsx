import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy, Locale } from '../i18n'
import SimulationCard from '../components/SimulationCard'
import { getProject, updateProject, getProjectSimulations, createProjectSimulation } from '../services/api'

type ProjectPageProps = {
  projectId: string
  onNavigate: (path: RoutePath) => void
  copy: Copy
  locale: Locale
  topControls: ReactNode
}

function ProjectPage({ projectId, onNavigate, copy, locale }: ProjectPageProps) {
  const newSimulationRef = useRef<HTMLElement | null>(null)
  const [project, setProject] = useState<any>(null)
  const [simulations, setSimulations] = useState<any[]>([])
  const [form, setForm] = useState({
    productDescription: '',
    ageRange: '',
    region: '',
    price: '',
    sex: 'any',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadProjectPage = async () => {
      try {
        const projectData = await getProject(projectId)
        if (!isMounted) return

        setProject(projectData)
        setForm({
          productDescription: projectData.context?.product_description || '',
          ageRange: projectData.context?.target_audience || '',
          region: projectData.context?.market_context || '',
          price: projectData.context?.pricing_notes || '',
          sex: projectData.context?.category || 'any',
        })

        try {
          const simulationsData = await getProjectSimulations(projectId)
          if (!isMounted) return
          setSimulations(simulationsData)
        } catch (simulationsError) {
          console.error(simulationsError)
          if (!isMounted) return
          setSimulations([])
        }
      } catch (projectError) {
        console.error(projectError)
        if (!isMounted) return
        onNavigate('/profile')
      }
    }

    loadProjectPage()

    return () => {
      isMounted = false
    }
  }, [projectId, onNavigate])

  useEffect(() => {
    if (!isFormVisible || !newSimulationRef.current) return

    newSimulationRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [isFormVisible])

  const handleSave = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const updatedProject = await updateProject(projectId, {
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
      const newSimulation = await createProjectSimulation(projectId, {
        scenario_name: `${project.name} · ${new Date().toLocaleString()}`,
        questions: [],
        overrides: {
          product_description: form.productDescription,
          age_range: form.ageRange,
          region: form.region,
          price: form.price,
          sex: form.sex,
        },
        provider: 'mock',
      })
      setProject(updatedProject)
      setSimulations((currentSimulations) => [newSimulation, ...currentSimulations])
      setIsFormVisible(false)
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

      <section className="project-panel project-simulations-panel">
        <div className="project-form-header">
          <div>
            <p className="panel-kicker">{copy.project.simulationsTag}</p>
            <h2>{copy.project.simulationsTitle}</h2>
          </div>
          {simulations.length > 0 ? (
            <button type="button" className="secondary-button" onClick={() => setIsFormVisible(true)}>
              {copy.project.newSimulation}
            </button>
          ) : null}
        </div>

        {simulations.length > 0 ? (
          <div className="simulation-list">
            {simulations.map((simulation) => (
              <SimulationCard
                key={simulation.id}
                simulation={simulation}
                copy={copy}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className="empty-projects project-empty-simulations">
            <h3>{copy.project.noSimulationsYet}</h3>
            <button type="button" className="primary-cta" onClick={() => setIsFormVisible(true)}>
              {copy.project.newSimulation}
            </button>
          </div>
        )}

        {isFormVisible ? (
          <section ref={newSimulationRef} className="project-form project-form-panel">
            <div className="project-new-simulation-heading">
              <p className="panel-kicker">{copy.project.newSimulationTag}</p>
              <h2>{copy.project.newSimulationHeading}</h2>
            </div>
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
              <small className="field-hint">{form.productDescription.length}/50</small>
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

            <div className="project-form-footer">
              <button
                type="button"
                className="primary-cta"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? copy.project.generating : copy.project.generateUserPersonas}
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </section>
  )
}

export default ProjectPage
