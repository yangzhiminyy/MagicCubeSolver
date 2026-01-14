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
              <li>第一次点击：激活该面，打开摄像头预览</li>
              <li>再次点击：识别当前面的颜色（自动识别）</li>
              <li>点击其他面的中心块：切换到该面</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>🎨 边缘块（调整颜色）</h4>
            <ul>
              <li>单击：循环切换颜色（黑 → 白 → 黄 → 红 → 橙 → 绿 → 蓝 → 黑）</li>
              <li>长按：打开颜色选择器（传送带菜单）</li>
              <li>在菜单中点击：切换颜色或直接选择</li>
              <li>点击菜单外：关闭菜单</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>✅ 完成录入</h4>
            <ul>
              <li>每个面的边缘8个色块都填满后，该面显示 ✓ 标记</li>
              <li>所有6个面都完成后，可以点击"完成录入"按钮</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>💡 提示</h4>
            <ul>
              <li>摄像头预览会自动镜像，方便对齐</li>
              <li>九宫格网格帮助您对齐魔方面</li>
              <li>识别置信度低时会显示 ! 警告</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
