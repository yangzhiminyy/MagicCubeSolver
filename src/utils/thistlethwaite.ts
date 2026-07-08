import {
  CubieBasedCubeState,
  Move,
  CornerCubieId,
  EdgeCubieId,
  EdgeCubie,
  CornerCubie,
  CubieColors,
  FaceColor,
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
const E_SLICE_EDGE_IDS = new Set<EdgeCubieId>(['FR', 'FL', 'BR', 'BL'])

const CORNER_SLOT_SIDES: Record<CornerCubieId, Array<keyof CubieColors>> = {
  UFR: ['upper', 'right', 'front'],
  UFL: ['upper', 'front', 'left'],
  UBL: ['upper', 'left', 'back'],
  UBR: ['upper', 'back', 'right'],
  DFR: ['down', 'front', 'right'],
  DFL: ['down', 'left', 'front'],
  DBL: ['down', 'back', 'left'],
  DBR: ['down', 'right', 'back'],
}

const EDGE_SLOT_PRIMARY_SIDE: Record<EdgeCubieId, keyof CubieColors> = {
  UF: 'upper',
  UR: 'upper',
  UB: 'upper',
  UL: 'upper',
  DF: 'down',
  DR: 'down',
  DB: 'down',
  DL: 'down',
  FR: 'front',
  FL: 'front',
  BR: 'back',
  BL: 'back',
}

const EDGE_COORD_TO_SLOT = new Map<string, EdgeCubieId>()
const CORNER_COORD_TO_SLOT = new Map<string, CornerCubieId>()
{
  const solved = createSolvedCubieBasedCube()
  for (const id of EDGE_IDS) {
    EDGE_COORD_TO_SLOT.set(solved.edges[id].coordinate.join(','), id)
  }
  for (const id of CORNER_IDS) {
    CORNER_COORD_TO_SLOT.set(solved.corners[id].coordinate.join(','), id)
  }
}

const MOVE_FACE_CYCLES: Record<string, { corners: number[]; edges: number[] }> = {
  F: { corners: [1, 0, 4, 5], edges: [0, 8, 4, 9] },
  R: { corners: [0, 3, 7, 4], edges: [1, 10, 5, 8] },
  U: { corners: [0, 1, 2, 3], edges: [0, 3, 2, 1] },
  B: { corners: [3, 2, 6, 7], edges: [2, 11, 6, 10] },
  L: { corners: [2, 1, 5, 6], edges: [3, 9, 7, 11] },
  D: { corners: [5, 4, 7, 6], edges: [4, 5, 6, 7] },
}

const POW3_7 = 2187
const SLICE_COMBO_COUNT = 495
const PHASE1_STATE_COUNT = POW3_7 * SLICE_COMBO_COUNT
const PHASE2_EDGE_COORD_COUNT = 70
const PHASE2_CORNER_COSET_COUNT = 420
const PHASE2_STATE_COUNT = PHASE2_EDGE_COORD_COUNT * PHASE2_CORNER_COSET_COUNT
const EDGE_PERM_COUNT = 479001600
const HOME_E_SLICE_MASK =
  (1 << EDGE_IDS.indexOf('FR')) |
  (1 << EDGE_IDS.indexOf('FL')) |
  (1 << EDGE_IDS.indexOf('BR')) |
  (1 << EDGE_IDS.indexOf('BL'))
const PHASE2_EDGE_TETRAD_PIECES = [0, 2, 4, 6]

const FACTORIALS = [
  1,
  1,
  2,
  6,
  24,
  120,
  720,
  5040,
  40320,
  362880,
  3628800,
  39916800,
  479001600,
]

// 阶段 1 -> 2: 只允许 U/D/R/L 四分之一转 + F/B 半转，目标：角块方向正确 + E-slice 边块归层
const G1_MOVES: Move[] = [
  'R', "R'", 'R2',
  'L', "L'", 'L2',
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F2',
  'B2',
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
function edgeOrientationWrongAtSlot(edge: EdgeCubie, slotId: EdgeCubieId): boolean {
  return edgeOrientationAtSlot(edge, slotId) !== 0
}

function hasColor(colors: CubieColors, color: FaceColor): boolean {
  return (
    colors.upper === color ||
    colors.down === color ||
    colors.front === color ||
    colors.back === color ||
    colors.left === color ||
    colors.right === color
  )
}

function edgeOrientationAtSlot(edge: EdgeCubie, slotId: EdgeCubieId): 0 | 1 {
  const c = edge.colors
  const primarySide = EDGE_SLOT_PRIMARY_SIDE[slotId]
  const primaryColor = c[primarySide]
  if (hasColor(c, FACE_COLORS.U) || hasColor(c, FACE_COLORS.D)) {
    return primaryColor === FACE_COLORS.U || primaryColor === FACE_COLORS.D ? 0 : 1
  }
  return primaryColor === FACE_COLORS.F || primaryColor === FACE_COLORS.B ? 0 : 1
}

function cornerOrientationAtSlot(corner: CornerCubie, slotId: CornerCubieId): 0 | 1 | 2 {
  const c = corner.colors
  const sides = CORNER_SLOT_SIDES[slotId]
  for (let i = 0; i < 3; i++) {
    const color = c[sides[i]]
    if (color === FACE_COLORS.U || color === FACE_COLORS.D) {
      return i as 0 | 1 | 2
    }
  }
  return 0
}

function isCornerOriented(corner: CornerCubie): boolean {
  const slotId = CORNER_COORD_TO_SLOT.get(corner.coordinate.join(','))
  return slotId ? cornerOrientationAtSlot(corner, slotId) === 0 : false
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
    if (edgeOrientationWrongAtSlot(edge, id)) idx |= 1 << i
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
    if (edgeOrientationWrongAtSlot(edge, id)) return false
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

let sliceMaskToIndex: Int16Array | null = null
let sliceIndexToMask: Int16Array | null = null
let coMoveTable: Int16Array | null = null
let sliceMoveTable: Int16Array | null = null
let phase1ParentTable: Int32Array | null = null
let phase1ParentMoveTable: Int8Array | null = null
let phase2CornerCosetByRank: Int16Array | null = null
let phase2ParentTable: Int32Array | null = null
let phase2ParentMoveTable: Int8Array | null = null
let phase2SolvedKey = -1
let phase3IndexByKey: Map<number, number> | null = null
let phase3Keys: number[] | null = null
let phase3ParentTable: number[] | null = null
let phase3ParentMoveTable: number[] | null = null

function moveAmount(move: Move): 1 | 2 | 3 {
  if (move.endsWith('2')) return 2
  if (move.endsWith("'")) return 3
  return 1
}

function cycleArray<T>(input: T[], cycle: number[], amount: 1 | 2 | 3): T[] {
  let out = input.slice()
  for (let turn = 0; turn < amount; turn++) {
    const prev = out.slice()
    out[cycle[0]] = prev[cycle[cycle.length - 1]]
    for (let i = 1; i < cycle.length; i++) {
      out[cycle[i]] = prev[cycle[i - 1]]
    }
  }
  return out
}

function rankPermutation(perm: number[]): number {
  let rank = 0
  for (let i = 0; i < perm.length; i++) {
    let smaller = 0
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[j] < perm[i]) smaller++
    }
    rank += smaller * FACTORIALS[perm.length - 1 - i]
  }
  return rank
}

function unrankPermutation(rank: number, size: number): number[] {
  const items = Array.from({ length: size }, (_, i) => i)
  const perm: number[] = []
  for (let i = size; i >= 1; i--) {
    const f = FACTORIALS[i - 1]
    const selected = Math.floor(rank / f)
    rank %= f
    perm.push(items.splice(selected, 1)[0])
  }
  return perm
}

function decodeCornerOrientationIndex(index: number): number[] {
  const co = new Array(8).fill(0)
  let sum = 0
  for (let i = 6; i >= 0; i--) {
    co[i] = index % 3
    sum += co[i]
    index = Math.floor(index / 3)
  }
  co[7] = (3 - (sum % 3)) % 3
  return co
}

function encodeCornerOrientationVector(co: number[]): number {
  let idx = 0
  for (let i = 0; i < 7; i++) {
    idx = idx * 3 + co[i]
  }
  return idx
}

function applyMoveToCornerOrientationIndex(index: number, move: Move): number {
  const face = move[0]
  const cycle = MOVE_FACE_CYCLES[face].corners
  const amount = moveAmount(move)
  const co = cycleArray(decodeCornerOrientationIndex(index), cycle, amount)
  if (face !== 'U' && face !== 'D' && amount !== 2) {
    for (let i = 0; i < cycle.length; i++) {
      co[cycle[i]] = (co[cycle[i]] + ((i + 1) % 2) + 1) % 3
    }
  }
  return encodeCornerOrientationVector(co)
}

function popCount(n: number): number {
  let count = 0
  while (n !== 0) {
    n &= n - 1
    count++
  }
  return count
}

function combinationCount(n: number, r: number): number {
  if (r < 0 || r > n) return 0
  let result = 1
  for (let i = 1; i <= r; i++) {
    result = (result * (n - r + i)) / i
  }
  return Math.round(result)
}

function rankCombination(items: number[], universeSize: number): number {
  let rank = 0
  let previous = -1
  const k = items.length
  for (let i = 0; i < k; i++) {
    for (let v = previous + 1; v < items[i]; v++) {
      rank += combinationCount(universeSize - v - 1, k - i - 1)
    }
    previous = items[i]
  }
  return rank
}

function buildSliceCombinationIndexes(): void {
  if (sliceMaskToIndex && sliceIndexToMask) return
  const maskToIndex = new Int16Array(1 << EDGE_IDS.length)
  maskToIndex.fill(-1)
  const indexToMask = new Int16Array(SLICE_COMBO_COUNT)
  let idx = 0
  for (let mask = 0; mask < maskToIndex.length; mask++) {
    if (popCount(mask) !== 4) continue
    maskToIndex[mask] = idx
    indexToMask[idx] = mask
    idx++
  }
  sliceMaskToIndex = maskToIndex
  sliceIndexToMask = indexToMask
}

function applyMoveToSliceMask(mask: number, move: Move): number {
  const face = move[0]
  const cycle = MOVE_FACE_CYCLES[face].edges
  const amount = moveAmount(move)
  const bits = EDGE_IDS.map((_, i) => (mask >> i) & 1)
  const moved = cycleArray(bits, cycle, amount)
  let next = 0
  for (let i = 0; i < moved.length; i++) {
    if (moved[i] !== 0) next |= 1 << i
  }
  return next
}

function buildPhase1MoveTables(): void {
  if (coMoveTable && sliceMoveTable) return
  buildSliceCombinationIndexes()

  const coMoves = new Int16Array(POW3_7 * G1_MOVES.length)
  for (let idx = 0; idx < POW3_7; idx++) {
    for (let m = 0; m < G1_MOVES.length; m++) {
      coMoves[idx * G1_MOVES.length + m] = applyMoveToCornerOrientationIndex(idx, G1_MOVES[m])
    }
  }

  const sliceMoves = new Int16Array(SLICE_COMBO_COUNT * G1_MOVES.length)
  for (let idx = 0; idx < SLICE_COMBO_COUNT; idx++) {
    const mask = sliceIndexToMask![idx]
    for (let m = 0; m < G1_MOVES.length; m++) {
      const nextMask = applyMoveToSliceMask(mask, G1_MOVES[m])
      sliceMoves[idx * G1_MOVES.length + m] = sliceMaskToIndex![nextMask]
    }
  }

  coMoveTable = coMoves
  sliceMoveTable = sliceMoves
}

function phase1Index(coIndex: number, sliceIndex: number): number {
  return coIndex * SLICE_COMBO_COUNT + sliceIndex
}

function splitPhase1Index(index: number): { coIndex: number; sliceIndex: number } {
  return {
    coIndex: Math.floor(index / SLICE_COMBO_COUNT),
    sliceIndex: index % SLICE_COMBO_COUNT,
  }
}

function buildPhase1ParentTable(): void {
  if (phase1ParentTable && phase1ParentMoveTable) return
  buildPhase1MoveTables()

  const parents = new Int32Array(PHASE1_STATE_COUNT)
  parents.fill(-1)
  const parentMoves = new Int8Array(PHASE1_STATE_COUNT)
  parentMoves.fill(-1)
  const queue = new Int32Array(PHASE1_STATE_COUNT)
  let head = 0
  let tail = 0

  const solvedSliceIndex = sliceMaskToIndex![HOME_E_SLICE_MASK]
  const solvedIndex = phase1Index(0, solvedSliceIndex)
  parents[solvedIndex] = solvedIndex
  queue[tail++] = solvedIndex

  while (head < tail) {
    const idx = queue[head++]
    const { coIndex, sliceIndex } = splitPhase1Index(idx)
    for (let m = 0; m < G1_MOVES.length; m++) {
      const nextCo = coMoveTable![coIndex * G1_MOVES.length + m]
      const nextSlice = sliceMoveTable![sliceIndex * G1_MOVES.length + m]
      const next = phase1Index(nextCo, nextSlice)
      if (parents[next] !== -1) continue
      parents[next] = idx
      parentMoves[next] = m
      queue[tail++] = next
    }
  }

  phase1ParentTable = parents
  phase1ParentMoveTable = parentMoves
  console.log(`Thistlethwaite: 阶段 1->2 抽象表已构建，可达 ${tail}/${PHASE1_STATE_COUNT} 状态`)
}

function encodeCornerOrientationIndex(state: CubieBasedCubeState): number {
  const byCoord = new Map<string, CornerCubie>()
  for (const corner of Object.values(state.corners)) {
    byCoord.set(corner.coordinate.join(','), corner)
  }
  const co = new Array(8).fill(0)
  for (let i = 0; i < CORNER_IDS.length; i++) {
    const slotId = CORNER_IDS[i]
    const slotCoord = createSolvedCubieBasedCube().corners[slotId].coordinate.join(',')
    const corner = byCoord.get(slotCoord)
    if (!corner) return -1
    co[i] = cornerOrientationAtSlot(corner, slotId)
  }
  return encodeCornerOrientationVector(co)
}

function encodeSliceCombinationIndex(state: CubieBasedCubeState): number {
  buildSliceCombinationIndexes()
  let mask = 0
  for (const edge of Object.values(state.edges)) {
    if (!E_SLICE_EDGE_IDS.has(edge.id)) continue
    const slotId = EDGE_COORD_TO_SLOT.get(edge.coordinate.join(','))
    if (!slotId) return -1
    mask |= 1 << EDGE_IDS.indexOf(slotId)
  }
  return sliceMaskToIndex![mask]
}

function solvePhase1MovesFromTable(state: CubieBasedCubeState): Move[] | null {
  buildPhase1ParentTable()
  const coIndex = encodeCornerOrientationIndex(state)
  const sliceIndex = encodeSliceCombinationIndex(state)
  if (coIndex < 0 || sliceIndex < 0) return null

  const solvedIndex = phase1Index(0, sliceMaskToIndex![HOME_E_SLICE_MASK])
  let idx = phase1Index(coIndex, sliceIndex)
  if (idx === solvedIndex) return []
  if (phase1ParentTable![idx] === -1) return null

  const moves: Move[] = []
  while (idx !== solvedIndex) {
    const moveIndex = phase1ParentMoveTable![idx]
    if (moveIndex < 0) return null
    moves.push(inverseMove(G1_MOVES[moveIndex]))
    idx = phase1ParentTable![idx]
  }

  let verify = cloneCubieBasedState(state)
  for (const move of moves) {
    verify = applyMove(verify, move)
  }
  return isInG2(verify) ? moves : null
}

function applyMoveToEdgePieces(pieces: number[], move: Move): number[] {
  const face = move[0]
  const cycle = MOVE_FACE_CYCLES[face].edges
  return cycleArray(pieces, cycle, moveAmount(move))
}

function phase3Key(cp: number[], ep: number[]): number {
  return rankPermutation(cp) * EDGE_PERM_COUNT + rankPermutation(ep)
}

function decodePhase3Key(key: number): { cp: number[]; ep: number[] } {
  const cpRank = Math.floor(key / EDGE_PERM_COUNT)
  const epRank = key - cpRank * EDGE_PERM_COUNT
  return {
    cp: unrankPermutation(cpRank, 8),
    ep: unrankPermutation(epRank, 12),
  }
}

function applyMoveToCornerPieces(pieces: number[], move: Move): number[] {
  const face = move[0]
  const cycle = MOVE_FACE_CYCLES[face].corners
  return cycleArray(pieces, cycle, moveAmount(move))
}

function applyMoveToCornerAndEdgePieces(
  cp: number[],
  ep: number[],
  move: Move
): { cp: number[]; ep: number[] } {
  return {
    cp: applyMoveToCornerPieces(cp, move),
    ep: applyMoveToEdgePieces(ep, move),
  }
}

function composePiecePermutation(left: number[], right: number[]): number[] {
  return right.map((piece) => left[piece])
}

function buildPhase2CornerCosetTable(): void {
  if (phase2CornerCosetByRank) return

  const halfTurnCornerSubgroup: number[][] = [Array.from({ length: 8 }, (_, i) => i)]
  const seenSubgroup = new Set<number>([0])
  let head = 0
  while (head < halfTurnCornerSubgroup.length) {
    const cp = halfTurnCornerSubgroup[head++]
    for (const move of G3_MOVES) {
      const next = applyMoveToCornerPieces(cp, move)
      const rank = rankPermutation(next)
      if (seenSubgroup.has(rank)) continue
      seenSubgroup.add(rank)
      halfTurnCornerSubgroup.push(next)
    }
  }

  const cosetByRank = new Int16Array(FACTORIALS[8])
  cosetByRank.fill(-1)
  let cosetIndex = 0

  for (let rank = 0; rank < FACTORIALS[8]; rank++) {
    if (cosetByRank[rank] !== -1) continue

    const representative = unrankPermutation(rank, 8)
    for (const halfTurnCorner of halfTurnCornerSubgroup) {
      const member = composePiecePermutation(halfTurnCorner, representative)
      const memberRank = rankPermutation(member)
      if (cosetByRank[memberRank] !== -1 && cosetByRank[memberRank] !== cosetIndex) {
        throw new Error('Thistlethwaite: 阶段 2->3 角块陪集表构建冲突')
      }
      cosetByRank[memberRank] = cosetIndex
    }
    cosetIndex++
  }

  if (cosetIndex !== PHASE2_CORNER_COSET_COUNT) {
    throw new Error(
      `Thistlethwaite: 阶段 2->3 角块陪集数量异常：${cosetIndex}/${PHASE2_CORNER_COSET_COUNT}`
    )
  }

  phase2CornerCosetByRank = cosetByRank
  console.log(
    `Thistlethwaite: 阶段 2->3 角块陪集表已构建，可达 ${cosetIndex}/${PHASE2_CORNER_COSET_COUNT} 状态`
  )
}

function encodePhase2EdgeTetradIndex(ep: number[]): number {
  const positions: number[] = []
  for (let pos = 0; pos < 8; pos++) {
    if (PHASE2_EDGE_TETRAD_PIECES.includes(ep[pos])) {
      positions.push(pos)
    }
  }
  return positions.length === 4 ? rankCombination(positions, 8) : -1
}

function phase2Key(cp: number[], ep: number[]): number | null {
  buildPhase2CornerCosetTable()
  const cornerCoset = phase2CornerCosetByRank![rankPermutation(cp)]
  const edgeTetradIndex = encodePhase2EdgeTetradIndex(ep)
  if (cornerCoset < 0 || edgeTetradIndex < 0) return null
  return cornerCoset * PHASE2_EDGE_COORD_COUNT + edgeTetradIndex
}

function buildPhase2ParentTable(): void {
  if (phase2ParentTable && phase2ParentMoveTable) return

  const parents = new Int32Array(PHASE2_STATE_COUNT)
  parents.fill(-1)
  const parentMoves = new Int8Array(PHASE2_STATE_COUNT)
  parentMoves.fill(-1)
  const representativeCps: number[][] = new Array(PHASE2_STATE_COUNT)
  const representativeEps: number[][] = new Array(PHASE2_STATE_COUNT)
  const queue = new Int32Array(PHASE2_STATE_COUNT)
  let head = 0
  let tail = 0

  const solvedCp = Array.from({ length: 8 }, (_, i) => i)
  const solvedEp = Array.from({ length: 12 }, (_, i) => i)
  const solvedKey = phase2Key(solvedCp, solvedEp)
  if (solvedKey === null) {
    throw new Error('Thistlethwaite: 阶段 2->3 已解状态编码失败')
  }

  phase2SolvedKey = solvedKey
  parents[solvedKey] = solvedKey
  representativeCps[solvedKey] = solvedCp
  representativeEps[solvedKey] = solvedEp
  queue[tail++] = solvedKey

  while (head < tail) {
    const key = queue[head++]
    const cp = representativeCps[key]
    const ep = representativeEps[key]

    for (let m = 0; m < G2_MOVES.length; m++) {
      const nextPieces = applyMoveToCornerAndEdgePieces(cp, ep, G2_MOVES[m])
      const nextKey = phase2Key(nextPieces.cp, nextPieces.ep)
      if (nextKey === null) {
        throw new Error('Thistlethwaite: 阶段 2->3 抽象移动产生非法状态')
      }
      if (parents[nextKey] !== -1) continue

      parents[nextKey] = key
      parentMoves[nextKey] = m
      representativeCps[nextKey] = nextPieces.cp
      representativeEps[nextKey] = nextPieces.ep
      queue[tail++] = nextKey
    }
  }

  if (tail !== PHASE2_STATE_COUNT) {
    throw new Error(
      `Thistlethwaite: 阶段 2->3 抽象表覆盖异常：${tail}/${PHASE2_STATE_COUNT}`
    )
  }

  phase2ParentTable = parents
  phase2ParentMoveTable = parentMoves
  console.log(`Thistlethwaite: 阶段 2->3 抽象表已构建，可达 ${tail}/${PHASE2_STATE_COUNT} 状态`)
}

function solvePhase2MovesFromTable(state: CubieBasedCubeState): Move[] | null {
  buildPhase2ParentTable()
  const cp = encodeCornerPermutation(state)
  const ep = encodeEdgePermutation(state)
  if (!cp || !ep) return null

  let key = phase2Key(cp, ep)
  if (key === null) return null
  if (key === phase2SolvedKey) return isInG3(state) ? [] : null
  if (phase2ParentTable![key] === -1) return null

  const moves: Move[] = []
  while (key !== phase2SolvedKey) {
    const moveIndex = phase2ParentMoveTable![key]
    if (moveIndex < 0) return null
    moves.push(inverseMove(G2_MOVES[moveIndex]))
    key = phase2ParentTable![key]
  }

  let verify = cloneCubieBasedState(state)
  for (const move of moves) {
    verify = applyMove(verify, move)
  }
  return isInG3(verify) ? moves : null
}

function encodeCornerPermutation(state: CubieBasedCubeState): number[] | null {
  const cp = new Array(8).fill(-1)
  for (const corner of Object.values(state.corners)) {
    const slotId = CORNER_COORD_TO_SLOT.get(corner.coordinate.join(','))
    if (!slotId) return null
    cp[CORNER_IDS.indexOf(slotId)] = CORNER_IDS.indexOf(corner.id)
  }
  return cp.some((p) => p < 0) ? null : cp
}

function encodeEdgePermutation(state: CubieBasedCubeState): number[] | null {
  const ep = new Array(12).fill(-1)
  for (const edge of Object.values(state.edges)) {
    const slotId = EDGE_COORD_TO_SLOT.get(edge.coordinate.join(','))
    if (!slotId) return null
    ep[EDGE_IDS.indexOf(slotId)] = EDGE_IDS.indexOf(edge.id)
  }
  return ep.some((p) => p < 0) ? null : ep
}

function buildPhase3ParentTable(): void {
  if (phase3IndexByKey && phase3Keys && phase3ParentTable && phase3ParentMoveTable) return

  const indexByKey = new Map<number, number>()
  const keys: number[] = []
  const parents: number[] = []
  const parentMoves: number[] = []
  const queue: number[] = []

  const solvedCp = Array.from({ length: 8 }, (_, i) => i)
  const solvedEp = Array.from({ length: 12 }, (_, i) => i)
  const solvedKey = phase3Key(solvedCp, solvedEp)
  indexByKey.set(solvedKey, 0)
  keys.push(solvedKey)
  parents.push(0)
  parentMoves.push(-1)
  queue.push(0)

  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    const { cp, ep } = decodePhase3Key(keys[idx])
    for (let m = 0; m < G3_MOVES.length; m++) {
      const nextPieces = applyMoveToCornerAndEdgePieces(cp, ep, G3_MOVES[m])
      const nextKey = phase3Key(nextPieces.cp, nextPieces.ep)
      if (indexByKey.has(nextKey)) continue
      const nextIndex = keys.length
      indexByKey.set(nextKey, nextIndex)
      keys.push(nextKey)
      parents.push(idx)
      parentMoves.push(m)
      queue.push(nextIndex)
    }
  }

  phase3IndexByKey = indexByKey
  phase3Keys = keys
  phase3ParentTable = parents
  phase3ParentMoveTable = parentMoves
  console.log(`Thistlethwaite: 阶段 3->4 半转群表已构建，可达 ${keys.length} 状态`)
}

function solvePhase3MovesFromTable(state: CubieBasedCubeState): Move[] | null {
  buildPhase3ParentTable()
  const cp = encodeCornerPermutation(state)
  const ep = encodeEdgePermutation(state)
  if (!cp || !ep) return null
  const key = phase3Key(cp, ep)
  let idx = phase3IndexByKey!.get(key)
  if (idx === undefined) return null
  if (idx === 0) return []

  const moves: Move[] = []
  while (idx !== 0) {
    const moveIndex = phase3ParentMoveTable![idx]
    if (moveIndex < 0) return null
    moves.push(G3_MOVES[moveIndex])
    idx = phase3ParentTable![idx]
  }

  let verify = cloneCubieBasedState(state)
  for (const move of moves) {
    verify = applyMove(verify, move)
  }
  return isInG0(verify) ? moves : null
}

function encodePhase3StateKey(state: CubieBasedCubeState): number | null {
  const cp = encodeCornerPermutation(state)
  const ep = encodeEdgePermutation(state)
  return cp && ep ? phase3Key(cp, ep) : null
}

async function searchPhase2ToG3Compact(
  state: CubieBasedCubeState,
  maxDepth: number,
  timeoutMs: number,
  maxNodesLimit: number,
  yieldEvery: number,
  onProgress?: (depth: number, queueSize: number) => void
): Promise<Move[] | null> {
  buildPhase3ParentTable()
  const startKey = encodePhase3StateKey(state)
  if (startKey === null) return null
  if (phase3IndexByKey!.has(startKey)) return []

  const startTime = Date.now()
  const queueKeys: number[] = [startKey]
  const parents: number[] = [-1]
  const parentMoves: number[] = [-1]
  const depths: number[] = [0]
  const visited = new Map<number, number>([[startKey, 0]])
  let head = 0

  while (head < queueKeys.length) {
    if (Date.now() - startTime > timeoutMs) {
      console.warn(`阶段 2->3 compact BFS 超时（${timeoutMs}ms），已处理 ${head} 个节点`)
      return null
    }
    if (head >= maxNodesLimit) {
      console.warn(`阶段 2->3 compact BFS 达到最大节点数限制（${maxNodesLimit}）`)
      return null
    }

    const currentIndex = head
    const currentKey = queueKeys[head]
    const depth = depths[head]
    head++

    if (depth >= maxDepth) continue
    if (yieldEvery > 0 && head % yieldEvery === 0) {
      await yieldToBrowser()
    }

    const { cp, ep } = decodePhase3Key(currentKey)
    const lastMoveIndex = parentMoves[currentIndex]
    const lastFace = lastMoveIndex >= 0 ? G2_MOVES[lastMoveIndex][0] : ''

    for (let m = 0; m < G2_MOVES.length; m++) {
      const move = G2_MOVES[m]
      const currentFace = move[0]
      if (lastFace) {
        if (lastFace === currentFace) continue
        if (isOppositePairRedundant(lastFace, currentFace)) continue
      }

      const nextPieces = applyMoveToCornerAndEdgePieces(cp, ep, move)
      const nextKey = phase3Key(nextPieces.cp, nextPieces.ep)
      if (visited.has(nextKey)) continue
      if (queueKeys.length >= maxNodesLimit) {
        console.warn(`阶段 2->3 compact BFS 达到入队节点数限制（${maxNodesLimit}）`)
        return null
      }

      const nextIndex = queueKeys.length
      visited.set(nextKey, nextIndex)
      queueKeys.push(nextKey)
      parents.push(currentIndex)
      parentMoves.push(m)
      depths.push(depth + 1)

      if (phase3IndexByKey!.has(nextKey)) {
        const path: Move[] = []
        let idx = nextIndex
        while (idx > 0) {
          path.push(G2_MOVES[parentMoves[idx]])
          idx = parents[idx]
        }
        path.reverse()
        return path
      }
    }

    if (onProgress && currentIndex % 50_000 === 0) {
      onProgress(depth, queueKeys.length - head)
    }
  }

  return null
}

/**
 * G2：在 G1 基础上，角块朝向正确（U/D 角贴纸在 U/D 面）
 */
function isInG2(state: CubieBasedCubeState): boolean {
  if (!isInG1(state)) return false
  return encodeCornerOrientationIndex(state) === 0 &&
    encodeSliceCombinationIndex(state) === sliceMaskToIndex![HOME_E_SLICE_MASK]
}

/** 角块朝向错误个数（与 isInG2 判定一致；仅当已在 G1 时有意义） */
function wrongCornerOrientationCount(state: CubieBasedCubeState): number {
  let n = 0
  for (const corner of Object.values(state.corners)) {
    if (!isCornerOriented(corner)) n++
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
    if (edgeOrientationWrongAtSlot(edge, id)) n++
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
 * G3：已进入半转群，可仅用 180 度转动还原
 */
function isInG3(state: CubieBasedCubeState): boolean {
  if (!isInG2(state)) return false
  buildPhase3ParentTable()
  const key = encodePhase3StateKey(state)
  return key !== null && phase3IndexByKey!.has(key)
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
  phase01TimeoutMs?: number
  phase01MaxNodes?: number
  phase01RetryTimeoutMs?: number
  phase01RetryMaxNodes?: number
  phase12TimeoutMs?: number
  phase12MaxNodes?: number
  phase12RetryTimeoutMs?: number
  phase12RetryMaxNodes?: number
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
  const t01 = searchTuning?.phase01TimeoutMs ?? 120_000
  const n01 = searchTuning?.phase01MaxNodes ?? 2_000_000
  const t01b = searchTuning?.phase01RetryTimeoutMs ?? 240_000
  const n01b = searchTuning?.phase01RetryMaxNodes ?? 5_000_000
  const t12 = searchTuning?.phase12TimeoutMs ?? 120_000
  const n12 = searchTuning?.phase12MaxNodes ?? 2_000_000
  const t12b = searchTuning?.phase12RetryTimeoutMs ?? 240_000
  const n12b = searchTuning?.phase12RetryMaxNodes ?? 5_000_000
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
        t01,
        n01,
        2500,
        (round, thr) => onProgress?.(0, round, thr)
      )
      if (!path0 && t01b > 0 && n01b > 0) {
        path0 = await searchG0ToG1IDA(
          currentState,
          d + 18,
          d + 30,
          t01b,
          n01b,
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
    console.log('Thistlethwaite: 开始阶段 1->2（角块朝向 + E-slice，抽象查表）')
    const d = maxDepthPerStage
    let path = solvePhase1MovesFromTable(currentState)
    if (!path) {
      console.warn('Thistlethwaite: 阶段 1->2 抽象查表失败，回退 IDA*')
      path = await searchG1ToG2IDA(
        currentState,
        d + 12,
        d + 22,
        t12,
        n12,
        2500,
        (round, thr) => onProgress?.(1, round, thr)
      )
    }
    if (!path && t12b > 0 && n12b > 0) {
      path = await searchG1ToG2IDA(
        currentState,
        d + 18,
        d + 30,
        t12b,
        n12b,
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
  
  // 阶段 2 -> 3: 进入半转群
  if (!isInG3(currentState)) {
    console.log('Thistlethwaite: 开始阶段 2->3（进入半转群，抽象查表）')
    
    let path = solvePhase2MovesFromTable(currentState)
    if (!path) {
      console.warn('Thistlethwaite: 阶段 2->3 抽象查表失败，回退 compact BFS（诊断兜底）')
      path = await searchPhase2ToG3Compact(
        currentState,
        maxDepthPerStage + 8,
        t23,
        Math.max(bfsMax, 1_500_000),
        5000,
        (depth, queueSize) => {
          onProgress?.(2, depth, queueSize)
          console.log(`阶段 2->3 compact: 搜索深度 ${depth}, 队列大小: ${queueSize}`)
        }
      )
    }
    if (!path) {
      console.warn('Thistlethwaite: 阶段 2->3 超时或未找到解')
      console.warn('Thistlethwaite 算法对于此状态太慢，建议：')
      console.warn('1. 使用"反向移动"算法（如果知道打乱序列）')
      console.warn('2. 使用"Kociemba"算法（快速但需要正确的 cubestring 格式）')
      console.warn('3. 使用"IDA*"算法（较慢但能找到最优解）')
      throw new Error('Thistlethwaite 算法失败：阶段 2->3 无法进入半转群。')
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
    console.log('Thistlethwaite: 开始阶段 3->4（半转群查表）')
    
    let path = solvePhase3MovesFromTable(currentState)
    if (!path) {
      console.warn('Thistlethwaite: 阶段 3->4 半转群查表失败，回退 BFS')
      path = await searchInGroup(
        currentState,
        G3_MOVES,
        isInG0,
        maxDepthPerStage + 6,
        (depth, queueSize) => {
          onProgress?.(3, depth, queueSize)
          if (depth % 2 === 0) {
            console.log(`阶段 3->4: 搜索深度 ${depth}, 队列大小: ${queueSize}`)
          }
        },
        t34a,
        bfsMax
      )
    }
    if (!path) {
      console.warn('Thistlethwaite: 无法完成阶段 3->4，尝试增加深度')
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
