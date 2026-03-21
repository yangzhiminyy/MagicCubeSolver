/**
 * FaceInput 组件
 * 用于手动调整单个魔方面的颜色（3x3网格）
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaceColor } from '../utils/cubeTypes'
import { FaceInputState } from '../utils/cubeInputConverter'
import './FaceInput.css'

interface FaceInputProps {
  faceState: FaceInputState
  onColorChange: (row: number, col: number, color: FaceColor) => void
  onComplete: () => void
}

const COLOR_OPTIONS: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue', 'black']

const COLOR_HEX: Record<FaceColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFEB3B',
  red: '#F44336',
  orange: '#FF9800',
  green: '#4CAF50',
  blue: '#2196F3',
  black: '#333333',
}

export default function FaceInput({ faceState, onColorChange, onComplete }: FaceInputProps) {
  const { t } = useTranslation()
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null)

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col })
  }

  const handleColorSelect = (color: FaceColor) => {
    if (selectedCell) {
      onColorChange(selectedCell.row, selectedCell.col, color)
      setSelectedCell(null)
    }
  }

  return (
    <div className="face-input">
      <h3>{t(`faces.${faceState.face}`)}</h3>
      
      <div className="face-grid">
        {faceState.colors.map((row, rowIdx) => (
          <div key={rowIdx} className="face-row">
            {row.map((color, colIdx) => {
              const confidence = faceState.confidence[rowIdx][colIdx]
              const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx
              
              return (
                <div
                  key={colIdx}
                  className={`face-cell ${isSelected ? 'selected' : ''} ${confidence < 0.5 ? 'low-confidence' : ''}`}
                  style={{ backgroundColor: COLOR_HEX[color] }}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  title={t('faceInput.confidenceTitle', {
                    color: t(`colors.full.${color}`),
                    pct: (confidence * 100).toFixed(0),
                  })}
                >
                  <span className="cell-label">{t(`colors.short.${color}`)}</span>
                  {confidence < 0.5 && <span className="confidence-warning">!</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {selectedCell && (
        <div className="color-picker">
          <p>{t('faceInput.pickColor')}</p>
          <div className="color-options">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                className="color-option"
                style={{ backgroundColor: COLOR_HEX[color] }}
                onClick={() => handleColorSelect(color)}
                title={t(`colors.full.${color}`)}
              >
                {t(`colors.full.${color}`)}
              </button>
            ))}
          </div>
          <button className="btn-cancel" onClick={() => setSelectedCell(null)}>{t('faceInput.cancel')}</button>
        </div>
      )}

      <div className="face-actions">
        <label>
          <input
            type="checkbox"
            checked={faceState.isComplete}
            onChange={(e) => {
              if (e.target.checked) {
                onComplete()
              }
            }}
          />
          {t('faceInput.done')}
        </label>
      </div>
    </div>
  )
}
