import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'
import { getProjects, logout } from '../services/api'

type ProfilePageProps = {
  onNavigate: (path: RoutePath) => void
  copy: Copy
  topControls: ReactNode
}

function ProfilePage({ onNavigate, copy, topControls }: ProfilePageProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [userName, setUserName] = useState<string>('Founder')
  
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
          <button type="button" className="primary-cta profile-cta" onClick={() => alert('Pronto: Flujo para crear proyecto')}>
            {copy.common.createProject}
          </button>
        </div>

        {hasProjects ? (
          <div className="project-list">
            {projects.map((project) => (
              <article key={project.id} className="project-card">
                <h3>{project.name}</h3>
                <p>{project.context?.company_summary || 'Sin descripción'}</p>
              </article>
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
    </section>
  )
}

export default ProfilePage
