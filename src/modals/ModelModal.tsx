import { useState } from 'react'
import type { Copy } from '../i18n'

type ModelModalProps = {
  copy: Copy
  model?: any
  onClose: () => void
  onSave: (payload: any) => void
}

function ModelModal({ copy, model, onClose, onSave }: ModelModalProps) {
  const [name, setName] = useState(model?.name || '')
  const [ageRange, setAgeRange] = useState(model?.age_range || '')
  const [attitude, setAttitude] = useState(model?.attitude ?? 0)

  const handleSave = () => {
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      age_range: ageRange.trim(),
      attitude: parseInt(String(attitude), 10) || 0,
    }
    onSave(payload)
  }

  const isEditing = !!model

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
          {isEditing ? copy.project.editModel : copy.project.addModel}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="field">
            <span>{copy.project.modelNameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>{copy.project.modelAgeRangeLabel}</span>
            <input
              type="text"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{copy.project.modelAttitudeLabel}</span>
            <input
              type="number"
              min={0}
              max={3}
              value={attitude}
              onChange={(e) => setAttitude(e.target.value)}
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

export default ModelModal
