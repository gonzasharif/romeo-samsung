import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'

type ProfilePageProps = {
  onNavigate: (path: RoutePath) => void
  copy: Copy
  topControls: ReactNode
}

const projects: { id: string; name: string; summary: string }[] = []

function ProfilePage({ onNavigate, copy, topControls }: ProfilePageProps) {
  const hasProjects = projects.length > 0

  return (
    <section className="profile-shell">
      <header className="profile-topbar">
        <div>
          <p className="section-tag">{copy.profile.workspace}</p>
          <h1 className="profile-title">{copy.profile.helloUser}</h1>
        </div>
        <div className="profile-actions">
          {topControls}
          <button type="button" className="secondary-button" onClick={() => onNavigate('/')}>
            {copy.common.backHome}
          </button>
          <button type="button" className="primary-cta profile-cta">
            {copy.common.createProject}
          </button>
        </div>
      </header>

      <section className="profile-panel">
        <div className="profile-panel-header">
          <div>
            <p className="panel-kicker">{copy.profile.projectsKicker}</p>
            <h2>{copy.profile.projectsTitle}</h2>
          </div>
          <span className="project-count">
            {hasProjects ? copy.profile.projectsCount(projects.length) : copy.common.noProjects}
          </span>
        </div>

        {hasProjects ? (
          <div className="project-list">
            {projects.map((project) => (
              <article key={project.id} className="project-card">
                <h3>{project.name}</h3>
                <p>{project.summary}</p>
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
