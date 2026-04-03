import type { Copy } from '../i18n'

export type UserPersona = {
  id: string
  name: string
  summary: string
  age: number | string
}

type UserPersonaCardProps = {
  persona: UserPersona
  copy: Copy
  onEdit?: (persona: UserPersona) => void
  onDelete?: (personaId: string) => void
  hideActions?: boolean
}

function UserPersonaCard({ persona, copy, onEdit, onDelete, hideActions = false }: UserPersonaCardProps) {
  return (
    <article className="user-persona-card">
      <div className="user-persona-card-top">
        <p className="user-persona-card-label">{copy.project.userPersonaLabel}</p>
        <h3>{persona.name}</h3>
      </div>

      <p className="user-persona-summary">{persona.summary}</p>

      <div className="user-persona-meta">
        <span>Edad: {persona.age}</span>
      </div>

      {!hideActions ? (
        <div className="user-persona-actions">
          <button
            type="button"
            className="project-delete-button persona-action-button"
            onClick={() => onDelete?.(persona.id)}
          >
            {copy.project.userPersonaDelete}
          </button>
        </div>
      ) : null}
    </article>
  )
}

export default UserPersonaCard
