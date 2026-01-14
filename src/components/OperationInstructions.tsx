/**
 * 操作说明组件
 * 显示魔方录入的操作指南
 */

import { useState } from 'react'
import './OperationInstructions.css'

export default function OperationInstructions() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="operation-instructions">
      <button
        className="instructions-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▼' : '▶'} 操作说明
      </button>
      
      {isExpanded && (
        <div className="instructions-content">
          <div className="instruction-section">
            <h4>📷 中心块（激活摄像头）</h4>
            <ul>
              <li>点击中心块：激活该面，打开摄像头预览</li>
              <li>再次点击：识别当前面的颜色（自动识别）</li>
              <li>点击其他面的中心块：切换到该面</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>🎨 边缘块（调整颜色）</h4>
            <ul>
              <li>点击边缘块：打开颜色选择菜单（2x3网格）</li>
              <li>在菜单中点击颜色块：直接选择该颜色，菜单自动关闭</li>
              <li>菜单会根据当前面高亮对应颜色（如U面高亮白色）</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>✅ 完成录入</h4>
            <ul>
              <li>每个面的边缘8个色块都填满后，该面显示 ✓ 标记</li>
              <li>所有6个面都完成后，可以点击"完成录入"按钮</li>
              <li>进度显示在展开图下方：X / 6 已完成</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>💡 提示</h4>
            <ul>
              <li>摄像头预览会自动镜像，方便对齐</li>
              <li>九宫格网格帮助您对齐魔方面</li>
              <li>识别置信度低时会显示 ! 警告</li>
              <li>六个面以展开图形式显示，方便同时查看和录入</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
