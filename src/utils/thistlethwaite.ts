import {
  CubieBasedCubeState,
  Move,
  CornerCubieId,
  EdgeCubieId,
  EdgeCubie,
  CubieColors,
  FACE_COLORS,
} from './cubeTypes'
import { createSolvedCubieBasedCube, applyMove, cloneCubieBasedState } from './cubieBasedCubeLogic'

/**
 * Thistlethwaite 算法的四个阶段
 * 每个阶段限制允许的移动，逐步简化魔方状态
 */

/** 阶段 0 -> 1: 允许所有移动，目标：边块朝向（G1） */
const G0_MOVES: Move[] = [
  'R',
  "R'",
  'R2',
  'L',
  "L'",
  'L2',
  'U',
  "U'",
  'U2',
  'D',
  "D'",
  'D2',
  'F',
  "F'",
  'F2',
  'B',
  "B'",
  'B2',
]

const CORNER_IDS: CornerCubieId[] = ['UFR', 'UFL', 'UBL', 'UBR', 'DFR', 'DFL', 'DBL', 'DBR']
const EDGE_IDS: EdgeCubieId[] = ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL']

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
 * 比较两个坐标是否相等
 */
function coordinatesEqual(coord1: [number, number, number], coord2: [number, number, number]): boolean {
  return coord1[0] === coord2[0] && coord1[1] === coord2[1] && coord1[2] === coord2[2]
}

function cubieColorsEqual(a: CubieColors, b: CubieColors): boolean {
  return (
    a.upper === b.upper &&
    a.down === b.down &&
    a.front === b.front &&
    a.back === b.back &&
    a.left === b.left &&
    a.right === b.right
  )
}

/**
 * 全盘已解（G4）：位置与贴纸朝向均与已解状态一致
 */
function isInG0(state: CubieBasedCubeState): boolean {
  const solved = createSolvedCubieBasedCube()

  for (const id of CORNER_IDS) {
    const c = state.corners[id]
    const sc = solved.corners[id]
    if (!coordinatesEqual(c.coordinate, sc.coordinate)) return false
    if (!cubieColorsEqual(c.colors, sc.colors)) return false
  }

  for (const id of EDGE_IDS) {
    const e = state.edges[id]
    const se = solved.edges[id]
    if (!coordinatesEqual(e.coordinate, se.coordinate)) return false
    if (!cubieColorsEqual(e.colors, se.colors)) return false
  }

  return true
}

/**
 * 槽位上的棱是否「朝向错误」（与 isInG1 一致，按槽位坐标判定贴纸）
 */
function edgeOrientationWrongAtSlot(edge: EdgeCubie, slotCoord: [number, number, number]): boolean {
  const [, y, z] = slotCoord
  const c = edge.colors
  if (y === 1) {
    return c.upper !== FACE_COLORS.U
  }
  if (y === -1) {
    return c.down !== FACE_COLORS.D
  }
  if (z === 1) {
    return c.front !== FACE_COLORS.F
  }
  if (z === -1) {
    return c.back !== FACE_COLORS.B
  }
  return true
}

/**
 * 边朝向 11 位索引（0..2047）：UF…BR 共 11 槽（EDGE_IDS[0..10]）打包；BL 槽不计入索引（与父表 BFS 一致）。
 * 不对 12 槽做 XOR 奇偶校验：贴纸「错向」与抽象 EO 群的 parity bit 在此模型下不完全一致，误拒合法状态。
 */
function encodeEdgeOrientationIndex(state: CubieBasedCubeState): number {
  const solved = createSolvedCubieBasedCube()
  const byCoord = new Map<string, EdgeCubie>()
  for (const e of Object.values(state.edges)) {
    byCoord.set(e.coordinate.join(','), e)
  }
  let idx = 0
  for (let i = 0; i < 11; i++) {
    const id = EDGE_IDS[i]
    const slotCoord = solved.edges[id].coordinate as [number, number, number]
    const edge = byCoord.get(slotCoord.join(','))
    if (!edge) return -1
    if (edgeOrientationWrongAtSlot(edge, slotCoord)) idx |= 1 << i
  }
  return idx
}

/** G1：12 个棱槽朝向均正确 */
function isInG1(state: CubieBasedCubeState): boolean {
  const solved = createSolvedCubieBasedCube()
  const byCoord = new Map<string, EdgeCubie>()
  for (const e of Object.values(state.edges)) {
    byCoord.set(e.coordinate.join(','), e)
  }
  for (const id of EDGE_IDS) {
    const slotCoord = solved.edges[id].coordinate as [number, number, number]
    const edge = byCoord.get(slotCoord.join(','))
    if (!edge) return false
    if (edgeOrientationWrongAtSlot(edge, slotCoord)) return false
  }
  return true
}

/** 编码策略变更时 bump，强制重建 EO BFS 表 */
const EO_TABLE_BUILD_VERSION = 4

/** 边朝向父指针表：从已解 EO 做 BFS，仅 2048 状态，一次性构建 */
let eoParentTable: Array<{ prev: number; move: Move } | undefined> | null = null
let eoTableBuiltCount = 0
let eoTableBuildVersion = 0

function buildEdgeOrientationParentTable(): void {
  if (eoParentTable !== null && eoTableBuildVersion === EO_TABLE_BUILD_VERSION) return
  eoParentTable = null

  const parents: Array<{ prev: number; move: Move } | undefined> = new Array(2048).fill(undefined)
  const rep: CubieBasedCubeState[] = new Array(2048)
  const seen = new Array(2048).fill(false)
  const q: number[] = []

  const solved = createSolvedCubieBasedCube()
  rep[0] = cloneCubieBasedState(solved)
  seen[0] = true
  q.push(0)

  while (q.length > 0) {
    const eo = q.shift()!
    const st = rep[eo]
    for (const move of G0_MOVES) {
      const ns = applyMove(st, move)
      const neo = encodeEdgeOrientationIndex(ns)
      if (neo < 0) continue
      if (!seen[neo]) {
        seen[neo] = true
        parents[neo] = { prev: eo, move }
        rep[neo] = ns
        q.push(neo)
      }
    }
  }

  eoParentTable = parents
  eoTableBuildVersion = EO_TABLE_BUILD_VERSION
  eoTableBuiltCount = seen.filter(Boolean).length
  console.log(`Thistlethwaite: 边朝向(EO) BFS 表已构建，可达 ${eoTableBuiltCount}/2048 状态`)
}

function inverseMove(m: Move): Move {
  if (m.endsWith('2')) return m
  if (m.endsWith("'")) return m.slice(0, -1) as Move
  return (m + "'") as Move
}

/**
 * 阶段 0→1：用 EO 父表反推移动（从当前 EO 沿 parent 走回 0，每步施加 inverse(move)）
 */
function solvePhase0MovesFromTable(state: CubieBasedCubeState): Move[] | null {
  buildEdgeOrientationParentTable()
  const parents = eoParentTable!

  if (isInG1(state)) return []

  let eo = encodeEdgeOrientationIndex(state)
  if (eo < 0) {
    console.warn('Thistlethwaite: 边朝向编码失败（槽位缺棱），无法用 EO 表')
    return null
  }
  if (eo === 0) {
    console.warn('Thistlethwaite: UF…BR 位 EO 为 0 但尚未满足 G1（例如 BL 槽），无法用 EO 表')
    return null
  }
  if (parents[eo] === undefined) {
    console.warn(`Thistlethwaite: EO 索引 ${eo} 不在从已解出发的可达表中`)
    return null
  }

  const moves: Move[] = []
  while (eo !== 0) {
    const par = parents[eo]
    if (par === undefined) return null
    moves.push(inverseMove(par.move))
    eo = par.prev
  }

  let verify = cloneCubieBasedState(state)
  for (const m of moves) {
    verify = applyMove(verify, m)
  }
  if (!isInG1(verify)) {
    console.warn('Thistlethwaite: EO 查表路径未到达 G1（抽象索引碰撞），将回退 IDA*')
    return null
  }
  return moves
}

/**
 * G2：在 G1 基础上，角块朝向正确（U/D 角贴纸在 U/D 面）
 */
function isInG2(state: CubieBasedCubeState): boolean {
  if (!isInG1(state)) return false
  for (const corner of Object.values(state.corners)) {
    const y = corner.coordinate[1]
    if (y === 1) {
      if (corner.colors.upper !== FACE_COLORS.U) return false
    } else if (y === -1) {
      if (corner.colors.down !== FACE_COLORS.D) return false
    }
  }
  return true
}

/** 角块朝向错误个数（与 isInG2 判定一致；仅当已在 G1 时有意义） */
function wrongCornerOrientationCount(state: CubieBasedCubeState): number {
  let n = 0
  for (const corner of Object.values(state.corners)) {
    const y = corner.coordinate[1]
    if (y === 1) {
      if (corner.colors.upper !== FACE_COLORS.U) n++
    } else if (y === -1) {
      if (corner.colors.down !== FACE_COLORS.D) n++
    }
  }
  return n
}

/** 棱槽朝向错误个数（与 isInG1 一致） */
function wrongEdgeOrientationCount(state: CubieBasedCubeState): number {
  const solved = createSolvedCubieBasedCube()
  const byCoord = new Map<string, EdgeCubie>()
  for (const e of Object.values(state.edges)) {
    byCoord.set(e.coordinate.join(','), e)
  }
  let n = 0
  for (const id of EDGE_IDS) {
    const slotCoord = solved.edges[id].coordinate as [number, number, number]
    const edge = byCoord.get(slotCoord.join(','))
    if (!edge) return 12
    if (edgeOrientationWrongAtSlot(edge, slotCoord)) n++
  }
  return n
}

/** G0→G1：单步最多影响 4 条棱的朝向（同一面一层） */
function heuristicG0ToG1(state: CubieBasedCubeState): number {
  if (isInG1(state)) return 0
  return Math.ceil(wrongEdgeOrientationCount(state) / 4)
}

/** G1→G2：单步最多影响 4 个角块的朝向（同一面一层） */
function heuristicG1ToG2(state: CubieBasedCubeState): number {
  if (isInG2(state)) return 0
  if (!isInG1(state)) return 8
  return Math.ceil(wrongCornerOrientationCount(state) / 4)
}

/**
 * G3：边块已在「家」位置（且保持 G2 角朝向）
 */
function isInG3(state: CubieBasedCubeState): boolean {
  if (!isInG2(state)) return false
  const solved = createSolvedCubieBasedCube()
  for (const id of EDGE_IDS) {
    const edge = state.edges[id]
    const solvedEdge = solved.edges[id]
    if (!coordinatesEqual(edge.coordinate, solvedEdge.coordinate)) {
      return false
    }
  }
  return true
}

function serializeCubieColors(c: CubieColors): string {
  return [c.upper, c.down, c.front, c.back, c.left, c.right].join(',')
}

/**
 * 完整状态键（固定 id 顺序 + 坐标 + 贴纸），用于 BFS 去重。
 * 禁止仅用「坐标排序」：合法魔方下角/边坐标集合不变，会误判为同一状态。
 */
function stateKey(state: CubieBasedCubeState): string {
  const parts: string[] = []
  for (const id of CORNER_IDS) {
    const corner = state.corners[id]
    parts.push(`${id}:${corner.coordinate.join(',')}:${serializeCubieColors(corner.colors)}`)
  }
  for (const id of EDGE_IDS) {
    const edge = state.edges[id]
    parts.push(`${id}:${edge.coordinate.join(',')}:${serializeCubieColors(edge.colors)}`)
  }
  return parts.join('|')
}

/** 对面序剪枝：与 IDA* 一致，减少 BFS 重复扩展 */
function isOppositePairRedundant(lastFace: string, currentFace: string): boolean {
  if (lastFace === 'R' && currentFace === 'L') return true
  if (lastFace === 'U' && currentFace === 'D') return true
  if (lastFace === 'F' && currentFace === 'B') return true
  return false
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * 阶段 0→2：全 G0 转动下将棱 EO 调到 G1。EO 查表失败时的回退（IDA*）。
 */
async function searchG0ToG1IDA(
  start: CubieBasedCubeState,
  maxDepthG: number,
  maxF: number,
  timeoutMs: number,
  maxNodes: number,
  yieldEvery: number,
  onProgress?: (round: number, threshold: number) => void
): Promise<Move[] | null> {
  if (isInG1(start)) return []

  const t0 = Date.now()
  let totalNodes = 0
  let idaRound = 0
  let threshold = heuristicG0ToG1(start)
  let visited = new Map<string, number>()

  async function dfs(
    s: CubieBasedCubeState,
    path: Move[],
    g: number,
    thr: number
  ): Promise<{ found: boolean; path: Move[]; nextThreshold: number }> {
    if (Date.now() - t0 > timeoutMs) {
      return { found: false, path: [], nextThreshold: Infinity }
    }
    if (totalNodes >= maxNodes) {
      return { found: false, path: [], nextThreshold: Infinity }
    }

    if (isInG1(s)) {
      return { found: true, path: path.slice(), nextThreshold: thr }
    }
    if (g >= maxDepthG) {
      return { found: false, path: [], nextThreshold: Infinity }
    }

    const key = stateKey(s)
    const prevG = visited.get(key)
    if (prevG !== undefined && prevG <= g) {
      return { found: false, path: [], nextThreshold: Infinity }
    }
    visited.set(key, g)
    totalNodes++
    if (yieldEvery > 0 && totalNodes % yieldEvery === 0) {
      await yieldToBrowser()
    }

    const h = heuristicG0ToG1(s)
    const f = g + h
    if (f > thr) {
      return { found: false, path: [], nextThreshold: f }
    }

    let minNext = Infinity
    for (const move of G0_MOVES) {
      if (path.length > 0) {
        const lastMove = path[path.length - 1]
        const lastFace = lastMove[0]
        const currentFace = move[0]
        if (lastFace === currentFace) continue
        if (isOppositePairRedundant(lastFace, currentFace)) continue
      }
      const ns = applyMove(s, move)
      path.push(move)
      const r = await dfs(ns, path, g + 1, thr)
      path.pop()
      if (r.found) return r
      minNext = Math.min(minNext, r.nextThreshold)
    }
    return { found: false, path: [], nextThreshold: minNext }
  }

  while (threshold <= maxF) {
    if (Date.now() - t0 > timeoutMs) {
      console.warn(`阶段 0->1 IDA* 超时（${timeoutMs}ms），累计结点 ${totalNodes}，阈值 ${threshold}`)
      return null
    }
    idaRound++
    visited = new Map<string, number>()
    onProgress?.(idaRound, threshold)

    const result = await dfs(start, [], 0, threshold)
    if (result.found) {
      console.log(`阶段 0->1 IDA* 成功：轮次 ${idaRound}，阈值 ${threshold}，累计结点 ${totalNodes}`)
      return result.path
    }
    const nextT = result.nextThreshold
    if (nextT === Infinity || nextT > maxF) {
      console.warn(`阶段 0->1 IDA* 未找到：nextThreshold=${nextT}，maxF=${maxF}，累计结点 ${totalNodes}`)
      return null
    }
    threshold = nextT > threshold ? nextT : threshold + 1
  }
  return null
}

/**
 * 阶段 1→2：G1 转动下将角块朝向调到 G2。用 IDA* 替代 BFS（前沿同样会爆炸）。
 * 顺序：先判 isInG2，再判 g>=maxDepthG。
 */
async function searchG1ToG2IDA(
  start: CubieBasedCubeState,
  maxDepthG: number,
  maxF: number,
  timeoutMs: number,
  maxNodes: number,
  yieldEvery: number,
  onProgress?: (round: number, threshold: number) => void
): Promise<Move[] | null> {
  if (isInG2(start)) return []

  const t0 = Date.now()
  let totalNodes = 0
  let idaRound = 0
  let threshold = heuristicG1ToG2(start)
  let visited = new Map<string, number>()

  async function dfs(
    s: CubieBasedCubeState,
    path: Move[],
    g: number,
    thr: number
  ): Promise<{ found: boolean; path: Move[]; nextThreshold: number }> {
    if (Date.now() - t0 > timeoutMs) {
      return { found: false, path: [], nextThreshold: Infinity }
    }
    if (totalNodes >= maxNodes) {
      return { found: false, path: [], nextThreshold: Infinity }
    }

    if (isInG2(s)) {
      return { found: true, path: path.slice(), nextThreshold: thr }
    }
    if (g >= maxDepthG) {
      return { found: false, path: [], nextThreshold: Infinity }
    }

    const key = stateKey(s)
    const prevG = visited.get(key)
    if (prevG !== undefined && prevG <= g) {
      return { found: false, path: [], nextThreshold: Infinity }
    }
    visited.set(key, g)
    totalNodes++
    if (yieldEvery > 0 && totalNodes % yieldEvery === 0) {
      await yieldToBrowser()
    }

    const h = heuristicG1ToG2(s)
    const f = g + h
    if (f > thr) {
      return { found: false, path: [], nextThreshold: f }
    }

    let minNext = Infinity
    for (const move of G1_MOVES) {
      if (path.length > 0) {
        const lastMove = path[path.length - 1]
        const lastFace = lastMove[0]
        const currentFace = move[0]
        if (lastFace === currentFace) continue
        if (isOppositePairRedundant(lastFace, currentFace)) continue
      }
      const ns = applyMove(s, move)
      path.push(move)
      const r = await dfs(ns, path, g + 1, thr)
      path.pop()
      if (r.found) return r
      minNext = Math.min(minNext, r.nextThreshold)
    }
    return { found: false, path: [], nextThreshold: minNext }
  }

  while (threshold <= maxF) {
    if (Date.now() - t0 > timeoutMs) {
      console.warn(`阶段 1->2 IDA* 超时（${timeoutMs}ms），累计结点 ${totalNodes}，阈值 ${threshold}`)
      return null
    }
    idaRound++
    visited = new Map<string, number>()
    onProgress?.(idaRound, threshold)

    const result = await dfs(start, [], 0, threshold)
    if (result.found) {
      console.log(`阶段 1->2 IDA* 成功：轮次 ${idaRound}，阈值 ${threshold}，累计结点 ${totalNodes}`)
      return result.path
    }
    const nextT = result.nextThreshold
    if (nextT === Infinity || nextT > maxF) {
      console.warn(`阶段 1->2 IDA* 未找到：nextThreshold=${nextT}，maxF=${maxF}，累计结点 ${totalNodes}`)
      return null
    }
    threshold = nextT > threshold ? nextT : threshold + 1
  }
  return null
}

/**
 * 异步 BFS 搜索，用于在特定阶段内寻找解
 * 使用批处理避免阻塞 UI，添加超时机制
 */
async function searchInGroup(
  state: CubieBasedCubeState,
  allowedMoves: Move[],
  isGoal: (state: CubieBasedCubeState) => boolean,
  maxDepth: number = 6, // 减少默认深度以提高性能
  onProgress?: (depth: number, queueSize: number) => void,
  timeout: number = 30000, // 30秒超时
  maxNodesLimit: number = 120_000
): Promise<Move[] | null> {
  // 检查是否已达到目标
  if (isGoal(state)) {
    return []
  }
  
  const startTime = Date.now()
  const queue: Array<{ state: CubieBasedCubeState; path: Move[] }> = [{ state, path: [] }]
  
  const visited = new Set<string>()
  /** 同层内分批扩展；每批结束 yield，避免与 IDA* 类似长时间占满主线程导致页面卡死 */
  const BATCH_SIZE = 4000
  /** 与 IDA* 阶段搜索类似，每扩展若干结点让出一次（大批次内仍可能阻塞，故配合 BATCH 尾部 yield） */
  const YIELD_EVERY_NODES = 2500
  let totalProcessed = 0

  for (let depth = 0; depth < maxDepth && queue.length > 0; depth++) {
    const levelSize = queue.length
    let processed = 0

    while (processed < levelSize && queue.length > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn(`搜索超时（${timeout}ms），已处理 ${totalProcessed} 个节点`)
        return null
      }

      if (totalProcessed > maxNodesLimit) {
        console.warn(`达到最大节点数限制（${maxNodesLimit}），停止搜索`)
        return null
      }

      const batchEnd = Math.min(processed + BATCH_SIZE, levelSize)

      for (let i = processed; i < batchEnd && queue.length > 0; i++) {
        const { state: currentState, path } = queue.shift()!
        const stateKeyStr = stateKey(currentState)

        if (visited.has(stateKeyStr)) {
          continue
        }
        visited.add(stateKeyStr)
        totalProcessed++

        if (YIELD_EVERY_NODES > 0 && totalProcessed % YIELD_EVERY_NODES === 0) {
          await yieldToBrowser()
        }

        for (const move of allowedMoves) {
          if (path.length > 0) {
            const lastMove = path[path.length - 1]
            const lastFace = lastMove[0]
            const currentFace = move[0]
            if (lastFace === currentFace) continue
            if (isOppositePairRedundant(lastFace, currentFace)) continue
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

      if (onProgress && processed % (BATCH_SIZE * 2) === 0) {
        onProgress(depth, queue.length)
      }

      await yieldToBrowser()
    }

    console.log(`深度 ${depth} 完成，队列大小: ${queue.length}, 已处理: ${totalProcessed}`)
    await yieldToBrowser()
  }
  
  console.warn(`搜索完成但未找到解，最大深度: ${maxDepth}, 总处理节点: ${totalProcessed}`)
  return null
}

/** 阶段内 BFS（searchInGroup）的时间与结点上限；用于测试或难例时放宽，默认与原先常量一致 */
export type ThistlethwaiteSearchTuning = {
  bfsMaxNodes?: number
  stage23TimeoutMs?: number
  stage34TimeoutFirstMs?: number
  stage34TimeoutRetryMs?: number
}

/**
 * Thistlethwaite 算法求解（异步版本）
 * 四阶段算法，逐步简化魔方状态
 */
export async function solveByThistlethwaite(
  cubieState: CubieBasedCubeState,
  maxDepthPerStage: number = 6, // 减少默认深度
  onProgress?: (stage: number, depth: number, queueSize: number) => void,
  searchTuning?: ThistlethwaiteSearchTuning
): Promise<Move[]> {
  const bfsMax = searchTuning?.bfsMaxNodes ?? 120_000
  const t23 = searchTuning?.stage23TimeoutMs ?? 30_000
  const t34a = searchTuning?.stage34TimeoutFirstMs ?? 60_000
  const t34b = searchTuning?.stage34TimeoutRetryMs ?? 120_000
  // 检查是否已解决
  if (isInG0(cubieState)) {
    return []
  }
  
  let currentState = cubieState
  const solution: Move[] = []

  // 阶段 0 -> 1: 边块朝向（2048 状态 BFS 父表，O(步数) 查表，避免指数搜索）
  if (!isInG1(currentState)) {
    console.log('Thistlethwaite: 开始阶段 0->1（边块朝向，EO 查表）')
    onProgress?.(0, 0, 0)
    let path0 = solvePhase0MovesFromTable(currentState)
    if (!path0) {
      console.warn('Thistlethwaite: EO 查表不可用，回退到 G0→G1 IDA*')
      const d = maxDepthPerStage
      path0 = await searchG0ToG1IDA(
        currentState,
        d + 12,
        d + 22,
        120_000,
        2_000_000,
        2500,
        (round, thr) => onProgress?.(0, round, thr)
      )
      if (!path0) {
        path0 = await searchG0ToG1IDA(
          currentState,
          d + 18,
          d + 30,
          240_000,
          5_000_000,
          5000,
          (round, thr) => onProgress?.(0, round, thr)
        )
      }
    }
    if (!path0) {
      console.error('Thistlethwaite: 阶段 0->1 失败（EO 不可达、编码无效或 IDA* 未找到）')
      return []
    }
    console.log(`Thistlethwaite: 阶段 0->1 完成，步数: ${path0.length}`)
    solution.push(...path0)
    path0.forEach((move) => {
      currentState = applyMove(currentState, move)
    })
  }

  // 阶段 1 -> 2: 角块朝向（G1 转动；IDA*，避免 BFS 前沿爆炸与 30s 超时）
  if (!isInG2(currentState)) {
    console.log('Thistlethwaite: 开始阶段 1->2（角块朝向，IDA*）')
    const d = maxDepthPerStage
    let path = await searchG1ToG2IDA(
      currentState,
      d + 12,
      d + 22,
      120_000,
      2_000_000,
      2500,
      (round, thr) => onProgress?.(1, round, thr)
    )
    if (!path) {
      path = await searchG1ToG2IDA(
        currentState,
        d + 18,
        d + 30,
        240_000,
        5_000_000,
        5000,
        (round, thr) => onProgress?.(1, round, thr)
      )
    }
    if (!path) {
      console.error('Thistlethwaite: 阶段 1->2 失败')
      return []
    }
    console.log(`Thistlethwaite: 阶段 1->2 完成，步数: ${path.length}`)
    solution.push(...path)
    path.forEach((move) => {
      currentState = applyMove(currentState, move)
    })
  }
  
  // 阶段 2 -> 3: 边块位置正确
  if (!isInG3(currentState)) {
    console.log('Thistlethwaite: 开始阶段 2->3（边块位置）')
    console.log('注意：此阶段可能较慢，如果超过30秒将超时')
    
    // 使用更长的超时时间和更大的深度
    const path = await searchInGroup(
      currentState,
      G2_MOVES,
      isInG3,
      maxDepthPerStage + 2, // 增加深度以提高成功率
      (depth, queueSize) => {
        onProgress?.(2, depth, queueSize)
        if (depth % 1 === 0 && queueSize % 5000 < 100) {
          console.log(`阶段 2->3: 搜索深度 ${depth}, 队列大小: ${queueSize}`)
        }
      },
      t23,
      bfsMax
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
  // 注意：阶段3->4只允许180度旋转，搜索空间可能很大
  // 如果阶段3正确完成，理论上应该能在有限步数内完成
  if (!isInG0(currentState)) {
    console.log('Thistlethwaite: 开始阶段 3->4（只允许180度旋转）')
    console.log('注意：此阶段搜索空间较大，可能需要较长时间')
    
    // 先尝试较小的深度
    const path = await searchInGroup(
      currentState,
      G3_MOVES,
      isInG0,
      maxDepthPerStage + 6, // 增加深度
      (depth, queueSize) => {
        onProgress?.(3, depth, queueSize)
        if (depth % 2 === 0) {
          console.log(`阶段 3->4: 搜索深度 ${depth}, 队列大小: ${queueSize}`)
        }
      },
      t34a,
      bfsMax
    )
    if (!path) {
      console.warn('Thistlethwaite: 无法完成阶段 3->4，尝试增加深度')
      // 尝试增加深度
      const path2 = await searchInGroup(
        currentState,
        G3_MOVES,
        isInG0,
        maxDepthPerStage + 12, // 进一步增加深度
        (depth, queueSize) => {
          onProgress?.(3, depth, queueSize)
          if (depth % 2 === 0) {
            console.log(`阶段 3->4 (重试): 搜索深度 ${depth}, 队列大小: ${queueSize}`)
          }
        },
        t34b,
        bfsMax
      )
      if (!path2) {
        console.warn('Thistlethwaite: 阶段 3->4 失败')
        console.warn('提示：Thistlethwaite 算法对于某些状态可能较慢，建议使用其他算法（如 Kociemba 或 IDA*）')
        return []
      }
      console.log(`Thistlethwaite: 阶段 3->4 完成，步数: ${path2.length}`)
      solution.push(...path2)
    } else {
      console.log(`Thistlethwaite: 阶段 3->4 完成，步数: ${path.length}`)
      solution.push(...path)
    }
  }
  
  console.log(`Thistlethwaite: 求解完成，总步数: ${solution.length}`)
  return solution
}
