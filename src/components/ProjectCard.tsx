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
    <article className="project-card">
      <div className="project-card-top">
        <p className="project-card-label">{copy.profile.projectCreatedAt}</p>
        <span className="project-card-date">{formatCreatedAt(project.created_at, locale)}</span>
      </div>
      <div className="project-card-actions">
        <button type="button" className="project-card-body" onClick={() => onOpen(project.id)}>
          <h3>{project.name}</h3>
        </button>
        <button
          type="button"
          className="project-delete-button"
          onClick={() => onDelete(project)}
        >
          {copy.project.delete}
        </button>
      </div>
    </article>
  )
}

export default ProjectCard
