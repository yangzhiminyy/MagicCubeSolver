import { CubeState, Move } from './cubeTypes'
import type { KPattern } from 'cubing/kpuzzle'
import type { Alg } from 'cubing/alg'
import { cube3x3x3 } from 'cubing/puzzles'
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search'
import { createSolvedCube, applyMove } from './cubeLogic'

// 将我们的CubeState转换为cubing库需要的面状态字符串
// cubing库使用标准颜色映射：U=白, D=黄, F=红, B=橙, L=绿, R=蓝
export function cubeStateToFacelets(cubeState: CubeState): string {
  // 面顺序: U R F D L B
  // 每个面是3x3，按行优先顺序
  
  let facelets = ''
  
  // U面 (上，白色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.U[row][col])
    }
  }
  
  // R面 (右，蓝色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.R[row][col])
    }
  }
  
  // F面 (前，红色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.F[row][col])
    }
  }
  
  // D面 (下，黄色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.D[row][col])
    }
  }
  
  // L面 (左，绿色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.L[row][col])
    }
  }
  
  // B面 (后，橙色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.B[row][col])
    }
  }
  
  return facelets
}

function colorToChar(color: string): string {
  const colorMap: Record<string, string> = {
    'white': 'U',
    'yellow': 'D',
    'red': 'F',
    'orange': 'B',
    'green': 'L',
    'blue': 'R',
  }
  return colorMap[color] || 'U'
}

// 将 Alg 转换为 Move[] 数组
export function algToMoves(alg: Alg): Move[] {
  const moves: Move[] = []
  const algString = alg.toString()
  
  // 解析算法字符串，例如 "R U R' U'"
  const moveStrings = algString.trim().split(/\s+/).filter(s => s.length > 0)
  
  for (const moveStr of moveStrings) {
    // 处理各种移动格式：R, R', R2, etc.
    if (moveStr.match(/^[RLUDFB]2?$/)) {
      // 简单移动：R, L, U, D, F, B 或 R2, L2, etc.
      moves.push(moveStr as Move)
    } else if (moveStr.match(/^[RLUDFB]'$/)) {
      // 反向移动：R', L', etc.
      moves.push(moveStr as Move)
    } else if (moveStr.match(/^[RLUDFB]2$/)) {
      // 180度旋转：R2, L2, etc.
      moves.push(moveStr as Move)
    }
  }
  
  return moves
}

// 从 CubeState 创建 KPattern
// 通过应用移动序列从已解决状态构建当前状态
// 如果提供了 movesToState，直接使用它们（更快），否则使用搜索
export async function cubeStateToKPattern(cubeState: CubeState, movesToState?: Move[]): Promise<KPattern> {
  const kpuzzle = await cube3x3x3.kpuzzle()
  const solvedPattern = kpuzzle.defaultPattern()
  
  // 检查当前状态是否已经是已解决状态
  const solvedState = createSolvedCube()
  if (JSON.stringify(cubeState) === JSON.stringify(solvedState)) {
    return solvedPattern
  }
  
  // 如果提供了移动序列，直接使用它们来构建 KPattern（更快）
  if (movesToState && movesToState.length > 0) {
    console.log(`cubeStateToKPattern: 使用提供的移动序列（${movesToState.length}步）`)
    let pattern = solvedPattern
    for (const move of movesToState) {
      pattern = pattern.applyMove(move)
    }
    
    // 验证结果是否正确
    let testState = createSolvedCube()
    for (const move of movesToState) {
      testState = applyMove(testState, move)
    }
    const testKey = JSON.stringify(testState)
    const targetKey = JSON.stringify(cubeState)
    
    if (testKey === targetKey) {
      console.log('cubeStateToKPattern: 移动序列验证成功')
      return pattern
    } else {
      console.warn('cubeStateToKPattern: 提供的移动序列与当前状态不匹配，将使用搜索')
    }
  }
  
  // 使用分批处理的 BFS 搜索
  const maxDepth = 25 // 最大深度
  const moveTypes: Move[] = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"]
  const batchSize = 1000 // 每批处理的节点数
  const maxIterations = 500000 // 最大迭代次数
  
  interface SearchNode {
    state: CubeState
    moves: Move[]
    pattern: KPattern
  }
  
  const queue: SearchNode[] = [{
    state: solvedState,
    moves: [],
    pattern: solvedPattern
  }]
  
  const visited = new Map<string, SearchNode>()
  visited.set(JSON.stringify(solvedState), queue[0])
  
  let iterations = 0
  let lastDepth = 0
  const targetKey = JSON.stringify(cubeState)
  
  // 分批处理，避免阻塞主线程
  while (queue.length > 0 && iterations < maxIterations) {
    const batchEnd = Math.min(queue.length, batchSize)
    
    for (let i = 0; i < batchEnd; i++) {
      iterations++
      const node = queue.shift()!
      
      // 每增加一层深度，输出进度
      if (node.moves.length > lastDepth) {
        lastDepth = node.moves.length
        console.log(`cubeStateToKPattern: 搜索深度 ${lastDepth}, 已访问状态数: ${visited.size}, 队列长度: ${queue.length}`)
      }
      
      // 检查是否找到目标状态
      const stateKey = JSON.stringify(node.state)
      
      if (stateKey === targetKey) {
        console.log(`cubeStateToKPattern: 找到匹配状态，步数: ${node.moves.length}, 迭代次数: ${iterations}`)
        console.log('移动序列:', node.moves.join(' '))
        
        // 验证 pattern 是否正确
        let testState = createSolvedCube()
        for (const move of node.moves) {
          testState = applyMove(testState, move)
        }
        const testKey = JSON.stringify(testState)
        if (testKey !== targetKey) {
          console.error('cubeStateToKPattern: 警告！找到的状态与目标状态不匹配！')
        }
        
        return node.pattern
      }
      
      // 如果超过最大深度，跳过
      if (node.moves.length >= maxDepth) {
        continue
      }
      
      // 尝试所有可能的移动
      for (const move of moveTypes) {
        const newState = applyMove(node.state, move)
        const newStateKey = JSON.stringify(newState)
        
        if (!visited.has(newStateKey)) {
          const newPattern = node.pattern.applyMove(move)
          const newNode = {
            state: newState,
            moves: [...node.moves, move],
            pattern: newPattern
          }
          visited.set(newStateKey, newNode)
          queue.push(newNode)
        }
      }
    }
    
    // 让出控制权给浏览器，避免页面卡死
    if (queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
  
  // 如果搜索失败，返回已解决状态（这会导致求解失败）
  if (iterations >= maxIterations) {
    console.error(`cubeStateToKPattern: 搜索超时（超过最大迭代次数 ${maxIterations}）`)
    console.error(`已访问状态数: ${visited.size}, 最后搜索深度: ${lastDepth}`)
  } else {
    console.error('cubeStateToKPattern: 无法找到从已解决状态到当前状态的移动序列（超过最大深度限制）')
  }
  console.error('提示：当前状态可能需要超过', maxDepth, '步才能从已解决状态到达')
  return solvedPattern
}

// 求解魔方
export async function solveCube(cubeState: CubeState, movesToState?: Move[]): Promise<Move[]> {
  try {
    // 从 cubeState 创建 KPattern（如果提供了移动序列，会更快）
    const pattern = await cubeStateToKPattern(cubeState, movesToState)
    
    // 使用 experimentalSolve3x3x3IgnoringCenters 求解
    const solutionAlg = await experimentalSolve3x3x3IgnoringCenters(pattern)
    
    // 将 Alg 转换为 Move[] 数组
    const moves = algToMoves(solutionAlg)
    
    return moves
  } catch (error) {
    console.error('求解失败:', error)
    throw error
  }
}
