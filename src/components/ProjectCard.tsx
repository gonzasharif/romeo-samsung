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
}

function formatCreatedAt(createdAt: string | undefined, locale: Locale) {
  if (!createdAt) return '—'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    dateStyle: 'medium',
  }).format(date)
}

function ProjectCard({ project, copy, locale, onOpen }: ProjectCardProps) {
  return (
    <button type="button" className="project-card" onClick={() => onOpen(project.id)}>
      <div className="project-card-top">
        <p className="project-card-label">{copy.profile.projectCreatedAt}</p>
        <span className="project-card-date">{formatCreatedAt(project.created_at, locale)}</span>
      </div>
      <h3>{project.name}</h3>
    </button>
  )
}

export default ProjectCard
