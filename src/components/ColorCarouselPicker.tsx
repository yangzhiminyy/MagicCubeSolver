/**
 * ColorCarouselPicker 组件
 * 传送带颜色选择器
 */

import { useEffect, useRef, useState } from 'react'
import { FaceColor } from '../utils/cubeTypes'
import './ColorCarouselPicker.css'

interface ColorCarouselPickerProps {
  isVisible: boolean
  position: { x: number, y: number }
  currentColor: FaceColor
  onSelect: (color: FaceColor) => void
  onClose: () => void
}

const COLORS: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue']

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

export default function ColorCarouselPicker({
  isVisible,
  position,
  currentColor,
  onSelect,
  onClose,
}: ColorCarouselPickerProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [selectedColor, setSelectedColor] = useState<FaceColor>(currentColor)
  const [isPaused, setIsPaused] = useState(false)
  const animationRef = useRef<number>()
  const containerRef = useRef<HTMLDivElement>(null)

  // 初始化：找到当前颜色在列表中的位置
  useEffect(() => {
    if (isVisible) {
      const currentIndex = COLORS.indexOf(currentColor)
      const itemWidth = 56 // 50px + 6px margin
      const centerOffset = 140 // 280px / 2
      const initialPosition = currentIndex * itemWidth - centerOffset
      setScrollPosition(initialPosition)
      setSelectedColor(currentColor)
      setIsPaused(false) // 重新打开时恢复滚动
    } else {
      // 当不可见时，停止动画并重置
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
      setIsPaused(false)
    }
  }, [isVisible, currentColor])

  // 滚动动画
  useEffect(() => {
    if (!isVisible || isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
      return
    }

    const animate = () => {
      setScrollPosition(prev => {
        const newPosition = prev + 3 // 加快滚动速度：每次滚动3px
        const itemWidth = 56 // 50px + 6px margin
        const centerOffset = 140 // 280px / 2
        
        // 计算当前选中的颜色索引
        const index = Math.floor((newPosition + centerOffset) / itemWidth) % COLORS.length
        const normalizedIndex = index < 0 ? COLORS.length + index : index
        const newSelectedColor = COLORS[normalizedIndex]
        
        if (newSelectedColor !== selectedColor) {
          setSelectedColor(newSelectedColor)
          onSelect(newSelectedColor) // 实时更新颜色
        }
        
        return newPosition
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
    }
  }, [isVisible, isPaused, selectedColor, onSelect])

  // 监听鼠标/触摸事件，松开时暂停
  useEffect(() => {
    if (!isVisible) {
      setIsPaused(false)
      return
    }

    // 菜单刚显示时，先滚动一段时间（比如1秒），然后暂停
    const autoPauseTimer = setTimeout(() => {
      setIsPaused(true)
    }, 1000) // 1秒后自动暂停

    const handleMouseUp = () => {
      setIsPaused(true) // 松开时立即暂停
    }

    const handleTouchEnd = () => {
      setIsPaused(true) // 松开时立即暂停
    }

    // 监听全局事件
    window.addEventListener('mouseup', handleMouseUp, { once: true })
    window.addEventListener('touchend', handleTouchEnd, { once: true })

    return () => {
      clearTimeout(autoPauseTimer)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isVisible])

  if (!isVisible) return null

  // 计算传送带需要显示的颜色项（为了无限循环效果，需要重复）
  const itemsToShow = 20 // 显示20个颜色项
  const allItems: FaceColor[] = []
  for (let i = 0; i < itemsToShow; i++) {
    allItems.push(...COLORS)
  }

  return (
    <div
      className="color-carousel-overlay"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="color-carousel-container"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={e => e.stopPropagation()}
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
              const isSelected = color === selectedColor && 
                Math.abs((index * itemWidth - scrollPosition - centerOffset) % (COLORS.length * itemWidth)) < 30
              
              return (
                <div
                  key={index}
                  className={`color-carousel-item ${isSelected ? 'selected' : ''}`}
                  style={{
                    backgroundColor: COLOR_HEX[color],
                  }}
                >
                  <span className="color-name">{COLOR_NAMES[color]}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="color-carousel-center-indicator"></div>
        <div className="color-carousel-hint">
          松开确定选择
        </div>
      </div>
    </div>
  )
}
