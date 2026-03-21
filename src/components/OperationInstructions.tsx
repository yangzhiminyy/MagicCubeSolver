/**
 * 操作说明组件
 * 显示魔方录入的操作指南
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './OperationInstructions.css'

export default function OperationInstructions() {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="operation-instructions">
      <button
        className="instructions-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▼' : '▶'} {t('instructions.toggle')}
      </button>
      
      {isExpanded && (
        <div className="instructions-content">
          <div className="instruction-section">
            <h4>{t('instructions.centerTitle')}</h4>
            <ul>
              <li>{t('instructions.center1')}</li>
              <li>{t('instructions.center2')}</li>
              <li>{t('instructions.center3')}</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>{t('instructions.edgeTitle')}</h4>
            <ul>
              <li>{t('instructions.edge1')}</li>
              <li>{t('instructions.edge2')}</li>
              <li>{t('instructions.edge3')}</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>{t('instructions.doneTitle')}</h4>
            <ul>
              <li>{t('instructions.done1')}</li>
              <li>{t('instructions.done2')}</li>
              <li>{t('instructions.done3')}</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>{t('instructions.tipsTitle')}</h4>
            <ul>
              <li>{t('instructions.tip1')}</li>
              <li>{t('instructions.tip2')}</li>
              <li>{t('instructions.tip3')}</li>
              <li>{t('instructions.tip4')}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
