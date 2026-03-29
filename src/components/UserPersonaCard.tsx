import type { Copy } from '../i18n'

export type UserPersona = {
  id: string
  name: string
  summary: string
  ageRange: string
  region: string
  price: string
  sex: string
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
        <span>{copy.project.userPersonaAge(persona.ageRange)}</span>
        <span>{copy.project.userPersonaRegion(persona.region)}</span>
        <span>{copy.project.userPersonaPrice(persona.price)}</span>
        <span>{copy.project.userPersonaSex(persona.sex)}</span>
      </div>

      {!hideActions ? (
        <div className="user-persona-actions">
          <button
            type="button"
            className="secondary-button persona-action-button"
            onClick={() => onEdit?.(persona)}
          >
            {copy.project.userPersonaEdit}
          </button>
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
