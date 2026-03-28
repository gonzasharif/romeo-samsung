import { useState, useEffect } from 'react'
import type { Copy } from '../i18n'

type WeightsModalProps = {
  copy: Copy
  onClose: () => void
  onSaveWeights: (weights: {
    buyingInterest: number
    pricePerception: number
    recommendation: number
    comprehension: number
    recall: number
    positiveFeatures: number
    negativeFeatures: number
  }) => void
  initialWeights?: {
    buyingInterest: number
    pricePerception: number
    recommendation: number
    comprehension: number
    recall: number
    positiveFeatures: number
    negativeFeatures: number
  }
}

function WeightsModal({
  copy,
  onClose,
  onSaveWeights,
  initialWeights,
}: WeightsModalProps) {
  const [weights, setWeights] = useState({
    buyingInterest: initialWeights?.buyingInterest || 15,
    pricePerception: initialWeights?.pricePerception || 10,
    recommendation: initialWeights?.recommendation || 15,
    comprehension: initialWeights?.comprehension || 15,
    recall: initialWeights?.recall || 15,
    positiveFeatures: initialWeights?.positiveFeatures || 15,
    negativeFeatures: initialWeights?.negativeFeatures || 15,
  })

  const total = Object.values(weights).reduce((sum, val) => sum + val, 0)
  const isValid = total === 100

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value)),
    }))
  }

  const handleSave = () => {
    if (isValid) {
      onSaveWeights(weights)
    }
  }

  const fields = [
    {
      key: 'buyingInterest' as const,
      label: copy.project.weights?.buyingInterest || 'Promedio interés de compra',
    },
    {
      key: 'pricePerception' as const,
      label: copy.project.weights?.pricePerception || 'Distribución percepción de precio',
    },
    {
      key: 'recommendation' as const,
      label: copy.project.weights?.recommendation || '% recomendación',
    },
    {
      key: 'comprehension' as const,
      label: copy.project.weights?.comprehension || '% buena comprensión',
    },
    {
      key: 'recall' as const,
      label: copy.project.weights?.recall || '% buen recuerdo',
    },
    {
      key: 'positiveFeatures' as const,
      label: copy.project.weights?.positiveFeatures || 'Top características positivas',
    },
    {
      key: 'negativeFeatures' as const,
      label: copy.project.weights?.negativeFeatures || 'Top características negativas',
    },
  ]

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weights-modal-title"
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
        <p className="section-tag">{copy.project.weights?.modalTag || 'Configuración'}</p>
        <h2 id="weights-modal-title">{copy.project.weights?.modalTitle || 'Pesos de estadísticas'}</h2>
        <p className="modal-copy">{copy.project.weights?.modalDescription || 'Asigná pesos a cada estadística. El total debe sumar 100%'}</p>

        <div className="weights-grid">
          {fields.map(field => (
            <div key={field.key} className="weight-field">
              <label htmlFor={`weight-${field.key}`}>
                <span className="weight-label">{field.label}</span>
                <div className="weight-input-wrapper">
                  <input
                    id={`weight-${field.key}`}
                    type="number"
                    min="0"
                    max="100"
                    value={weights[field.key]}
                    onChange={(e) => handleWeightChange(field.key, parseInt(e.target.value) || 0)}
                    className="weight-input"
                  />
                  <span className="weight-percent">%</span>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div className={`weight-total ${isValid ? 'valid' : 'invalid'}`}>
          <span>{copy.project.weights?.totalLabel || 'Total'}</span>
          <span className="total-value">{total}%</span>
        </div>

        {!isValid && (
          <p className="weight-error">
            {copy.project.weights?.errorTotal || 'El total debe ser igual a 100%'}
          </p>
        )}

        <button
          type="button"
          className="submit-button"
          onClick={handleSave}
          disabled={!isValid}
          style={{ marginTop: '1.5rem' }}
        >
          {copy.project.weights?.save || 'Guardar pesos'}
        </button>
      </div>
    </div>
  )
}

export default WeightsModal
