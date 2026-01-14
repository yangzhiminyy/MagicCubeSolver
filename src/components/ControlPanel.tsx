import { Move } from '../utils/cubeTypes'
import { SolverAlgorithm } from '../utils/cubeSolver'
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
      <div className="panel-section">
        <h2>魔方控制</h2>
        <div className="button-group">
          <button 
            className="btn btn-primary" 
            onClick={onScramble}
            disabled={isAnimating}
          >
            打乱
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSolve}
            disabled={isAnimating}
          >
            求解
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onCameraInput}
            disabled={isAnimating}
            title="使用摄像头录入魔方状态"
          >
            📷 摄像头录入
          </button>
        </div>
        
        <div className="algorithm-selector">
          <label htmlFor="algorithm-select">求解算法：</label>
          <select
            id="algorithm-select"
            value={selectedAlgorithm}
            onChange={(e) => onAlgorithmChange(e.target.value as SolverAlgorithm)}
            disabled={isAnimating}
            className="algorithm-select"
          >
            <option value="reverse-moves">反向移动（最快，需打乱序列）</option>
            <option value="kociemba">Kociemba（快速，两阶段算法）</option>
            <option value="thistlethwaite">Thistlethwaite（四阶段算法）</option>
            <option value="ida-star">IDA*（较慢，最优解）</option>
          </select>
        </div>
      </div>

      <div className="panel-section">
        <h3>手动操作</h3>
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
          <h3>求解步骤</h3>
          <div className="solution-info">
            <p>总步数: {solution.length}</p>
            <p>当前步: {currentStep} / {solution.length}</p>
          </div>
          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={onStepBackward}
              disabled={isAnimating || currentStep === 0}
            >
              上一步
            </button>
            <button
              className="btn btn-secondary"
              onClick={onStepForward}
              disabled={isAnimating || currentStep >= solution.length}
            >
              下一步
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
        <h3>坐标显示</h3>
        <div className="coordinate-controls">
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.U}
              onChange={() => onToggleCoordinate('U')}
            />
            <span>U面（上）</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.D}
              onChange={() => onToggleCoordinate('D')}
            />
            <span>D面（下）</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.F}
              onChange={() => onToggleCoordinate('F')}
            />
            <span>F面（前）</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.B}
              onChange={() => onToggleCoordinate('B')}
            />
            <span>B面（后）</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.L}
              onChange={() => onToggleCoordinate('L')}
            />
            <span>L面（左）</span>
          </label>
          <label className="coordinate-switch">
            <input
              type="checkbox"
              checked={showCoordinates.R}
              onChange={() => onToggleCoordinate('R')}
            />
            <span>R面（右）</span>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3>操作提示</h3>
        <ul className="tips">
          <li>鼠标左键拖拽：旋转视角</li>
          <li>鼠标滚轮：缩放</li>
          <li>点击按钮：旋转魔方</li>
        </ul>
      </div>
    </div>
  )
}
