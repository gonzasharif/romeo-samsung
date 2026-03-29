import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy, Locale } from '../i18n'
import SimulationCard from '../components/SimulationCard'
import UserPersonaCard from '../components/UserPersonaCard'
import type { UserPersona } from '../components/UserPersonaCard'
import UserPersonaModal from '../modals/UserPersonaModal'
import {
  getProject,
  updateProject,
  getProjectSimulations,
  createProjectSimulation,
  getProjectModels,
  generateProjectModels,
} from '../services/api'
import { mapTargetModelToUserPersona, type TargetModelApi } from '../utils/userPersonaMapper'

type ProjectPageProps = {
  projectId: string
  onNavigate: (path: RoutePath) => void
  copy: Copy
  locale: Locale
  topControls: ReactNode
}

function ProjectPage({ projectId, onNavigate, copy, locale }: ProjectPageProps) {
  const newSimulationRef = useRef<HTMLElement | null>(null)
  const userPersonasRef = useRef<HTMLElement | null>(null)
  const [project, setProject] = useState<any>(null)
  const [simulations, setSimulations] = useState<any[]>([])
  const [userPersonas, setUserPersonas] = useState<UserPersona[]>([])
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null)
  const [form, setForm] = useState({
    productDescription: '',
    ageRange: '',
    region: '',
    price: '',
    sex: 'any',
  })
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false)
  const [isRunningSimulation, setIsRunningSimulation] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [shouldScrollToPersonas, setShouldScrollToPersonas] = useState(false)
  const isPersonasLocked = userPersonas.length > 0

  const buildProjectPayload = () => ({
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

        try {
          const modelsData = await getProjectModels(projectId)
          if (!isMounted) return
          setUserPersonas(
            (modelsData as TargetModelApi[]).map((model) => mapTargetModelToUserPersona(model, copy)),
          )
        } catch (modelsError) {
          console.error(modelsError)
          if (!isMounted) return
          setUserPersonas([])
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
  }, [projectId, onNavigate, copy])

  useEffect(() => {
    if (!isFormVisible || !newSimulationRef.current) return

    newSimulationRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [isFormVisible])

  useEffect(() => {
    if (!shouldScrollToPersonas || userPersonas.length === 0 || !userPersonasRef.current) return

    userPersonasRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    setShouldScrollToPersonas(false)
  }, [userPersonas, shouldScrollToPersonas])

  const handleGeneratePersonas = async () => {
    if (!project) return

    setIsGeneratingPersonas(true)
    try {
      const projectPayload = buildProjectPayload()
      const optimisticProject = {
        ...project,
        ...projectPayload,
        context: {
          ...project.context,
          ...projectPayload.context,
        },
      }

      let updatedProject = optimisticProject
      updatedProject = await updateProject(projectId, projectPayload)

      // Call the LLM to generate models for this project
      const prompt = `Descripción: ${form.productDescription}. Audiencia: ${form.ageRange}. Región: ${form.region}. Precio: ${form.price}. Sexo: ${form.sex}.`
      
      await generateProjectModels(projectId, { 
        prompt: prompt 
      })

      setProject(updatedProject)
      const modelsData = await getProjectModels(projectId)
      setUserPersonas(
        (modelsData as TargetModelApi[]).map((model) => mapTargetModelToUserPersona(model, copy)),
      )
      setShouldScrollToPersonas(true)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsGeneratingPersonas(false)
    }
  }

  const handleRunSimulation = async () => {
    if (!project || userPersonas.length === 0) return

    setIsRunningSimulation(true)
    try {
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
      setSimulations((currentSimulations) => [newSimulation, ...currentSimulations])
      onNavigate(`/project/${projectId}/results/${newSimulation.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsRunningSimulation(false)
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
                disabled={isPersonasLocked}
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
                  disabled={isPersonasLocked}
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
                  disabled={isPersonasLocked}
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
                  disabled={isPersonasLocked}
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
                  disabled={isPersonasLocked}
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

            {!isPersonasLocked ? (
              <div className="project-form-footer">
                <button
                  type="button"
                  className="primary-cta"
                  onClick={() => void handleGeneratePersonas()}
                  disabled={isGeneratingPersonas}
                >
                  {isGeneratingPersonas ? copy.project.generating : copy.project.generateUserPersonas}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {userPersonas.length > 0 ? (
          <section ref={userPersonasRef} className="user-personas-section">
            <div className="project-new-simulation-heading">
              <p className="panel-kicker">{copy.project.userPersonasTag}</p>
              <h2>{copy.project.userPersonasTitle}</h2>
            </div>

            <div className="user-persona-list">
              {userPersonas.map((persona) => (
                <UserPersonaCard
                  key={persona.id}
                  persona={persona}
                  copy={copy}
                  onEdit={(selectedPersona) => setEditingPersona(selectedPersona)}
                  onDelete={(personaId) =>
                    setUserPersonas((currentPersonas) =>
                      currentPersonas.filter((persona) => persona.id !== personaId),
                    )
                  }
                />
              ))}
            </div>

            <div className="project-form-footer">
              <button
                type="button"
                className="primary-cta"
                onClick={() => void handleRunSimulation()}
                disabled={isRunningSimulation}
              >
                {isRunningSimulation ? copy.project.runningSimulation : copy.project.runSimulation}
              </button>
            </div>
          </section>
        ) : null}
      </section>

      {editingPersona ? (
        <UserPersonaModal
          copy={copy}
          persona={editingPersona}
          onClose={() => setEditingPersona(null)}
          onSave={(updatedPersona) => {
            setUserPersonas((currentPersonas) =>
              currentPersonas.map((persona) =>
                persona.id === updatedPersona.id ? updatedPersona : persona,
              ),
            )
            setEditingPersona(null)
          }}
        />
      ) : null}
    </section>
  )
}

export default ProjectPage
