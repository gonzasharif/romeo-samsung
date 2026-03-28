import type { ReactNode } from 'react'
import type { RoutePath } from '../App'
import type { Copy } from '../i18n'

type ProjectPageProps = {
  onNavigate: (path: RoutePath) => void
  copy: Copy
  topControls: ReactNode
  projectName: string
}

function ProjectPage({ onNavigate, copy, projectName }: ProjectPageProps) {
  return (
    <section className="project-shell">
      <header className="project-topbar">
        <div>
          <p className="section-tag">{copy.project.tag}</p>
          <h1 className="project-title">{projectName}</h1>
        </div>
        <div className="project-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate('/profile')}>
            {copy.project.backToProfile}
          </button>
        </div>
      </header>

      <section className="project-panel">
        <p className="panel-kicker">{copy.project.kicker}</p>
        <h2>{copy.project.heading}</h2>
        <p>{copy.project.description}</p>
      </section>
    </section>
  )
}

export default ProjectPage
