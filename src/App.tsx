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
  }

  const handleSolve = async () => {
    if (isAnimating) return
    
    try {
      setIsAnimating(true)
      // TODO: 集成cubing库的求解功能
      // cubing库的API需要进一步研究，暂时显示提示信息
      alert('求解功能开发中，cubing库API集成需要进一步配置。\n\n您可以先使用手动操作按钮来还原魔方。')
      setSolution([])
      setCurrentStep(0)
    } catch (error) {
      console.error('求解失败:', error)
      alert('求解功能暂不可用，请查看控制台获取错误详情。')
    } finally {
      setIsAnimating(false)
    }
  }

  const handleMove = (move: Move) => {
    if (isAnimating) return
    setCubeState(prev => applyMove(prev, move))
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
