import type { Copy } from '../i18n'

type DeleteProjectModalProps = {
  copy: Copy
  projectName: string
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

function DeleteProjectModal({
  copy,
  projectName,
  onClose,
  onConfirm,
}: DeleteProjectModalProps) {
  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
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
        <p className="section-tag">{copy.project.deleteTag}</p>
        <h2 id="delete-project-title">{copy.project.deleteTitle}</h2>
        <p className="modal-copy">{copy.project.deleteDescription(projectName)}</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button modal-secondary" onClick={onClose}>
            {copy.project.cancelDelete}
          </button>
          <button type="button" className="submit-button delete-button" onClick={() => void onConfirm()}>
            {copy.project.confirmDelete}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteProjectModal
