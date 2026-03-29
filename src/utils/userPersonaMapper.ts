import type { Copy } from '../i18n'
import type { UserPersona } from '../components/UserPersonaCard'

export type TargetModelApi = {
  id: string
  name: string
  age_range?: string | null
  geography?: string | null
  income_level?: number | null
  tech_savviness?: string | null
  attitude?: string | null
}

function buildSummary(model: TargetModelApi, copy: Copy) {
  const parts = [
    model.income_level != null ? copy.project.userPersonaIncome(model.income_level) : null,
    model.tech_savviness || null,
    model.attitude || null,
  ].filter(Boolean)

  return parts.join(' · ')
}

export function mapTargetModelToUserPersona(model: TargetModelApi, copy: Copy): UserPersona {
  return {
    id: model.id,
    name: model.name,
    summary: buildSummary(model, copy),
    ageRange: model.age_range || '',
    region: model.geography || '',
    price: '',
    sex: '',
  }
}
