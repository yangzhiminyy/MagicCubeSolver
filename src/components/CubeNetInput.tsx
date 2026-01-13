/**
 * CubeNetInput 组件
 * 展开图式六面录入界面
 */

import { useState, useRef } from 'react'
import { Face, FaceColor } from '../utils/cubeTypes'
import { CubeInputState, FaceInputState } from '../utils/cubeInputConverter'
import ColorCarouselPicker from './ColorCarouselPicker'
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

const FACE_LABELS: Record<Face, string> = {
  U: '上 (U)',
  D: '下 (D)',
  F: '前 (F)',
  B: '后 (B)',
  L: '左 (L)',
  R: '右 (R)',
}

const COLOR_NAMES: Record<FaceColor, string> = {
  white: '白',
  yellow: '黄',
  red: '红',
  orange: '橙',
  green: '绿',
  blue: '蓝',
  black: '未',
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

// 颜色循环顺序
const COLOR_CYCLE: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue']

function cycleColor(currentColor: FaceColor): FaceColor {
  const index = COLOR_CYCLE.indexOf(currentColor)
  if (index === -1) return COLOR_CYCLE[0]
  return COLOR_CYCLE[(index + 1) % COLOR_CYCLE.length]
}

function isCenterCell(row: number, col: number): boolean {
  return row === 1 && col === 1
}

interface FaceNetProps {
  face: Face
  faceState: FaceInputState
  isActive: boolean
  onActivate: () => void
  onColorChange: (row: number, col: number, color: FaceColor) => void
  onLongPress: (row: number, col: number, position: { x: number, y: number }) => void
  isMenuOpenRef: React.MutableRefObject<boolean>
}

function FaceNet({ face, faceState, isActive, onActivate, onColorChange, onLongPress, isMenuOpenRef }: FaceNetProps) {
  const longPressTimeoutRef = useRef<number | null>(null)
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const handleCellClick = (row: number, col: number, currentColor: FaceColor) => {
    // 如果菜单已打开，点击不应该触发颜色切换
    if (isMenuOpenRef.current) {
      return
    }
    
    if (isCenterCell(row, col)) {
      // 中心块：激活该面
      onActivate()
    } else {
      // 边缘块：循环切换颜色
      const newColor = cycleColor(currentColor)
      onColorChange(row, col, newColor)
    }
  }

  const handleCellMouseDown = (row: number, col: number) => {
    if (isCenterCell(row, col)) return

    const cellKey = `${row}-${col}`
    const cellElement = cellRefs.current.get(cellKey)
    if (!cellElement) return

    const rect = cellElement.getBoundingClientRect()
    // 计算位置：在色块右侧显示，如果右侧空间不够则在左侧
    const menuWidth = 280
    const menuHeight = 80
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left
    
    let x: number
    if (spaceRight >= menuWidth + 10) {
      // 右侧有足够空间，显示在右侧
      x = rect.right + 10
    } else if (spaceLeft >= menuWidth + 10) {
      // 左侧有足够空间，显示在左侧
      x = rect.left - menuWidth - 10
    } else {
      // 两侧空间都不够，居中显示
      x = rect.left + rect.width / 2 - menuWidth / 2
    }
    
    // 垂直位置：在色块上方，如果上方空间不够则在下方
    const spaceTop = rect.top
    const spaceBottom = window.innerHeight - rect.bottom
    let y: number
    if (spaceTop >= menuHeight + 10) {
      y = rect.top - menuHeight - 10
    } else if (spaceBottom >= menuHeight + 10) {
      y = rect.bottom + 10
    } else {
      y = rect.top + rect.height / 2 - menuHeight / 2
    }
    
    const position = { x, y }

    longPressTimeoutRef.current = setTimeout(() => {
      onLongPress(row, col, position)
    }, 500) // 500ms 长按
  }

  const handleCellMouseUp = () => {
    if (longPressTimeoutRef.current !== null) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
    // 如果菜单还没打开，就不需要关闭
    // 菜单打开后，只有点击 overlay 才会关闭
  }

  const handleCellMouseLeave = () => {
    // 如果菜单还没打开，取消长按
    if (longPressTimeoutRef.current !== null) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
    // 如果菜单已打开，鼠标离开不应该关闭菜单
  }


  return (
    <div className={`face-net ${isActive ? 'active' : ''}`}>
      <div className="face-label">{FACE_LABELS[face]}</div>
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
                  onClick={() => handleCellClick(rowIdx, colIdx, color)}
                  onMouseDown={() => !isCenter && handleCellMouseDown(rowIdx, colIdx)}
                  onMouseUp={handleCellMouseUp}
                  onMouseLeave={handleCellMouseLeave}
                  onTouchStart={(e) => {
                    if (!isCenter) {
                      e.preventDefault()
                      handleCellMouseDown(rowIdx, colIdx)
                    }
                  }}
                  onTouchEnd={handleCellMouseUp}
                  title={isCenter ? `点击激活${FACE_LABELS[face]}` : `${COLOR_NAMES[color]} (长按选择)`}
                >
                  {isCenter ? (
                    <span className="center-icon">📷</span>
                  ) : (
                    <span className="cell-label">{COLOR_NAMES[displayColor]}</span>
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
  const completedCount = Object.values(inputState.faces).filter(f => f.isComplete).length
  const [globalLongPressCell, setGlobalLongPressCell] = useState<{ face: Face, row: number, col: number, position: { x: number, y: number } } | null>(null)
  const isMenuOpenRef = useRef(false) // 全局菜单状态

  const handleLongPress = (face: Face, row: number, col: number, position: { x: number, y: number }) => {
    setGlobalLongPressCell({ face, row, col, position })
    isMenuOpenRef.current = true
  }

  const handleMenuClose = () => {
    setGlobalLongPressCell(null)
    isMenuOpenRef.current = false
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
          onColorChange={(row, col, color) => onColorChange('U', row, col, color)}
          onLongPress={(row, col, position) => handleLongPress('U', row, col, position)}
          isMenuOpenRef={isMenuOpenRef}
        />

        {/* L, F, R, B 面 - 中间一行 */}
        <FaceNet
          face="L"
          faceState={inputState.faces.L}
          isActive={activeFace === 'L'}
          onActivate={() => onFaceActivate('L')}
          onColorChange={(row, col, color) => onColorChange('L', row, col, color)}
          onLongPress={(row, col, position) => handleLongPress('L', row, col, position)}
          isMenuOpenRef={isMenuOpenRef}
        />
        <FaceNet
          face="F"
          faceState={inputState.faces.F}
          isActive={activeFace === 'F'}
          onActivate={() => onFaceActivate('F')}
          onColorChange={(row, col, color) => onColorChange('F', row, col, color)}
          onLongPress={(row, col, position) => handleLongPress('F', row, col, position)}
          isMenuOpenRef={isMenuOpenRef}
        />
        <FaceNet
          face="R"
          faceState={inputState.faces.R}
          isActive={activeFace === 'R'}
          onActivate={() => onFaceActivate('R')}
          onColorChange={(row, col, color) => onColorChange('R', row, col, color)}
          onLongPress={(row, col, position) => handleLongPress('R', row, col, position)}
          isMenuOpenRef={isMenuOpenRef}
        />
        <FaceNet
          face="B"
          faceState={inputState.faces.B}
          isActive={activeFace === 'B'}
          onActivate={() => onFaceActivate('B')}
          onColorChange={(row, col, color) => onColorChange('B', row, col, color)}
          onLongPress={(row, col, position) => handleLongPress('B', row, col, position)}
          isMenuOpenRef={isMenuOpenRef}
        />

        {/* D 面 - 下方 */}
        <FaceNet
          face="D"
          faceState={inputState.faces.D}
          isActive={activeFace === 'D'}
          onActivate={() => onFaceActivate('D')}
          onColorChange={(row, col, color) => onColorChange('D', row, col, color)}
          onLongPress={(row, col, position) => handleLongPress('D', row, col, position)}
          isMenuOpenRef={isMenuOpenRef}
        />
      </div>
      <div className="cube-net-progress">
        进度: {completedCount} / 6 已完成
      </div>
      {globalLongPressCell && (
        <ColorCarouselPicker
          isVisible={true}
          position={globalLongPressCell.position}
          currentColor={inputState.faces[globalLongPressCell.face].colors[globalLongPressCell.row][globalLongPressCell.col]}
          onSelect={(color) => onColorChange(globalLongPressCell.face, globalLongPressCell.row, globalLongPressCell.col, color)}
          onClose={handleMenuClose}
        />
      )}
    </div>
  )
}
