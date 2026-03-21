/**
 * SimpleColorPicker 组件
 * 简化的 2x3 网格颜色选择器
 */

import { useTranslation } from 'react-i18next'
import { Face, FaceColor } from '../utils/cubeTypes'
import './SimpleColorPicker.css'

interface SimpleColorPickerProps {
  isVisible: boolean
  position: { x: number, y: number }
  currentFace: Face  // 用于确定初始高亮
  onSelect: (color: FaceColor) => void
  onClose: () => void
}

const COLORS: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue']

const COLOR_HEX: Record<FaceColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFEB3B',
  red: '#F44336',
  orange: '#FF9800',
  green: '#4CAF50',
  blue: '#2196F3',
  black: '#333333',
}

// 根据面确定初始颜色
const getInitialColor = (face: Face): FaceColor => {
  const faceColorMap: Record<Face, FaceColor> = {
    U: 'white',
    D: 'yellow',
    F: 'red',
    B: 'orange',
    L: 'green',
    R: 'blue',
  }
  return faceColorMap[face]
}

// 判断是否为初始高亮颜色
const isInitialHighlight = (color: FaceColor, face: Face): boolean => {
  return color === getInitialColor(face)
}

export default function SimpleColorPicker({
  isVisible,
  position,
  currentFace,
  onSelect,
  onClose,
}: SimpleColorPickerProps) {
  const { t } = useTranslation()
  if (!isVisible) return null

  const handleColorClick = (color: FaceColor) => {
    onSelect(color)
    onClose()  // 自动关闭
  }

  return (
    <div
      className="simple-color-picker-container"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="simple-color-picker-grid">
        {COLORS.map((color) => {
          const isHighlight = isInitialHighlight(color, currentFace)
          return (
            <div
              key={color}
              className={`simple-color-picker-item ${isHighlight ? 'initial-highlight' : ''}`}
              style={{
                backgroundColor: COLOR_HEX[color],
              }}
              onClick={() => handleColorClick(color)}
              title={t(`colors.short.${color}`)}
            >
              <span className="color-name">{t(`colors.short.${color}`)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
