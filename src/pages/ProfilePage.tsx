import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy, Locale } from '../i18n'
import ProjectCard from '../components/ProjectCard'
import CreateProjectModal from '../modals/CreateProjectModal'
import DeleteProjectModal from '../modals/DeleteProjectModal'
import { getProjects, logout, createProject, deleteProject } from '../services/api'

type ProfilePageProps = {
  onNavigate: (path: RoutePath) => void
  copy: Copy
  locale: Locale
  topControls: ReactNode
}

function ProfilePage({ onNavigate, copy, locale }: ProfilePageProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [userName, setUserName] = useState<string>('Founder')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)
  
  useEffect(() => {
    const sessionStr = localStorage.getItem('session')
    if (!sessionStr) {
      onNavigate('/login')
      return
    }
    
    try {
        const session = JSON.parse(sessionStr)
        const name = session.user?.user_metadata?.full_name || 'Founder'
        setUserName(name)
    } catch(e) {}
    
    getProjects()
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data)
        }
      })
      .catch(err => {
        console.error(err)
        if (err.message === 'Unauthorized' || err.message === 'Not authenticated') {
          onNavigate('/login')
        }
      })
  }, [onNavigate])

  const hasProjects = projects.length > 0

  return (
    <section className="profile-shell">
      <header className="profile-topbar">
        <div>
          <p className="section-tag">{copy.profile.workspace}</p>
          <h1 className="profile-title">{copy.profile.helloUser(userName)}</h1>
        </div>
        <div className="profile-actions">
          <button type="button" className="secondary-button" onClick={async () => {
            await logout()
            onNavigate('/')
          }}>
            {copy.common.logout}
          </button>
        </div>
      </header>

      <section className="profile-panel">
        <div className="profile-panel-header">
          <div>
            <p className="panel-kicker">{copy.profile.projectsKicker}</p>
            <h2>{copy.profile.projectsTitle}</h2>
          </div>
          <button type="button" className="primary-cta profile-cta" onClick={() => setIsModalOpen(true)}>
            {copy.common.createProject}
          </button>
        </div>

        {hasProjects ? (
          <div className="project-list">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                copy={copy}
                locale={locale}
                onOpen={(projectId) => onNavigate(`/project/${projectId}`)}
                onDelete={(selectedProject) =>
                  setProjectToDelete({ id: selectedProject.id, name: selectedProject.name })
                }
              />
            ))}
          </div>
        ) : (
          <div className="empty-projects">
            <div className="empty-illustration">
              <span />
              <span />
              <span />
            </div>
            <h3>{copy.common.emptyProjects}</h3>
            <p>{copy.profile.emptyText}</p>
          </div>
        )}
      </section>

      {isModalOpen ? (
        <CreateProjectModal
          copy={copy}
          onClose={() => setIsModalOpen(false)}
          onCreateProject={async (projectName) => {
            setIsModalOpen(false)
            try {
              const created = await createProject(projectName)
              onNavigate(`/project/${created.id}`)
            } catch (err: any) {
              alert(err.message)
            }
          }}
        />
      ) : null}

      {projectToDelete ? (
        <DeleteProjectModal
          copy={copy}
          projectName={projectToDelete.name}
          onClose={() => setProjectToDelete(null)}
          onConfirm={async () => {
            try {
              await deleteProject(projectToDelete.id)
              setProjects((currentProjects) =>
                currentProjects.filter((project) => project.id !== projectToDelete.id),
              )
              setProjectToDelete(null)
            } catch (err: any) {
              alert(err.message)
            }
          }}
        />
      ) : null}
    </section>
  )
}

export default ProfilePage
