import { CubeState, Move } from './cubeTypes'
import { createSolvedCube, applyMove } from './cubeLogic'
import { solveByThistlethwaite as thistlethwaiteSolve } from './thistlethwaite'

// 求解算法类型
export type SolverAlgorithm = 'kociemba' | 'ida-star' | 'reverse-moves' | 'thistlethwaite'

/**
 * 使用反向移动序列求解（最简单的方法）
 * 如果知道打乱序列，直接反向即可
 */
export function solveByReverseMoves(movesToState: Move[]): Move[] {
  if (!movesToState || movesToState.length === 0) {
    return []
  }
  
  // 反向移动序列，并反转每个移动的方向
  const reversed: Move[] = []
  for (let i = movesToState.length - 1; i >= 0; i--) {
    const move = movesToState[i]
    // 反转移动方向
    if (move.endsWith("'")) {
      // R' -> R
      reversed.push(move.slice(0, -1) as Move)
    } else if (move.endsWith('2')) {
      // R2 -> R2 (180度旋转，反向还是自己)
      reversed.push(move)
    } else {
      // R -> R'
      reversed.push((move + "'") as Move)
    }
  }
  
  return reversed
}

/**
 * 简单的 IDA* 算法求解
 * 使用迭代加深的 A* 搜索
 */
export function solveByIDAStar(cubeState: CubeState, maxDepth: number = 20): Move[] {
  const solvedState = createSolvedCube()
  
  // 检查是否已解决
  if (JSON.stringify(cubeState) === JSON.stringify(solvedState)) {
    return []
  }
  
  // 所有可能的移动
  const allMoves: Move[] = [
    'R', "R'", 'R2',
    'L', "L'", 'L2',
    'U', "U'", 'U2',
    'D', "D'", 'D2',
    'F', "F'", 'F2',
    'B', "B'", 'B2',
  ]
  
  // 启发式函数：估计到目标状态的距离
  function heuristic(state: CubeState): number {
    // 简单的启发式：计算有多少个面的颜色不一致
    let diff = 0
    const solved = createSolvedCube()
    
    for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as const) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (state[face][row][col] !== solved[face][row][col]) {
            diff++
          }
        }
      }
    }
    
    // 每个错误的块至少需要一步来修复，所以除以9（每个面有9个块，但有些块属于多个面）
    return Math.ceil(diff / 9)
  }
  
  // IDA* 搜索
  function search(state: CubeState, path: Move[], g: number, threshold: number): { found: boolean, path: Move[], nextThreshold: number } {
    const h = heuristic(state)
    const f = g + h
    
    if (f > threshold) {
      return { found: false, path: [], nextThreshold: f }
    }
    
    if (h === 0) {
      // 找到解
      return { found: true, path, nextThreshold: threshold }
    }
    
    let minThreshold = Infinity
    
    for (const move of allMoves) {
      // 避免重复移动（如 R R'）
      if (path.length > 0) {
        const lastMove = path[path.length - 1]
        const lastFace = lastMove[0]
        const currentFace = move[0]
        
        // 跳过相同面的连续移动（除非是180度旋转）
        if (lastFace === currentFace && !lastMove.endsWith('2') && !move.endsWith('2')) {
          continue
        }
      }
      
      const newState = applyMove(state, move)
      const result = search(newState, [...path, move], g + 1, threshold)
      
      if (result.found) {
        return result
      }
      
      minThreshold = Math.min(minThreshold, result.nextThreshold)
    }
    
    return { found: false, path: [], nextThreshold: minThreshold }
  }
  
  // 迭代加深
  let threshold = heuristic(cubeState)
  
  while (threshold <= maxDepth) {
    const result = search(cubeState, [], 0, threshold)
    
    if (result.found) {
      return result.path
    }
    
    threshold = result.nextThreshold
    
    // 防止无限循环
    if (threshold > maxDepth) {
      break
    }
  }
  
  return [] // 未找到解
}

/**
 * 使用 cube-solver 库的 Thistlethwaite 算法
 * 注意：cube-solver 可能不支持 thistlethwaite，这里作为备选方案
 */
export async function solveByThistlethwaite(cubestring: string): Promise<Move[]> {
  try {
    const { solve } = await import('cube-solver')
    // 尝试使用 kociemba，因为 cube-solver 可能只支持 kociemba
    const solutionString = solve(cubestring, 'kociemba')
    
    if (!solutionString || solutionString.trim() === '') {
      return []
    }
    
    // 解析移动序列
    const moves: Move[] = []
    const moveStrings = solutionString.trim().split(/\s+/).filter(s => s.length > 0)
    
    for (const moveStr of moveStrings) {
      if (moveStr.match(/^[RLUDFB]'?2?$/)) {
        moves.push(moveStr as Move)
      }
    }
    
    return moves
  } catch (error) {
    console.error('Thistlethwaite 求解失败:', error)
    return []
  }
}

/**
 * 主求解函数，支持多种算法
 */
export async function solveCube(
  cubeState: CubeState,
  algorithm: SolverAlgorithm = 'kociemba',
  movesToState?: Move[]
): Promise<Move[]> {
  try {
    switch (algorithm) {
      case 'reverse-moves':
        // 如果知道打乱序列，直接反向
        if (movesToState && movesToState.length > 0) {
          return solveByReverseMoves(movesToState)
        }
        return []
        
      case 'ida-star':
        // IDA* 算法（较慢但能找到最优解）
        return solveByIDAStar(cubeState, 20)
        
      case 'thistlethwaite':
        // Thistlethwaite 算法（四阶段算法，异步版本）
        try {
          return await thistlethwaiteSolve(cubeState, 5) // 进一步减少深度
        } catch (error) {
          // 如果 Thistlethwaite 失败，提示用户使用其他算法
          console.error('Thistlethwaite 算法失败:', error)
          throw new Error('Thistlethwaite 算法对于此状态太慢或无法求解。建议使用"反向移动"（如果知道打乱序列）或"Kociemba"算法。')
        }
        
      case 'kociemba':
      default:
        // 默认使用 Kociemba 算法
        const { solveCube: kociembaSolve } = await import('./cubeConverter')
        return await kociembaSolve(cubeState, movesToState)
    }
  } catch (error) {
    console.error(`求解失败 (算法: ${algorithm}):`, error)
    throw error
  }
}
