/**
 * FaceInput 组件
 * 用于手动调整单个魔方面的颜色（3x3网格）
 */

import { useState } from 'react'
import { FaceColor, Face } from '../utils/cubeTypes'
import { FaceInputState } from '../utils/cubeInputConverter'
import './FaceInput.css'

interface FaceInputProps {
  faceState: FaceInputState
  onColorChange: (row: number, col: number, color: FaceColor) => void
  onComplete: () => void
}

const FACE_LABELS: Record<Face, string> = {
  U: '上 (U)',
  D: '下 (D)',
  F: '前 (F)',
  B: '后 (B)',
  L: '左 (L)',
  R: '右 (R)',
}

const COLOR_OPTIONS: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue', 'black']

const COLOR_NAMES: Record<FaceColor, string> = {
  white: '白色',
  yellow: '黄色',
  red: '红色',
  orange: '橙色',
  green: '绿色',
  blue: '蓝色',
  black: '未设置',
}

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
      <h3>{FACE_LABELS[faceState.face]}</h3>
      
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
                  title={`${COLOR_NAMES[color]} (置信度: ${(confidence * 100).toFixed(0)}%)`}
                >
                  <span className="cell-label">{COLOR_NAMES[color].charAt(0)}</span>
                  {confidence < 0.5 && <span className="confidence-warning">!</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {selectedCell && (
        <div className="color-picker">
          <p>选择颜色:</p>
          <div className="color-options">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                className="color-option"
                style={{ backgroundColor: COLOR_HEX[color] }}
                onClick={() => handleColorSelect(color)}
                title={COLOR_NAMES[color]}
              >
                {COLOR_NAMES[color]}
              </button>
            ))}
          </div>
          <button className="btn-cancel" onClick={() => setSelectedCell(null)}>取消</button>
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
          已完成录入
        </label>
      </div>
    </div>
  )
}
