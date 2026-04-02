import { useState } from 'react'
import type { Copy } from '../i18n'
import type { UserPersona } from '../components/UserPersonaCard'

type UserPersonaModalProps = {
  copy: Copy
  persona: UserPersona
  onClose: () => void
  onSave: (persona: UserPersona) => void
}

function UserPersonaModal({ copy, persona, onClose, onSave }: UserPersonaModalProps) {
  const [draft, setDraft] = useState<UserPersona>(persona)

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-persona-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label={copy.project.closeModal} onClick={onClose}>
          ×
        </button>
        <p className="section-tag">{copy.project.userPersonaModalTag}</p>
        <h2 id="user-persona-title">{copy.project.userPersonaModalTitle}</h2>

        <div className="project-form persona-modal-form">
          <label className="field">
            <span>{copy.project.userPersonaNameLabel}</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>{copy.project.userPersonaSummaryLabel}</span>
            <textarea
              rows={4}
              value={draft.summary}
              onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
            />
          </label>

          <div className="field-grid project-form-grid">
            <label className="field">
              <span>{copy.project.ageRangeLabel}</span>
              <input
                type="text"
                value={draft.ageRange}
                onChange={(event) => setDraft((current) => ({ ...current, ageRange: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>{copy.project.regionLabel}</span>
              <input
                type="text"
                value={draft.region}
                onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
          </div>

          <label className="field">
            <span>{copy.project.sexLabel}</span>
            <select
              className="field-select"
              value={draft.sex}
              onChange={(event) => setDraft((current) => ({ ...current, sex: event.target.value }))}
            >
              <option value="any">{copy.project.any}</option>
              <option value="female">{copy.project.female}</option>
              <option value="male">{copy.project.male}</option>
            </select>
          </label>

          <div className="project-form-footer">
            <button type="button" className="primary-cta" onClick={() => onSave(draft)}>
              {copy.project.userPersonaSave}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPersonaModal
