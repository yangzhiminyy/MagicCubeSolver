/**
 * CubeNetInput 组件
 * 展开图式六面录入界面
 */

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Face, FaceColor } from '../utils/cubeTypes'
import { CubeInputState, FaceInputState } from '../utils/cubeInputConverter'
import SimpleColorPicker from './SimpleColorPicker'
import './CubeNetInput.css'

interface CubeNetInputProps {
  inputState: CubeInputState
  activeFace: Face | null
  onFaceActivate: (face: Face) => void
  onColorChange: (face: Face, row: number, col: number, color: FaceColor) => void
}

// 中心块颜色固定
const CENTER_COLORS: Record<Face, FaceColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'green',
  R: 'blue',
}

// 获取面的颜色十六进制值
const getFaceColorHex = (face: Face): string => {
  const colorMap: Record<Face, string> = {
    U: '#FFFFFF', // white
    D: '#FFEB3B', // yellow
    F: '#F44336', // red
    B: '#FF9800', // orange
    L: '#4CAF50', // green
    R: '#2196F3', // blue
  }
  return colorMap[face]
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

// 颜色循环顺序（已移除，现在使用菜单选择）

function isCenterCell(row: number, col: number): boolean {
  return row === 1 && col === 1
}

interface FaceNetProps {
  face: Face
  faceState: FaceInputState
  isActive: boolean
  onActivate: () => void
  onLongPress: (row: number, col: number, position: { x: number, y: number }) => void
  isMenuOpenForCell?: { face: Face, row: number, col: number } | null // 当前打开菜单的色块信息
}

function FaceNet({ face, faceState, isActive, onActivate, onLongPress, isMenuOpenForCell }: FaceNetProps) {
  const { t } = useTranslation()
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (isCenterCell(row, col)) {
      // 中心块：激活该面
      onActivate()
    } else {
      // 边缘块：打开颜色选择菜单
      // 如果菜单已经打开且是针对这个色块，则关闭菜单
      if (isMenuOpenForCell && isMenuOpenForCell.face === face && 
          isMenuOpenForCell.row === row && isMenuOpenForCell.col === col) {
        onLongPress(row, col, { x: 0, y: 0 })
        return
      }

      // 计算菜单位置
      const cellKey = `${row}-${col}`
      const cellElement = cellRefs.current.get(cellKey)
      if (!cellElement) {
        return
      }

      const rect = cellElement.getBoundingClientRect()
      const menuWidth = 200
      const menuHeight = 140
      const spaceRight = window.innerWidth - rect.right
      const spaceLeft = rect.left
      
      let x: number
      if (spaceRight >= menuWidth + 10) {
        x = rect.right + 10
      } else if (spaceLeft >= menuWidth + 10) {
        x = rect.left - menuWidth - 10
      } else {
        x = (window.innerWidth - menuWidth) / 2
      }

      const y = Math.max(10, Math.min(rect.top - menuHeight / 2, window.innerHeight - menuHeight - 10))

      onLongPress(row, col, { x, y })
    }
  }


  return (
    <div className={`face-net ${isActive ? 'active' : ''}`}>
      <div className="face-label">{t(`faces.${face}`)}</div>
      <div className="face-grid">
        {faceState.colors.map((row, rowIdx) => (
          <div key={rowIdx} className="face-row">
            {row.map((color, colIdx) => {
              const isCenter = isCenterCell(rowIdx, colIdx)
              // 中心块始终显示固定颜色，边缘块显示实际颜色
              const displayColor = isCenter ? CENTER_COLORS[face] : color
              const confidence = faceState.confidence[rowIdx][colIdx]
              const cellKey = `${rowIdx}-${colIdx}`
              
              return (
                <div
                  key={colIdx}
                  ref={el => {
                    if (el) cellRefs.current.set(cellKey, el)
                    else cellRefs.current.delete(cellKey)
                  }}
                  className={`face-cell ${isCenter ? 'center' : 'edge'} ${isCenter && isActive ? 'center-active' : ''}`}
                  style={{ backgroundColor: COLOR_HEX[displayColor] }}
                  onClick={(e) => handleCellClick(rowIdx, colIdx, e)}
                  title={
                    isCenter
                      ? t('cubeNet.titleActivate', { face: t(`faces.${face}`) })
                      : t('cubeNet.titlePickColor', { color: t(`colors.short.${color}`) })
                  }
                >
                  {isCenter ? (
                    <span 
                      className="center-icon"
                      style={{
                        filter: `drop-shadow(0 0 2px ${getFaceColorHex(face)})`,
                        color: getFaceColorHex(face),
                      }}
                    >
                      📷
                    </span>
                  ) : (
                    <span className="cell-label">{t(`colors.short.${displayColor}`)}</span>
                  )}
                  {!isCenter && confidence < 0.5 && (
                    <span className="confidence-warning">!</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {faceState.isComplete && (
        <div className="face-complete-badge">✓</div>
      )}
    </div>
  )
}

export default function CubeNetInput({
  inputState,
  activeFace,
  onFaceActivate,
  onColorChange,
}: CubeNetInputProps) {
  const { t } = useTranslation()
  const completedCount = Object.values(inputState.faces).filter(f => f.isComplete).length
  const [menuCell, setMenuCell] = useState<{ face: Face, row: number, col: number, position: { x: number, y: number } } | null>(null)

  const handleMenuOpen = (face: Face, row: number, col: number, position: { x: number, y: number }) => {
    // 如果菜单已经打开且是针对同一个色块，则关闭菜单
    if (menuCell && 
        menuCell.face === face && 
        menuCell.row === row && 
        menuCell.col === col) {
      setMenuCell(null)
      return
    }
    // 否则打开新菜单
    setMenuCell({ face, row, col, position })
  }

  const handleMenuClose = () => {
    setMenuCell(null)
  }

  return (
    <div className="cube-net-container">
      <div className="cube-net">
        {/* U 面 - 上方 */}
        <FaceNet
          face="U"
          faceState={inputState.faces.U}
          isActive={activeFace === 'U'}
          onActivate={() => onFaceActivate('U')}
          onLongPress={(row, col, position) => handleMenuOpen('U', row, col, position)}
          isMenuOpenForCell={menuCell}
        />

        {/* L, F, R, B 面 - 中间一行 */}
        <FaceNet
          face="L"
          faceState={inputState.faces.L}
          isActive={activeFace === 'L'}
          onActivate={() => onFaceActivate('L')}
          onLongPress={(row, col, position) => handleMenuOpen('L', row, col, position)}
          isMenuOpenForCell={menuCell}
        />
        <FaceNet
          face="F"
          faceState={inputState.faces.F}
          isActive={activeFace === 'F'}
          onActivate={() => onFaceActivate('F')}
          onLongPress={(row, col, position) => handleMenuOpen('F', row, col, position)}
          isMenuOpenForCell={menuCell}
        />
        <FaceNet
          face="R"
          faceState={inputState.faces.R}
          isActive={activeFace === 'R'}
          onActivate={() => onFaceActivate('R')}
          onLongPress={(row, col, position) => handleMenuOpen('R', row, col, position)}
          isMenuOpenForCell={menuCell}
        />
        <FaceNet
          face="B"
          faceState={inputState.faces.B}
          isActive={activeFace === 'B'}
          onActivate={() => onFaceActivate('B')}
          onLongPress={(row, col, position) => handleMenuOpen('B', row, col, position)}
          isMenuOpenForCell={menuCell}
        />

        {/* D 面 - 下方 */}
        <FaceNet
          face="D"
          faceState={inputState.faces.D}
          isActive={activeFace === 'D'}
          onActivate={() => onFaceActivate('D')}
          onLongPress={(row, col, position) => handleMenuOpen('D', row, col, position)}
          isMenuOpenForCell={menuCell}
        />
      </div>
      <div className="cube-net-progress">
        {t('cubeNet.progress', { done: completedCount })}
      </div>
      {menuCell && (
        <SimpleColorPicker
          isVisible={true}
          position={menuCell.position}
          currentFace={menuCell.face}
          onSelect={(color) => {
            onColorChange(menuCell.face, menuCell.row, menuCell.col, color)
            handleMenuClose() // 选择后自动关闭
          }}
          onClose={handleMenuClose}
        />
      )}
    </div>
  )
}
