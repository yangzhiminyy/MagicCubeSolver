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
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    console.log('[FaceNet] handleCellClick:', { face, row, col, isCenter: isCenterCell(row, col), isMenuOpenForCell })
    
    // 无论什么情况，都先阻止事件冒泡，避免触发 overlay 的关闭
    e.stopPropagation()
    e.preventDefault() // 也阻止默认行为
    
    if (isCenterCell(row, col)) {
      // 中心块：激活该面
      console.log('[FaceNet] 中心块点击，激活该面')
      onActivate()
    } else {
      // 如果菜单已经打开且是针对这个色块，只切换颜色
      if (isMenuOpenForCell && isMenuOpenForCell.face === face && 
          isMenuOpenForCell.row === row && isMenuOpenForCell.col === col) {
        console.log('[FaceNet] 菜单已打开且针对同一色块，切换颜色')
        // 直接触发切换，不需要重新计算位置
        const cellKey = `${row}-${col}`
        const cellElement = cellRefs.current.get(cellKey)
        if (!cellElement) {
          console.log('[FaceNet] 无法找到 cellElement')
          return
        }

        const rect = cellElement.getBoundingClientRect()
        const menuWidth = 280
        const menuHeight = 80
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

        console.log('[FaceNet] 调用 onLongPress 切换颜色，位置:', { x, y })
        onLongPress(row, col, { x, y })
        return
      }

      // 否则正常打开菜单
      console.log('[FaceNet] 打开新菜单')
      const cellKey = `${row}-${col}`
      const cellElement = cellRefs.current.get(cellKey)
      if (!cellElement) {
        console.log('[FaceNet] 无法找到 cellElement')
        return
      }

      const rect = cellElement.getBoundingClientRect()
      // 计算位置：在色块右侧显示，如果右侧空间不够则在左侧
      const menuWidth = 280
      const menuHeight = 80
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

      console.log('[FaceNet] 调用 onLongPress 打开菜单，位置:', { x, y })
      onLongPress(row, col, { x, y })
    }
  }

  // 长按逻辑已移除，现在单击就打开菜单（在 handleCellClick 中处理）


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
                  onClick={(e) => handleCellClick(rowIdx, colIdx, e)}
                  title={isCenter ? `点击激活${FACE_LABELS[face]}` : `${COLOR_NAMES[color]} (单击选择颜色)`}
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

  const [menuSwitchTrigger, setMenuSwitchTrigger] = useState(0) // 用于触发菜单内的颜色切换

  const handleLongPress = (face: Face, row: number, col: number, position: { x: number, y: number }) => {
    console.log('[CubeNetInput] handleLongPress:', { face, row, col, position, globalLongPressCell })
    
    // 如果菜单已经打开且是针对同一个色块，则触发颜色切换而不是重新打开菜单
    if (globalLongPressCell && 
        globalLongPressCell.face === face && 
        globalLongPressCell.row === row && 
        globalLongPressCell.col === col) {
      // 菜单已经打开，触发颜色切换
      console.log('[CubeNetInput] 菜单已打开且针对同一色块，触发颜色切换')
      setMenuSwitchTrigger(prev => {
        const newValue = prev + 1
        console.log('[CubeNetInput] 更新 switchTrigger:', prev, '->', newValue)
        return newValue
      })
      return
    }
    // 否则打开新菜单
    console.log('[CubeNetInput] 打开新菜单')
    setGlobalLongPressCell({ face, row, col, position })
    isMenuOpenRef.current = true
    setMenuSwitchTrigger(0) // 重置切换触发器
    console.log('[CubeNetInput] 菜单状态已更新，globalLongPressCell:', { face, row, col, position })
  }

  const handleMenuClose = () => {
    console.log('[CubeNetInput] handleMenuClose 被调用')
    setGlobalLongPressCell(null)
    isMenuOpenRef.current = false
    console.log('[CubeNetInput] 菜单已关闭')
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
          onLongPress={(row, col, position) => handleLongPress('U', row, col, position)}
          isMenuOpenForCell={globalLongPressCell}
        />

        {/* L, F, R, B 面 - 中间一行 */}
        <FaceNet
          face="L"
          faceState={inputState.faces.L}
          isActive={activeFace === 'L'}
          onActivate={() => onFaceActivate('L')}
          onLongPress={(row, col, position) => handleLongPress('L', row, col, position)}
          isMenuOpenForCell={globalLongPressCell}
        />
        <FaceNet
          face="F"
          faceState={inputState.faces.F}
          isActive={activeFace === 'F'}
          onActivate={() => onFaceActivate('F')}
          onLongPress={(row, col, position) => handleLongPress('F', row, col, position)}
          isMenuOpenForCell={globalLongPressCell}
        />
        <FaceNet
          face="R"
          faceState={inputState.faces.R}
          isActive={activeFace === 'R'}
          onActivate={() => onFaceActivate('R')}
          onLongPress={(row, col, position) => handleLongPress('R', row, col, position)}
          isMenuOpenForCell={globalLongPressCell}
        />
        <FaceNet
          face="B"
          faceState={inputState.faces.B}
          isActive={activeFace === 'B'}
          onActivate={() => onFaceActivate('B')}
          onLongPress={(row, col, position) => handleLongPress('B', row, col, position)}
          isMenuOpenForCell={globalLongPressCell}
        />

        {/* D 面 - 下方 */}
        <FaceNet
          face="D"
          faceState={inputState.faces.D}
          isActive={activeFace === 'D'}
          onActivate={() => onFaceActivate('D')}
          onLongPress={(row, col, position) => handleLongPress('D', row, col, position)}
          isMenuOpenForCell={globalLongPressCell}
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
          switchTrigger={menuSwitchTrigger} // 传递切换触发器
        />
      )}
    </div>
  )
}
