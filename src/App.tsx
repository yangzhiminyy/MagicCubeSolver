import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import RubiksCube from './components/RubiksCube'
import ControlPanel from './components/ControlPanel'
import { CubeState, Move } from './utils/cubeTypes'
import { createSolvedCube, applyMove } from './utils/cubeLogic'
import './App.css'

function App() {
  const [cubeState, setCubeState] = useState<CubeState>(createSolvedCube())
  const [isAnimating, setIsAnimating] = useState(false)
  const [solution, setSolution] = useState<Move[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [scrambleMoves, setScrambleMoves] = useState<Move[]>([]) // 记录打乱序列
  const [moveHistory, setMoveHistory] = useState<Move[]>([]) // 记录手动操作历史
  const [showCoordinates, setShowCoordinates] = useState({
    U: false,
    D: false,
    F: false,
    B: false,
    L: false,
    R: false,
  })

  const handleScramble = () => {
    if (isAnimating) return
    const moves: Move[] = []
    const moveTypes: Move[] = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"]
    
    for (let i = 0; i < 25; i++) {
      const randomMove = moveTypes[Math.floor(Math.random() * moveTypes.length)]
      moves.push(randomMove)
    }

    let newState = createSolvedCube()
    moves.forEach(move => {
      newState = applyMove(newState, move)
    })
    setCubeState(newState)
    setSolution([])
    setCurrentStep(0)
    setScrambleMoves(moves) // 保存打乱序列
    setMoveHistory([]) // 清空手动操作历史
  }

  const handleSolve = async () => {
    if (isAnimating) return
    
    try {
      setIsAnimating(true)
      
      // 导入求解函数
      const { solveCube } = await import('./utils/cubeConverter')
      
      // 如果有打乱序列或操作历史，使用它们来构建 KPattern（更快）
      const movesToState = scrambleMoves.length > 0 ? scrambleMoves : moveHistory
      
      // 求解魔方
      const solutionMoves = await solveCube(cubeState, movesToState)
      
      if (solutionMoves.length === 0) {
        alert('求解失败：无法从当前状态创建求解模式。\n\n这可能是因为从 CubeState 到 KPattern 的转换尚未完全实现。')
        setSolution([])
        setCurrentStep(0)
      } else {
        setSolution(solutionMoves)
        setCurrentStep(0)
        console.log('求解成功，步骤数:', solutionMoves.length)
        console.log('求解步骤:', solutionMoves.join(' '))
      }
    } catch (error) {
      console.error('求解失败:', error)
      alert('求解功能暂不可用，请查看控制台获取错误详情。\n\n错误: ' + (error instanceof Error ? error.message : String(error)))
      setSolution([])
      setCurrentStep(0)
    } finally {
      setIsAnimating(false)
    }
  }

  const handleMove = (move: Move) => {
    if (isAnimating) return
    setCubeState(prev => applyMove(prev, move))
    setMoveHistory(prev => [...prev, move]) // 记录手动操作
    setScrambleMoves([]) // 清空打乱序列（因为手动操作改变了状态）
  }

  const handleStepForward = () => {
    if (currentStep < solution.length) {
      const move = solution[currentStep]
      handleMove(move)
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleStepBackward = () => {
    if (currentStep > 0) {
      // 需要反向执行上一步
      const move = solution[currentStep - 1]
      const reversedMove = reverseMove(move)
      handleMove(reversedMove)
      setCurrentStep(prev => prev - 1)
    }
  }

  const reverseMove = (move: Move): Move => {
    if (move.endsWith("'")) {
      return move.slice(0, -1) as Move
    } else if (move.endsWith('2')) {
      return move // 2 次旋转的反向还是它自己
    } else {
      return (move + "'") as Move
    }
  }

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <RubiksCube cubeState={cubeState} showCoordinates={showCoordinates} />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={15} />
        </Canvas>
      </div>
      <ControlPanel
        onScramble={handleScramble}
        onSolve={handleSolve}
        onMove={handleMove}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        isAnimating={isAnimating}
        solution={solution}
        currentStep={currentStep}
        showCoordinates={showCoordinates}
        onToggleCoordinate={(face) => {
          setShowCoordinates(prev => ({
            ...prev,
            [face]: !prev[face as keyof typeof prev]
          }))
        }}
      />
    </div>
  )
}

export default App
