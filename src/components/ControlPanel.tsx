import { useTranslation } from 'react-i18next'
import { Move } from '../utils/cubeTypes'
import { SolverAlgorithm } from '../utils/cubeSolver'
import LanguageSwitcher from './LanguageSwitcher'
import './ControlPanel.css'

interface ControlPanelProps {
  onScramble: () => void
  onSolve: () => void
  onMove: (move: Move) => void
  onStepForward: () => void
  onStepBackward: () => void
  onCameraInput: () => void
  isAnimating: boolean
  solution: Move[]
  currentStep: number
  selectedAlgorithm: SolverAlgorithm
  onAlgorithmChange: (algorithm: SolverAlgorithm) => void
  showCoordinates: {
    U: boolean
    D: boolean
    F: boolean
    B: boolean
    L: boolean
    R: boolean
  }
  onToggleCoordinate: (face: 'U' | 'D' | 'F' | 'B' | 'L' | 'R') => void
}

export default function ControlPanel({
  onScramble,
  onSolve,
  onMove,
  onStepForward,
  onStepBackward,
  onCameraInput,
  isAnimating,
  solution,
  currentStep,
  selectedAlgorithm,
  onAlgorithmChange,
  showCoordinates,
  onToggleCoordinate,
}: ControlPanelProps) {
  const { t } = useTranslation()
  const moves: Move[] = [
    'R', "R'", 'R2',
    'L', "L'", 'L2',
    'U', "U'", 'U2',
    'D', "D'", 'D2',
    'F', "F'", 'F2',
    'B', "B'", 'B2',
  ]

  return (
    <div className="control-panel">
      <LanguageSwitcher />
      <div className="panel-section">
        <h2>{t('control.title')}</h2>
        <div className="button-group">
          <button 
            className="btn btn-primary" 
            onClick={onScramble}
            disabled={isAnimating}
          >
            {t('control.scramble')}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSolve}
            disabled={isAnimating}
          >
            {t('control.solve')}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onCameraInput}
            disabled={isAnimating}
            title={t('control.cameraTitle')}
          >
            📷 {t('control.cameraInput')}
          </button>
        </div>
        
        <div className="algorithm-selector">
          <label htmlFor="algorithm-select">{t('control.algorithmLabel')}</label>
          <select
            id="algorithm-select"
            value={selectedAlgorithm}
            onChange={(e) => onAlgorithmChange(e.target.value as SolverAlgorithm)}
            disabled={isAnimating}
            className="algorithm-select"
          >
            <option value="reverse-moves">{t('control.algoReverse')}</option>
            <option value="kociemba">{t('control.algoKociemba')}</option>
            <option value="thistlethwaite">{t('control.algoThistle')}</option>
            <option value="ida-star">{t('control.algoIda')}</option>
          </select>
        </div>
      </div>

      <div className="panel-section">
        <h3>{t('control.manualOps')}</h3>
        <div className="move-buttons">
          {moves.map((move) => (
            <button
              key={move}
              className="btn btn-move"
              onClick={() => onMove(move)}
              disabled={isAnimating}
            >
              {move}
            </button>
          ))}
        </div>
      </div>

      {solution.length > 0 && (
        <div className="panel-section">
          <h3>{t('control.solutionSteps')}</h3>
          <div className="solution-info">
            <p>{t('control.totalMoves', { count: solution.length })}</p>
            <p>{t('control.currentStep', { current: currentStep, total: solution.length })}</p>
          </div>
          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={onStepBackward}
              disabled={isAnimating || currentStep === 0}
            >
              {t('control.prevStep')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={onStepForward}
              disabled={isAnimating || currentStep >= solution.length}
            >
              {t('control.nextStep')}
            </button>
          </div>
          <div className="solution-steps">
            <div className="steps-list">
              {solution.map((move, index) => (
                <span
                  key={index}
                  className={`step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
                >
                  {move}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="panel-section">
        <h3>{t('control.coords')}</h3>
        <div className="coordinate-controls">
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.U}
              onChange={() => onToggleCoordinate('U')}
            />
            <span>{t('control.coordU')}</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.D}
              onChange={() => onToggleCoordinate('D')}
            />
            <span>{t('control.coordD')}</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.F}
              onChange={() => onToggleCoordinate('F')}
            />
            <span>{t('control.coordF')}</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.B}
              onChange={() => onToggleCoordinate('B')}
            />
            <span>{t('control.coordB')}</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.L}
              onChange={() => onToggleCoordinate('L')}
            />
            <span>{t('control.coordL')}</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.R}
              onChange={() => onToggleCoordinate('R')}
            />
            <span>{t('control.coordR')}</span>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3>{t('control.tips')}</h3>
        <ul className="tips">
          <li>{t('control.tipDrag')}</li>
          <li>{t('control.tipZoom')}</li>
          <li>{t('control.tipButtons')}</li>
        </ul>
      </div>
    </div>
  )
}
