import { useState } from 'react'
import type { Copy } from '../i18n'

type AgentModalProps = {
  copy: Copy
  modelId: string
  agent?: any
  onClose: () => void
  onSave: (payload: any) => void
}

function AgentModal({ copy, modelId, agent, onClose, onSave }: AgentModalProps) {
  const [name, setName] = useState(agent?.name || '')
  const [gender, setGender] = useState(agent?.gender || '')
  const [segment, setSegment] = useState(agent?.segment || '')
  const [motivations, setMotivations] = useState(agent?.motivations?.join(', ') || '')
  const [objections, setObjections] = useState(agent?.objections?.join(', ') || '')

  const handleSave = () => {
    if (!name.trim()) return
    const payload = {
      model_id: modelId,
      name: name.trim(),
      gender: gender.trim(),
      segment: segment.trim(),
      motivations: motivations.split(',').map((s: string) => s.trim()).filter(Boolean),
      objections: objections.split(',').map((s: string) => s.trim()).filter(Boolean),
    }
    onSave(payload)
  }

  const isEditing = !!agent

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
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
        <h2 style={{ marginBottom: '1.5rem' }}>
          {isEditing ? copy.project.editAgent : copy.project.addAgent}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="field">
            <span>{copy.project.agentNameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>{copy.project.agentGenderLabel}</span>
            <input
              type="text"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{copy.project.agentSegmentLabel}</span>
            <input
              type="text"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{copy.project.agentMotivationsLabel}</span>
            <textarea
              rows={2}
              value={motivations}
              onChange={(e) => setMotivations(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{copy.project.agentObjectionsLabel}</span>
            <textarea
              rows={2}
              value={objections}
              onChange={(e) => setObjections(e.target.value)}
            />
          </label>
        </div>

        <button
          style={{ marginTop: '1.5rem' }}
          type="button"
          className="submit-button"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          {copy.project.save}
        </button>
      </div>
    </div>
  )
}

export default AgentModal
