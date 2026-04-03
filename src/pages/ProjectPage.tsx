import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy, Locale } from '../i18n'
import SimulationCard from '../components/SimulationCard'
import UserPersonaCard from '../components/UserPersonaCard'
import type { UserPersona } from '../components/UserPersonaCard'
import {
  getProject,
  updateProject,
  getProjectSimulations,
  createProjectSimulation,
  getProjectModels,
  generateProjectModels,
  deleteProjectModel
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
  
  const [form, setForm] = useState({
    description: '',
    targetAge: '',
    targetGender: 'any',
    suggestedPrice: ''
  })
  
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false)
  const [isRunningSimulation, setIsRunningSimulation] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(true)
  const [shouldScrollToPersonas, setShouldScrollToPersonas] = useState(false)
  
  const isPersonasLocked = userPersonas.length > 0

  useEffect(() => {
    let isMounted = true

    const loadProjectPage = async () => {
      try {
        const projectData = await getProject(projectId)
        if (!isMounted) return

        setProject(projectData)
        setForm({
          description: projectData.context?.description || '',
          targetAge: projectData.context?.target_age || '',
          targetGender: projectData.context?.target_gender || 'any',
          suggestedPrice: projectData.context?.suggested_price || '',
        })

        try {
          const simulationsData = await getProjectSimulations(projectId)
          if (!isMounted) return
          setSimulations(simulationsData)
        } catch (error) {
          console.error(error)
          if (!isMounted) return
          setSimulations([])
        }

        try {
          const modelsData = await getProjectModels(projectId)
          if (!isMounted) return
          setUserPersonas(
            (modelsData as TargetModelApi[]).map((model) => mapTargetModelToUserPersona(model, copy)),
          )
        } catch (error) {
          console.error(error)
          if (!isMounted) return
          setUserPersonas([])
        }
      } catch (error) {
        console.error(error)
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
    newSimulationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isFormVisible])

  useEffect(() => {
    if (!shouldScrollToPersonas || userPersonas.length === 0 || !userPersonasRef.current) return
    userPersonasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setShouldScrollToPersonas(false)
  }, [userPersonas, shouldScrollToPersonas])

  const handleGeneratePersonas = async () => {
    if (!project) return
    setIsGeneratingPersonas(true)
    
    try {
      const projectPayload = {
        name: project.name,
        context: {
          description: form.description,
          target_age: form.targetAge,
          target_gender: form.targetGender,
          suggested_price: form.suggestedPrice
        }
      }

      await updateProject(projectId, projectPayload)
      await generateProjectModels(projectId)

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

  const handleDeletePersona = async (personaId: string) => {
    try {
      await deleteProjectModel(projectId, personaId)
      setUserPersonas((current) => current.filter((p) => p.id !== personaId))
    } catch (error) {
      console.error(error)
    }
  }

  const handleRunSimulation = async () => {
    if (!project || userPersonas.length === 0) return
    setIsRunningSimulation(true)
    
    try {
      const newSimulation = await createProjectSimulation(projectId, {
        scenario_name: `${project.name} · ${new Date().toLocaleString()}`,
        questions: [],
        provider: 'mock',
      })
      setSimulations((current) => [newSimulation, ...current])
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
        </div>

        {simulations.length > 0 ? (
          <div className="simulation-list">
            {simulations.map((simulation) => (
              <SimulationCard
                key={simulation.id}
                simulation={simulation}
                copy={copy}
                locale={locale}
                onClick={(simulationId) => onNavigate(`/project/${projectId}/results/${simulationId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-projects project-empty-simulations">
            <h3>{copy.project.noSimulationsYet}</h3>
          </div>
        )}

        <section ref={newSimulationRef} className="project-form project-form-panel">
            <div className="project-new-simulation-heading">
              <p className="panel-kicker">{copy.project.newSimulationTag}</p>
              <h2>{copy.project.newSimulationHeading}</h2>
            </div>
            
            <label className="field">
              <span>Descripción del Producto</span>
              <input
                type="text"
                value={form.description}
                disabled={isPersonasLocked}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                placeholder="Ej. Bebida energizante a base de matcha"
              />
            </label>

            <div className="field-grid project-form-grid">
              <label className="field">
                <span>Rango de Edad</span>
                <input
                  type="text"
                  value={form.targetAge}
                  disabled={isPersonasLocked}
                  onChange={(e) => setForm((c) => ({ ...c, targetAge: e.target.value }))}
                  placeholder="Ej. 18 a 35 años"
                />
              </label>

              <label className="field">
                <span>Género</span>
                <select
                  className="field-select"
                  value={form.targetGender}
                  disabled={isPersonasLocked}
                  onChange={(e) => setForm((c) => ({ ...c, targetGender: e.target.value }))}
                >
                  <option value="any">Todos</option>
                  <option value="female">Mujeres</option>
                  <option value="male">Hombres</option>
                </select>
              </label>
            </div>

            <div className="field-grid project-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label className="field">
                <span>Precio Sugerido</span>
                <input
                  type="text"
                  value={form.suggestedPrice}
                  disabled={isPersonasLocked}
                  onChange={(e) => setForm((c) => ({ ...c, suggestedPrice: e.target.value }))}
                  placeholder="Ej. 15 dólares"
                />
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
                  onDelete={handleDeletePersona}
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
    </section>
  )
}

export default ProjectPage
