import { useState } from 'react'
import type { Copy } from '../i18n'

type CreateProjectModalProps = {
  copy: Copy
  onClose: () => void
  onCreateProject: (projectName: string) => void
}

function CreateProjectModal({
  copy,
  onClose,
  onCreateProject,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('')

  const handleCreateProject = () => {
    const trimmedName = projectName.trim()
    if (!trimmedName) return

    setProjectName('')
    onCreateProject(trimmedName)
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
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
        <p className="section-tag">{copy.project.modalTag}</p>
        <h2 id="new-project-title">{copy.project.modalTitle}</h2>
        <p className="modal-copy">{copy.project.modalDescription}</p>
        <label className="field">
          <span>{copy.project.projectNameLabel}</span>
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder={copy.project.projectNamePlaceholder}
            autoFocus
          />
        </label>
        <button
          style={{ marginTop: '16px' }}
          type="button"
          className="submit-button"
          onClick={handleCreateProject}
          disabled={!projectName.trim()}
        >
          {copy.project.create}
        </button>
      </div>
    </div>
  )
}

export default CreateProjectModal
