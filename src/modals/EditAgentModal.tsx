import { useState } from 'react'
import type { Copy } from '../i18n'

type Agent = {
  id: string
  name: string
  age: number
  occupation: string
  socioeconomic_level: string
  personality: [string, string, string]
}

type EditAgentModalProps = {
  copy: Copy
  agent: Agent
  onClose: () => void
  onSave: (agent: Agent) => void
}

function EditAgentModal({ copy, agent, onClose, onSave }: EditAgentModalProps) {
  const [formData, setFormData] = useState<Agent>({
    ...agent,
    personality: agent.personality || ['', '', ''],
  })

  const [errors, setErrors] = useState<string[]>([])

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.name.trim()) {
      newErrors.push(copy.agent.nameRequired)
    }
    if (!formData.age || formData.age < 1 || formData.age > 120) {
      newErrors.push(copy.agent.ageRequired)
    }
    if (!formData.occupation.trim()) {
      newErrors.push(copy.agent.occupationRequired)
    }
    if (!formData.socioeconomic_level.trim()) {
      newErrors.push(copy.agent.socioeconomicRequired)
    }
    const personalityFilled = formData.personality.filter(p => p.trim()).length
    if (personalityFilled !== 3) {
      newErrors.push(copy.agent.personalityExactly3)
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handlePersonalityChange = (index: 0 | 1 | 2, value: string) => {
    const newPersonality: [string, string, string] = [...formData.personality] as [string, string, string]
    newPersonality[index] = value
    setFormData(prev => ({
      ...prev,
      personality: newPersonality,
    }))
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-agent-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          aria-label={copy.project.closeModal}
          onClick={onClose}
        >
          ×
        </button>
        <p className="section-tag">{copy.agent.modalTag}</p>
        <h2 id="edit-agent-title">{copy.agent.modalTitle}</h2>
        <p className="modal-copy">{copy.agent.modalDescription}</p>

        {errors.length > 0 && (
          <div className="agent-errors">
            {errors.map((error, idx) => (
              <p key={idx} className="error-message">
                • {error}
              </p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <label className="field">
            <span>{copy.agent.nameLabel}</span>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={copy.agent.namePlaceholder}
            />
          </label>

          <label className="field">
            <span>{copy.agent.ageLabel}</span>
            <input
              type="number"
              min="1"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
            />
          </label>

          <label className="field">
            <span>{copy.agent.occupationLabel}</span>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              placeholder={copy.agent.occupationPlaceholder}
            />
          </label>

          <label className="field">
            <span>{copy.agent.socioeconomicLabel}</span>
            <input
              type="text"
              value={formData.socioeconomic_level}
              onChange={(e) => setFormData(prev => ({ ...prev, socioeconomic_level: e.target.value }))}
              placeholder={copy.agent.socioeconomicPlaceholder}
            />
          </label>

          <div>
            <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-h)' }}>
              {copy.agent.personalityLabel}
            </label>
            <p style={{ fontSize: '0.85rem', color: 'rgba(23, 37, 84, 0.6)', marginTop: '-0.5rem', marginBottom: '0.8rem' }}>
              {copy.agent.personalityHint}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
              {[0, 1, 2].map((index) => (
                <label key={index} className="field" style={{ margin: 0 }}>
                  <span style={{ fontSize: '0.8rem' }}>{copy.agent.trait} {index + 1}</span>
                  <input
                    type="text"
                    value={formData.personality[index as 0 | 1 | 2]}
                    onChange={(e) => handlePersonalityChange(index as 0 | 1 | 2, e.target.value)}
                    placeholder={copy.agent.traitPlaceholder}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            {copy.agent.cancel}
          </button>
          <button
            type="button"
            className="submit-button"
            onClick={handleSave}
          >
            {copy.agent.save}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditAgentModal
