import type { Copy, Locale } from '../i18n'

type ProjectCardProps = {
  project: {
    id: string
    name: string
    created_at?: string
  }
  copy: Copy
  locale: Locale
  onOpen: (projectId: string) => void
  onDelete: (project: { id: string; name: string; created_at?: string }) => void
}

function formatCreatedAt(createdAt: string | undefined, locale: Locale) {
  if (!createdAt) return '—'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    dateStyle: 'medium',
  }).format(date)
}

function ProjectCard({ project, copy, locale, onOpen, onDelete }: ProjectCardProps) {
  return (
    <article
      className="project-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(project.id)
        }
      }}
    >
      <div className="project-card-top">
        <p className="project-card-label">{copy.profile.projectCreatedAt}</p>
        <span className="project-card-date">{formatCreatedAt(project.created_at, locale)}</span>
      </div>
      <div className="project-card-actions">
        <div className="project-card-body">
          <h3>{project.name}</h3>
        </div>
        <button
          type="button"
          className="project-delete-button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(project)
          }}
        >
          {copy.project.delete}
        </button>
      </div>
    </article>
  )
}

export default ProjectCard
