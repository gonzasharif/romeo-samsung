import type { Copy } from '../i18n'
import type { UserPersona } from '../components/UserPersonaCard'

export type TargetModelApi = {
  id: string
  name: string
  age?: number | null
  occupation?: string | null
  socioeconomic_level?: string | null
  personality?: string[] | null
}

function buildSummary(model: TargetModelApi, copy: Copy) {
  const parts = [
    model.occupation || null,
    model.socioeconomic_level ? copy.project.userPersonaSocioeconomic(model.socioeconomic_level) : null,
    model.personality?.length ? copy.project.userPersonaAttitude(model.personality.slice(0, 2).join(', ')) : null,
  ].filter(Boolean)

  return parts.join(' · ')
}

export function mapTargetModelToUserPersona(model: TargetModelApi, copy: Copy): UserPersona {
  return {
    id: model.id,
    name: model.name,
    summary: buildSummary(model, copy),
    age: model.age || 'Unknown',
  }
}
