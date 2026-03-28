import type { RoutePath } from '../App'

type ProfilePageProps = {
  onNavigate: (path: RoutePath) => void
}

const projects: { id: string; name: string; summary: string }[] = []

function ProfilePage({ onNavigate }: ProfilePageProps) {
  const hasProjects = projects.length > 0

  return (
    <section className="profile-shell">
      <header className="profile-topbar">
        <div>
          <p className="section-tag">Workspace</p>
          <h1 className="profile-title">Hola, Ada Founder</h1>
        </div>
        <div className="profile-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate('/')}>
            Volver al inicio
          </button>
          <button type="button" className="primary-cta profile-cta">
            Nuevo proyecto
          </button>
        </div>
      </header>

      <section className="profile-panel">
        <div className="profile-panel-header">
          <div>
            <p className="panel-kicker">Tus proyectos</p>
            <h2>Espacio de validación</h2>
          </div>
          <span className="project-count">
            {hasProjects ? `${projects.length} proyectos` : 'Sin proyectos'}
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
            <h3>No hay proyectos todavía :(</h3>
            <p>Creá uno nuevo para empezar a validar ideas con focus groups de IA.</p>
          </div>
        )}
      </section>
    </section>
  )
}

export default ProfilePage
