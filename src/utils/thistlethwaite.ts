import { CubeState, Move } from './cubeTypes'
import { createSolvedCube, applyMove } from './cubeLogic'

/**
 * Thistlethwaite 算法的四个阶段
 * 每个阶段限制允许的移动，逐步简化魔方状态
 */

// 阶段 0 -> 1: 允许所有移动，目标：边块方向正确
// 注意：简化版本跳过了这个阶段
// const G0_MOVES: Move[] = [
//   'R', "R'", 'R2',
//   'L', "L'", 'L2',
//   'U', "U'", 'U2',
//   'D', "D'", 'D2',
//   'F', "F'", 'F2',
//   'B', "B'", 'B2',
// ]

// 阶段 1 -> 2: 只允许 F, B, R, L, U2, D2，目标：角块方向正确
const G1_MOVES: Move[] = [
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
  'U2',
  'D2',
]

// 阶段 2 -> 3: 只允许 F2, B2, R2, L2, U, D，目标：边块位置正确
const G2_MOVES: Move[] = [
  'F2',
  'B2',
  'R2',
  'L2',
  'U', "U'", 'U2',
  'D', "D'", 'D2',
]

// 阶段 3 -> 4: 只允许 F2, B2, R2, L2, U2, D2，目标：完成还原
const G3_MOVES: Move[] = [
  'F2',
  'B2',
  'R2',
  'L2',
  'U2',
  'D2',
]

/**
 * 检查是否在阶段 0（已解决状态）
 */
function isInG0(state: CubeState): boolean {
  const solved = createSolvedCube()
  return JSON.stringify(state) === JSON.stringify(solved)
}

/**
 * 检查是否在阶段 1（边块方向正确）
 * 简化版本：检查所有边块是否在正确的位置
 * 注意：这是一个非常简化的实现，完整的 Thistlethwaite 需要检查边块的方向
 */
function isInG1(_state: CubeState): boolean {
  // 简化实现：直接返回 true，跳过这个阶段
  // 因为完整的边块方向检查需要复杂的群论计算
  // 对于简化版本，我们假设所有状态都在 G1
  return true
}

/**
 * 检查是否在阶段 2（角块方向正确）
 * 简化版本：检查角块是否在正确的位置和方向
 */
function isInG2(state: CubeState): boolean {
  // 简化实现：检查所有角块是否在正确的位置
  const solved = createSolvedCube()
  
  // 检查所有面的角块
  const corners = [
    // U面的四个角
    { face: 'U' as const, row: 0, col: 0 },
    { face: 'U' as const, row: 0, col: 2 },
    { face: 'U' as const, row: 2, col: 0 },
    { face: 'U' as const, row: 2, col: 2 },
    // D面的四个角
    { face: 'D' as const, row: 0, col: 0 },
    { face: 'D' as const, row: 0, col: 2 },
    { face: 'D' as const, row: 2, col: 0 },
    { face: 'D' as const, row: 2, col: 2 },
  ]
  
  for (const corner of corners) {
    if (state[corner.face][corner.row][corner.col] !== solved[corner.face][corner.row][corner.col]) {
      return false
    }
  }
  
  return true
}

/**
 * 检查是否在阶段 3（边块位置正确）
 * 极度简化版本：只检查 U 面的中心边块，大幅降低检查难度
 */
function isInG3(state: CubeState): boolean {
  // 极度简化：只检查 U 面的中心边块（row=1, col=1 是中心，检查周围的边）
  // 这样可以大幅减少搜索空间
  const solved = createSolvedCube()
  
  // 只检查 U 面的中心边块（不包括角块）
  const edges = [
    { face: 'U' as const, row: 0, col: 1 }, // 上边
    { face: 'U' as const, row: 1, col: 0 }, // 左边
    { face: 'U' as const, row: 1, col: 2 }, // 右边
    { face: 'U' as const, row: 2, col: 1 }, // 下边
  ]
  
  for (const edge of edges) {
    if (state[edge.face][edge.row][edge.col] !== solved[edge.face][edge.row][edge.col]) {
      return false
    }
  }
  
  return true
}

/**
 * 异步 BFS 搜索，用于在特定阶段内寻找解
 * 使用批处理避免阻塞 UI，添加超时机制
 */
async function searchInGroup(
  state: CubeState,
  allowedMoves: Move[],
  isGoal: (state: CubeState) => boolean,
  maxDepth: number = 6, // 减少默认深度以提高性能
  onProgress?: (depth: number, queueSize: number) => void,
  timeout: number = 30000 // 30秒超时
): Promise<Move[] | null> {
  // 检查是否已达到目标
  if (isGoal(state)) {
    return []
  }
  
  const startTime = Date.now()
  const queue: Array<{ state: CubeState; path: Move[] }> = [{ state, path: [] }]
  const visited = new Set<string>()
  const BATCH_SIZE = 50 // 减少批处理大小，更频繁地让出控制权
  let totalProcessed = 0
  const MAX_NODES = 50000 // 限制最大搜索节点数
  
  for (let depth = 0; depth < maxDepth && queue.length > 0; depth++) {
    const levelSize = queue.length
    let processed = 0
    
    while (processed < levelSize && queue.length > 0) {
      // 检查超时
      if (Date.now() - startTime > timeout) {
        console.warn(`搜索超时（${timeout}ms），已处理 ${totalProcessed} 个节点`)
        return null
      }
      
      // 检查最大节点数
      if (totalProcessed > MAX_NODES) {
        console.warn(`达到最大节点数限制（${MAX_NODES}），停止搜索`)
        return null
      }
      
      // 批处理，每处理一批就让出控制权
      const batchEnd = Math.min(processed + BATCH_SIZE, levelSize)
      
      for (let i = processed; i < batchEnd && queue.length > 0; i++) {
        const { state: currentState, path } = queue.shift()!
        const stateKey = JSON.stringify(currentState)
        
        if (visited.has(stateKey)) {
          continue
        }
        visited.add(stateKey)
        totalProcessed++
        
        // 尝试所有允许的移动
        for (const move of allowedMoves) {
          // 避免重复移动
          if (path.length > 0) {
            const lastMove = path[path.length - 1]
            const lastFace = lastMove[0]
            const currentFace = move[0]
            
            // 跳过相同面的连续移动（除非是180度旋转）
            if (lastFace === currentFace && !lastMove.endsWith('2') && !move.endsWith('2')) {
              continue
            }
          }
          
          const newState = applyMove(currentState, move)
          const newPath = [...path, move]
          
          if (isGoal(newState)) {
            console.log(`找到解！深度: ${depth + 1}, 总处理节点: ${totalProcessed}`)
            return newPath
          }
          
          queue.push({ state: newState, path: newPath })
        }
      }
      
      processed = batchEnd
      
      // 报告进度
      if (onProgress && processed % (BATCH_SIZE * 5) === 0) {
        onProgress(depth, queue.length)
      }
      
      // 让出控制权给浏览器，避免阻塞 UI
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    console.log(`深度 ${depth} 完成，队列大小: ${queue.length}, 已处理: ${totalProcessed}`)
  }
  
  console.warn(`搜索完成但未找到解，最大深度: ${maxDepth}, 总处理节点: ${totalProcessed}`)
  return null
}

/**
 * Thistlethwaite 算法求解（异步版本）
 * 四阶段算法，逐步简化魔方状态
 */
export async function solveByThistlethwaite(
  cubeState: CubeState,
  maxDepthPerStage: number = 6, // 减少默认深度
  onProgress?: (stage: number, depth: number, queueSize: number) => void
): Promise<Move[]> {
  const solvedState = createSolvedCube()
  
  // 检查是否已解决
  if (JSON.stringify(cubeState) === JSON.stringify(solvedState)) {
    return []
  }
  
  let currentState = cubeState
  const solution: Move[] = []
  
  // 阶段 0 -> 1: 边块方向正确（简化版本，跳过）
  // 由于完整的边块方向检查需要复杂的群论计算，我们简化跳过这个阶段
  if (!isInG1(currentState)) {
    console.log('Thistlethwaite: 跳过阶段 0->1（简化版本）')
    // 简化版本：直接认为已在 G1
  }
  
  // 阶段 1 -> 2: 角块方向正确
  if (!isInG2(currentState)) {
    console.log('Thistlethwaite: 开始阶段 1->2（角块位置）')
    const path = await searchInGroup(
      currentState,
      G1_MOVES,
      isInG2,
      maxDepthPerStage + 2, // 增加深度以提高成功率
      (depth, queueSize) => onProgress?.(1, depth, queueSize)
    )
    if (!path) {
      console.warn('Thistlethwaite: 无法完成阶段 1->2，尝试增加深度')
      // 尝试增加深度
      const path2 = await searchInGroup(
        currentState,
        G1_MOVES,
        isInG2,
        maxDepthPerStage + 4,
        (depth, queueSize) => onProgress?.(1, depth, queueSize)
      )
      if (!path2) {
        console.error('Thistlethwaite: 阶段 1->2 失败')
        return []
      }
      solution.push(...path2)
      path2.forEach(move => {
        currentState = applyMove(currentState, move)
      })
    } else {
      console.log(`Thistlethwaite: 阶段 1->2 完成，步数: ${path.length}`)
      solution.push(...path)
      path.forEach(move => {
        currentState = applyMove(currentState, move)
      })
    }
  }
  
  // 阶段 2 -> 3: 边块位置正确
  if (!isInG3(currentState)) {
    console.log('Thistlethwaite: 开始阶段 2->3（边块位置，简化检查）')
    console.log('注意：此阶段可能较慢，如果超过15秒将超时')
    
    // 使用更短的超时时间和更小的深度
    const path = await searchInGroup(
      currentState,
      G2_MOVES,
      isInG3,
      Math.min(maxDepthPerStage, 5), // 限制最大深度为5
      (depth, queueSize) => {
        onProgress?.(2, depth, queueSize)
        if (depth % 1 === 0 && queueSize % 5000 < 100) {
          console.log(`阶段 2->3: 搜索深度 ${depth}, 队列大小: ${queueSize}`)
        }
      },
      15000 // 15秒超时
    )
    if (!path) {
      console.warn('Thistlethwaite: 阶段 2->3 超时或未找到解')
      console.warn('Thistlethwaite 算法对于此状态太慢，建议：')
      console.warn('1. 使用"反向移动"算法（如果知道打乱序列）')
      console.warn('2. 使用"Kociemba"算法（快速但需要正确的 cubestring 格式）')
      console.warn('3. 使用"IDA*"算法（较慢但能找到最优解）')
      throw new Error('Thistlethwaite 算法超时：阶段 2->3 搜索空间过大。建议使用其他算法。')
    }
    console.log(`Thistlethwaite: 阶段 2->3 完成，步数: ${path.length}`)
    solution.push(...path)
    path.forEach(move => {
      currentState = applyMove(currentState, move)
    })
  }
  
  // 阶段 3 -> 4: 完成还原
  if (!isInG0(currentState)) {
    console.log('Thistlethwaite: 开始阶段 3->4')
    const path = await searchInGroup(
      currentState,
      G3_MOVES,
      isInG0,
      maxDepthPerStage,
      (depth, queueSize) => onProgress?.(3, depth, queueSize)
    )
    if (!path) {
      console.warn('Thistlethwaite: 无法完成阶段 3->4')
      return []
    }
    console.log(`Thistlethwaite: 阶段 3->4 完成，步数: ${path.length}`)
    solution.push(...path)
  }
  
  console.log(`Thistlethwaite: 求解完成，总步数: ${solution.length}`)
  return solution
}
