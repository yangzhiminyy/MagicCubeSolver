import { Move, CubieBasedCubeState, CubeState } from './cubeTypes'
import { createSolvedCubieBasedCube, applyMove, cubieBasedStateToFaceColors } from './cubieBasedCubeLogic'
import {
  cubeStateToKeyString,
  cubeStatesEqual,
  manhattanSums,
} from './idaStarHelpers'
import { solveByThistlethwaite as thistlethwaiteSolve } from './thistlethwaite'
import {
  cubieFromCubestring,
  cubieBasedStateToCanonicalCubestring,
} from './cubestringCodec'

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
  
  console.log('反向移动法：原始序列:', movesToState)
  
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
  
  console.log('反向移动法：反向序列:', reversed)
  return reversed
}

/** IDA* 单次求解最大搜索结点数（防止主线程长时间阻塞）；超出则返回 [] */
export const IDA_STAR_MAX_NODES = 12_000_000

/**
 * 每处理多少个搜索结点后让出主线程一次（配合 setTimeout(0)），使页面可继续响应点击/滚动等。
 * 过小会拖慢求解，过大仍会卡顿；约 1500～4000 较均衡。
 */
export const IDA_STAR_YIELD_EVERY_NODES = 2500

/** 将控制权交回浏览器事件循环（宏任务），避免长时间同步计算导致页面冻结 */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

/** 浏览器控制台执行：localStorage.setItem('DEBUG_IDA_STAR', 'true') 后刷新再跑 IDA*，可输出 [IDA*] 诊断日志 */
export const DEBUG_IDA_STAR_STORAGE_KEY = 'DEBUG_IDA_STAR'

/** 调试模式下，每探索多少个结点打一条进度（避免刷屏） */
export const IDA_STAR_DEBUG_PROGRESS_NODES = 100_000

/**
 * IDA* 单次求解默认最大 wall-clock 时长（毫秒），超时则放弃并返回 []。
 * 启发式很弱时单轮可能探索千万级结点，不设上限会看似「永远算不完」。
 * 设为 0 表示不限制（不推荐）。
 * 可在控制台：`localStorage.setItem('IDA_STAR_MAX_WALL_MS', '0')` 取消限制，或 `'600000'` 改为 10 分钟等。
 */
export const IDA_STAR_DEFAULT_MAX_WALL_MS = 300_000

export const IDA_STAR_MAX_WALL_MS_STORAGE_KEY = 'IDA_STAR_MAX_WALL_MS'

function getIDAStarMaxWallMs(override?: number): number {
  if (override !== undefined) {
    return override <= 0 ? 0 : override
  }
  try {
    if (typeof localStorage === 'undefined') return IDA_STAR_DEFAULT_MAX_WALL_MS
    const v = localStorage.getItem(IDA_STAR_MAX_WALL_MS_STORAGE_KEY)
    if (v === null) return IDA_STAR_DEFAULT_MAX_WALL_MS
    const n = parseInt(v, 10)
    if (Number.isNaN(n)) return IDA_STAR_DEFAULT_MAX_WALL_MS
    return n <= 0 ? 0 : n
  } catch {
    return IDA_STAR_DEFAULT_MAX_WALL_MS
  }
}

function isIDAStarDebugEnabled(explicit?: boolean): boolean {
  if (explicit === true) return true
  if (explicit === false) return false
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(DEBUG_IDA_STAR_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * 对面规范序剪枝：对面两步可交换，只保留一种顺序（L 先于 R、U 先于 D、F 先于 B）
 * 即禁止：R 后接 L、D 后接 U、B 后接 F（任意 R'/R2 等同面仍视为该面）
 */
function isOppositePairRedundant(lastFace: string, currentFace: string): boolean {
  if (lastFace === 'R' && currentFace === 'L') return true
  if (lastFace === 'U' && currentFace === 'D') return true
  if (lastFace === 'F' && currentFace === 'B') return true
  return false
}

/**
 * 简单的 IDA* 算法求解（异步）
 * 使用迭代加深的 A* 搜索；搜索过程中定期 yield，避免阻塞 UI。
 */
export async function solveByIDAStar(
  cubieBasedState: CubieBasedCubeState,
  maxDepth: number = 20,
  maxNodes: number = IDA_STAR_MAX_NODES,
  yieldEvery: number = IDA_STAR_YIELD_EVERY_NODES,
  /** 为 true 时输出 [IDA*] 日志；不传则读 localStorage `DEBUG_IDA_STAR === 'true'` */
  debug?: boolean,
  /** 总耗时上限（毫秒），0 表示不限；不传则读 localStorage `IDA_STAR_MAX_WALL_MS` 或使用默认 */
  maxWallMs?: number
): Promise<Move[]> {
  const DEBUG = isIDAStarDebugEnabled(debug)
  const wallMs = getIDAStarMaxWallMs(maxWallMs)
  const tSolveStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
  let wallClockAborted = false

  const log = (...args: unknown[]) => {
    if (DEBUG) console.log('[IDA*]', ...args)
  }
  const logWarn = (...args: unknown[]) => {
    if (DEBUG) console.warn('[IDA*]', ...args)
  }

  const solvedState = createSolvedCubieBasedCube()
  const cubeState = cubieBasedStateToFaceColors(cubieBasedState)
  const solvedCubeState = cubieBasedStateToFaceColors(solvedState)
  
  // 检查是否已解决（逐格比较，避免 JSON.stringify）
  if (cubeStatesEqual(cubeState, solvedCubeState)) {
    log('已还原，无需搜索')
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
  
  let nodeCount = 0

  // 启发式：取「错块数/4」与「Manhattan 和/4」的 max，均为可采纳下界的常见组合（信息量优于单独错块计数）
  function heuristic(state: CubieBasedCubeState): number {
    let cornerWrong = 0
    let edgeWrong = 0
    const solved = solvedState

    for (const [id, corner] of Object.entries(state.corners)) {
      const solvedCorner = solved.corners[id as keyof typeof solved.corners]
      const posMatch =
        corner.coordinate[0] === solvedCorner.coordinate[0] &&
        corner.coordinate[1] === solvedCorner.coordinate[1] &&
        corner.coordinate[2] === solvedCorner.coordinate[2]
      if (!posMatch) {
        cornerWrong++
      } else {
        const c = corner.colors
        const s = solvedCorner.colors
        if (c.upper !== s.upper || c.down !== s.down || c.front !== s.front ||
            c.back !== s.back || c.left !== s.left || c.right !== s.right) {
          cornerWrong++
        }
      }
    }

    for (const [id, edge] of Object.entries(state.edges)) {
      const solvedEdge = solved.edges[id as keyof typeof solved.edges]
      const posMatch =
        edge.coordinate[0] === solvedEdge.coordinate[0] &&
        edge.coordinate[1] === solvedEdge.coordinate[1] &&
        edge.coordinate[2] === solvedEdge.coordinate[2]
      if (!posMatch) {
        edgeWrong++
      } else {
        const c = edge.colors
        const s = solvedEdge.colors
        if (c.upper !== s.upper || c.down !== s.down || c.front !== s.front ||
            c.back !== s.back || c.left !== s.left || c.right !== s.right) {
          edgeWrong++
        }
      }
    }

    const hWrong = Math.max(Math.ceil(cornerWrong / 4), Math.ceil(edgeWrong / 4))
    const { sumCorner, sumEdge } = manhattanSums(state, solved)
    const hMan = Math.max(Math.ceil(sumCorner / 4), Math.ceil(sumEdge / 4))
    return Math.max(hWrong, hMan)
  }

  /** 使用已算好的面颜色，避免在 isSolved 里重复 cubieBasedStateToFaceColors */
  function isSolvedFaceColors(faceColors: CubeState): boolean {
    return cubeStatesEqual(faceColors, solvedCubeState)
  }

  const initialH = heuristic(cubieBasedState)
  log('开始求解', {
    maxDepth,
    maxNodes,
    maxWallMs: wallMs === 0 ? 'unlimited' : wallMs,
    yieldEvery,
    progressEvery: IDA_STAR_DEBUG_PROGRESS_NODES,
    initialH,
    firstThreshold: initialH,
    closeDebug: 'localStorage.removeItem("DEBUG_IDA_STAR")',
    wallHint:
      '若长时间无结果：当前 IDA* 启发式较弱，复杂打乱建议改用 Kociemba；或调大 localStorage IDA_STAR_MAX_WALL_MS / 设为 0',
  })

  let idaRound = 0

  // IDA* 搜索（path 可变数组 + push/pop；异步 yield 保持页面可响应）
  async function search(
    state: CubieBasedCubeState,
    path: Move[],
    g: number,
    threshold: number
  ): Promise<{ found: boolean; path: Move[]; nextThreshold: number }> {
    if (wallClockAborted) {
      return { found: false, path: [], nextThreshold: Infinity }
    }

    if (wallMs > 0 && !wallClockAborted) {
      const elapsed =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - tSolveStart
      if (elapsed >= wallMs) {
        wallClockAborted = true
        console.warn(
          '[IDA*] 已达总时长上限，停止搜索（返回无解）。' +
            ' 当前实现启发式较弱，复杂状态可能无法在时限内完成；请优先使用 Kociemba。' +
            ' 取消时长限制：localStorage.setItem("IDA_STAR_MAX_WALL_MS","0") 后刷新。',
          { maxWallMs: wallMs, elapsedMs: Math.round(elapsed), idaRound, threshold }
        )
        return { found: false, path: [], nextThreshold: Infinity }
      }
    }

    if (nodeCount >= maxNodes) {
      if (DEBUG && !maxNodesHitThisRound) {
        maxNodesHitThisRound = true
        logWarn('已达 maxNodes，本轮搜索中止', { maxNodes, idaRound, threshold })
      }
      return { found: false, path: [], nextThreshold: Infinity }
    }

    // 深度限制：防止递归过深导致栈溢出（如 R L R' L' 等循环路径）
    if (g >= maxDepth) {
      return { found: false, path: [], nextThreshold: Infinity }
    }

    const faceColors = cubieBasedStateToFaceColors(state)
    const stateKey = cubeStateToKeyString(faceColors)
    const prevDepth = visited.get(stateKey)
    if (prevDepth !== undefined && prevDepth <= g) {
      return { found: false, path: [], nextThreshold: Infinity }
    }
    visited.set(stateKey, g)

    nodeCount++

    // 定期让出主线程，避免长时间同步计算卡死页面
    if (yieldEvery > 0 && nodeCount % yieldEvery === 0) {
      await yieldToBrowser()
    }

    const h = heuristic(state)
    const f = g + h

    if (DEBUG && nodeCount % IDA_STAR_DEBUG_PROGRESS_NODES === 0) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      log('进度', {
        idaRound,
        nodesThisRound: nodeCount,
        threshold,
        g,
        h,
        f,
        prunedThisNode: f > threshold,
        elapsedMs: Math.round(now - tSolveStart),
        note:
          f > threshold
            ? '本条 f>threshold，随后会剪枝，属正常'
            : 'f<=threshold，继续扩展子结点',
      })
    }

    if (f > threshold) {
      return { found: false, path: [], nextThreshold: f }
    }

    // 必须用完整状态比较（含朝向），不能用 h===0 代替
    if (isSolvedFaceColors(faceColors)) {
      return { found: true, path: path.slice(), nextThreshold: threshold }
    }
    
    let minThreshold = Infinity
    
    for (const move of allMoves) {
      if (path.length > 0) {
        const lastMove = path[path.length - 1]
        const lastFace = lastMove[0]
        const currentFace = move[0]

        // 同面连续两步可合并为单步（R+R2≡R'、R2+R2≡恒等 等），全部剪枝
        if (lastFace === currentFace) {
          continue
        }
        // 对面可交换：只保留 L/R、U/D、F/B 的一种顺序
        if (isOppositePairRedundant(lastFace, currentFace)) {
          continue
        }
      }
      
      const newState = applyMove(state, move)
      path.push(move)
      const result = await search(newState, path, g + 1, threshold)
      path.pop()
      
      if (result.found) {
        return result
      }
      
      minThreshold = Math.min(minThreshold, result.nextThreshold)
    }
    
    return { found: false, path: [], nextThreshold: minThreshold }
  }
  
  // 迭代加深（每轮重置结点计数，使每轮 IDA 都有完整预算）
  let threshold = initialH
  let maxNodesHitThisRound = false
  /** 置换表：本轮 DFS 内同一局面若已从更优或相同深度到达则剪枝（每轮 IDA 清空） */
  const visited = new Map<string, number>()

  while (threshold <= maxDepth) {
    idaRound++
    maxNodesHitThisRound = false
    nodeCount = 0
    visited.clear()
    const tRound = typeof performance !== 'undefined' ? performance.now() : Date.now()
    log('迭代加深轮次开始', { idaRound, threshold, maxDepth })

    const result = await search(cubieBasedState, [], 0, threshold)

    const roundMs = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - tRound
    )
    log('迭代加深轮次结束', {
      idaRound,
      threshold,
      nodesThisRound: nodeCount,
      nextThreshold: result.nextThreshold,
      found: result.found,
      roundMs,
    })

    if (result.found) {
      const totalMs = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - tSolveStart
      )
      log('求解成功', { moves: result.path.length, totalMs })
      return result.path
    }

    // 确保 threshold 递增，防止 while 死循环（当 nextThreshold === threshold 时）
    const nextThreshold = result.nextThreshold
    if (nextThreshold === Infinity || nextThreshold > maxDepth) {
      logWarn('未找到解，退出迭代加深', {
        reason: nextThreshold === Infinity ? 'nextThreshold=Infinity' : 'nextThreshold>maxDepth',
        nextThreshold,
        maxDepth,
        lastThreshold: threshold,
        idaRound,
        nodesLastRound: nodeCount,
      })
      break
    }
    threshold = nextThreshold > threshold ? nextThreshold : threshold + 1
  }

  const totalMs = Math.round(
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) - tSolveStart
  )
  log('求解结束（无解或中断）', { totalMs, finalThreshold: threshold })
  return []
}

/**
 * 使用 npm `cube-solver` 包，按 **Kociemba** 策略从 cubestring 求解（与 UI「自研 Thistlethwaite」无关）。
 * 曾误用函数名 `solveByThistlethwaite`，易引起混淆。
 */
export async function solveByCubeSolverKociemba(cubestring: string): Promise<Move[]> {
  try {
    const { solve } = await import('cube-solver')
    const solutionString = solve(cubestring, 'kociemba')

    if (!solutionString || solutionString.trim() === '') {
      return []
    }

    const moves: Move[] = []
    const moveStrings = solutionString.trim().split(/\s+/).filter((s) => s.length > 0)

    for (const moveStr of moveStrings) {
      if (moveStr.match(/^[RLUDFB]'?2?$/)) {
        moves.push(moveStr as Move)
      }
    }

    return moves
  } catch (error) {
    console.error('cube-solver（Kociemba）求解失败:', error)
    return []
  }
}

/**
 * 主求解函数，支持多种算法
 */
export async function solveCube(
  cubieBasedState: CubieBasedCubeState,
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
        
      case 'ida-star': {
        // 经规范 cubestring 再转 cubie，与测试/文档契约一致（暴露编解码问题）
        const cubie = cubieFromCubestring(
          cubieBasedStateToCanonicalCubestring(cubieBasedState)
        )
        return await solveByIDAStar(cubie, 20)
      }

      case 'thistlethwaite':
        try {
          const cubie = cubieFromCubestring(
            cubieBasedStateToCanonicalCubestring(cubieBasedState)
          )
          return await thistlethwaiteSolve(cubie, 5)
        } catch (error) {
          // 如果 Thistlethwaite 失败，提示用户使用其他算法
          console.error('Thistlethwaite 算法失败:', error)
          throw new Error('Thistlethwaite 算法对于此状态太慢或无法求解。建议使用"反向移动"（如果知道打乱序列）或"Kociemba"算法。')
        }
        
      case 'kociemba':
      default:
        // 默认使用 Kociemba 算法
        const { solveCube: kociembaSolve } = await import('./cubeConverter')
        return await kociembaSolve(cubieBasedState, movesToState)
    }
  } catch (error) {
    console.error(`求解失败 (算法: ${algorithm}):`, error)
    throw error
  }
}
