import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import RubiksCube from './components/RubiksCube'
import ControlPanel from './components/ControlPanel'
import CameraInputModal from './components/CameraInputModal'
import { Move, CubeState } from './utils/cubeTypes'
import { createSolvedCubieBasedCube, applyMove, cubieBasedStateToFaceColors } from './utils/cubieBasedCubeLogic'
import { CubieBasedCubeState } from './utils/cubeTypes'
import { SolverAlgorithm } from './utils/cubeSolver'
import { AnimationState, getAnimationInfo } from './utils/cubeAnimation'
import './App.css'

function App() {
  const [cubieBasedState, setCubieBasedState] = useState<CubieBasedCubeState>(createSolvedCubieBasedCube())
  // 将CubieBasedCubeState转换为CubeState用于渲染
  const cubeState: CubeState = cubieBasedStateToFaceColors(cubieBasedState)
  const [isAnimating, setIsAnimating] = useState(false)
  const [solution, setSolution] = useState<Move[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [scrambleMoves, setScrambleMoves] = useState<Move[]>([]) // 记录打乱序列
  const [moveHistory, setMoveHistory] = useState<Move[]>([]) // 记录手动操作历史
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SolverAlgorithm>('reverse-moves') // 默认使用反向移动
  const [animationState, setAnimationState] = useState<AnimationState | null>(null)
  const animationStartTimeRef = useRef<number | null>(null)
  const [showCoordinates, setShowCoordinates] = useState({
    U: false,
    D: false,
    F: false,
    B: false,
    L: false,
    R: false,
  })
  const [showCameraModal, setShowCameraModal] = useState(false)

  const handleScramble = () => {
    if (isAnimating) return
    const moves: Move[] = []
    const moveTypes: Move[] = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"]
    
    for (let i = 0; i < 25; i++) {
      const randomMove = moveTypes[Math.floor(Math.random() * moveTypes.length)]
      moves.push(randomMove)
    }

    let newState = createSolvedCubieBasedCube()
    moves.forEach(move => {
      newState = applyMove(newState, move)
    })
    setCubieBasedState(newState)
    setSolution([])
    setCurrentStep(0)
    setScrambleMoves(moves) // 保存打乱序列
    setMoveHistory([]) // 清空手动操作历史
  }

  const handleSolve = async () => {
    if (isAnimating) return
    
    try {
      setIsAnimating(true)
      
      // 导入求解函数（支持多种算法）
      const { solveCube } = await import('./utils/cubeSolver')
      
      // 合并打乱序列和操作历史
      const movesToState: Move[] = []
      if (scrambleMoves.length > 0) {
        movesToState.push(...scrambleMoves)
      }
      if (moveHistory.length > 0) {
        movesToState.push(...moveHistory)
      }
      
      // 使用用户选择的算法
      // 如果选择了 reverse-moves 但没有打乱序列，自动切换到 kociemba
      let algorithm = selectedAlgorithm
      if (algorithm === 'reverse-moves' && movesToState.length === 0) {
        console.log('没有打乱序列，自动切换到 kociemba 算法')
        algorithm = 'kociemba'
      }
      
      // 求解魔方（传入CubieBasedCubeState）
      const solutionMoves = await solveCube(cubieBasedState, algorithm, movesToState.length > 0 ? movesToState : undefined)
      
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

  // 动画循环
  useEffect(() => {
    if (animationState && animationState.isAnimating) {
      const startTime = Date.now()
      animationStartTimeRef.current = startTime
      
      const animate = () => {
        if (!animationState || !animationStartTimeRef.current) return
        
        const elapsed = (Date.now() - animationStartTimeRef.current) / 1000 // 秒
        const duration = Math.abs(animationState.angle) / (Math.PI * 2) * 0.5 // 根据角度计算持续时间（0.5秒转一圈）
        const progress = Math.min(elapsed / duration, 1)
        
        setAnimationState(prev => {
          if (!prev) return null
          return { ...prev, progress }
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // 动画完成，更新状态
          if (animationState.move) {
            setCubieBasedState(prev => applyMove(prev, animationState.move!))
            setMoveHistory(prev => [...prev, animationState.move!])
          }
          setAnimationState(null)
          animationStartTimeRef.current = null
        }
      }
      
      requestAnimationFrame(animate)
    }
  }, [animationState?.isAnimating])
  
  const handleMove = (move: Move) => {
    if (isAnimating || animationState?.isAnimating) return
    
    // 获取动画信息
    const { axis, angle, affectedCubies, rotationCenter } = getAnimationInfo(move)
    
    // 启动动画
    setAnimationState({
      isAnimating: true,
      move,
      progress: 0,
      axis,
      angle,
      affectedCubies,
      rotationCenter,
    })
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

  const handleCameraInput = () => {
    setShowCameraModal(true)
  }

  const handleCameraInputComplete = async (cubeState: CubeState) => {
    try {
      // 将 CubeState 转换为 CubieBasedCubeState
      const { faceColorsToCubieBasedState } = await import('./utils/faceColorsToCubieBased')
      const cubieBasedState = faceColorsToCubieBasedState(cubeState)
      
      // 更新魔方状态
      setCubieBasedState(cubieBasedState)
      setSolution([])
      setCurrentStep(0)
      setScrambleMoves([])
      setMoveHistory([])
      
      console.log('摄像头录入完成，已更新魔方状态')
      setShowCameraModal(false)
    } catch (error) {
      console.error('摄像头录入完成处理失败:', error)
      alert('处理录入数据时出错: ' + (error instanceof Error ? error.message : String(error)))
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
          <RubiksCube cubeState={cubeState} animationState={animationState} showCoordinates={showCoordinates} />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={15} />
        </Canvas>
      </div>
      <ControlPanel
        onScramble={handleScramble}
        onSolve={handleSolve}
        onMove={handleMove}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onCameraInput={handleCameraInput}
        isAnimating={isAnimating}
        solution={solution}
        currentStep={currentStep}
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={setSelectedAlgorithm}
        showCoordinates={showCoordinates}
        onToggleCoordinate={(face) => {
          setShowCoordinates(prev => ({
            ...prev,
            [face]: !prev[face as keyof typeof prev]
          }))
        }}
      />
      
      <CameraInputModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onComplete={handleCameraInputComplete}
      />
    </div>
  )
}

export default App
