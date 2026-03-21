/**
 * ColorCarouselPicker 组件
 * 传送带颜色选择器
 */

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaceColor } from '../utils/cubeTypes'
import './ColorCarouselPicker.css'

interface ColorCarouselPickerProps {
  isVisible: boolean
  position: { x: number, y: number }
  currentColor: FaceColor
  onSelect: (color: FaceColor) => void
  onClose: () => void
  switchTrigger?: number // 外部触发的切换信号
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

export default function ColorCarouselPicker({
  isVisible,
  position,
  currentColor,
  onSelect,
  onClose,
  switchTrigger,
}: ColorCarouselPickerProps) {
  const { t } = useTranslation()
  const [scrollPosition, setScrollPosition] = useState(0)
  const [selectedColor, setSelectedColor] = useState<FaceColor>(currentColor)
  const containerRef = useRef<HTMLDivElement>(null)

  // 初始化：找到当前颜色在列表中的位置
  useEffect(() => {
    if (isVisible) {
      console.log('[ColorCarouselPicker] 初始化，currentColor:', currentColor)
      const currentIndex = COLORS.indexOf(currentColor)
      const itemWidth = 56 // 50px + 6px margin
      const centerOffset = 140 // 280px / 2
      const initialPosition = currentIndex * itemWidth - centerOffset
      setScrollPosition(initialPosition)
      setSelectedColor(currentColor)
      console.log('[ColorCarouselPicker] 初始化完成，currentIndex:', currentIndex, 'initialPosition:', initialPosition)
    }
  }, [isVisible, currentColor])

  // 响应外部切换触发器
  useEffect(() => {
    console.log('[ColorCarouselPicker] switchTrigger 变化:', switchTrigger)
    if (switchTrigger && switchTrigger > 0) {
      console.log('[ColorCarouselPicker] 触发颜色切换')
      handleSwitchColor()
    }
  }, [switchTrigger])

  // 自动滚动动画已移除，现在只通过点击切换颜色

  // 手动切换颜色（点击菜单时）
  const handleSwitchColor = () => {
    console.log('[ColorCarouselPicker] handleSwitchColor 被调用，当前颜色:', selectedColor)
    // 切换到下一个颜色
    const currentIndex = COLORS.indexOf(selectedColor)
    const nextIndex = (currentIndex + 1) % COLORS.length
    const nextColor = COLORS[nextIndex]
    console.log('[ColorCarouselPicker] 切换颜色:', selectedColor, '->', nextColor, '索引:', currentIndex, '->', nextIndex)
    setSelectedColor(nextColor)
    onSelect(nextColor)
    
    // 更新滚动位置以显示新颜色
    const itemWidth = 56
    const centerOffset = 140
    const newPosition = nextIndex * itemWidth - centerOffset
    setScrollPosition(newPosition)
    console.log('[ColorCarouselPicker] 更新滚动位置:', newPosition)
  }

  // 直接选择颜色（点击颜色项）
  const handleColorItemClick = (color: FaceColor) => {
    setSelectedColor(color)
    onSelect(color)
    
    // 更新滚动位置以显示选中的颜色
    const itemWidth = 56
    const centerOffset = 140
    const colorIndex = COLORS.indexOf(color)
    const newPosition = colorIndex * itemWidth - centerOffset
    setScrollPosition(newPosition)
  }

  if (!isVisible) return null

  // 计算传送带需要显示的颜色项（为了无限循环效果，需要重复）
  // 增加数量以确保所有颜色都能正常显示，即使滚动到边界
  const itemsToShow = 50 // 显示50个颜色项，确保有足够的颜色显示
  const allItems: FaceColor[] = []
  for (let i = 0; i < itemsToShow; i++) {
    allItems.push(...COLORS)
  }

  // 移除 document 点击监听，改用关闭按钮

  return (
    <div
      ref={containerRef}
      className="color-carousel-container"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={e => {
        console.log('[ColorCarouselPicker] 菜单容器被点击')
        e.stopPropagation()
        // 点击菜单容器时，切换颜色
        handleSwitchColor()
      }}
    >
        <div className="color-carousel-track">
          <div
            className="color-carousel-items"
            style={{
              transform: `translateX(${-scrollPosition}px)`,
            }}
          >
            {allItems.map((color, index) => {
              const itemWidth = 56 // 50px + 6px margin
              const centerOffset = 140
              // 计算当前项相对于中心的位置
              const itemPosition = index * itemWidth - scrollPosition - centerOffset
              const isSelected = color === selectedColor && Math.abs(itemPosition) < 30
              
              return (
                <div
                  key={index}
                  className={`color-carousel-item ${isSelected ? 'selected' : ''}`}
                  style={{
                    backgroundColor: COLOR_HEX[color],
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleColorItemClick(color)
                  }}
                >
                  <span className="color-name">{t(`colors.short.${color}`)}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="color-carousel-center-indicator"></div>
        <div className="color-carousel-hint">
          {t('colorCarousel.hint')}
        </div>
      <button
        className="color-carousel-close-btn"
        onClick={(e) => {
          e.stopPropagation()
          console.log('[ColorCarouselPicker] 关闭按钮被点击')
          onClose()
        }}
        title={t('colorCarousel.close')}
      >
        ×
      </button>
    </div>
  )
}
