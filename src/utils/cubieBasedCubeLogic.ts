/**
 * Cubie-based Cube Logic
 * 
 * 基于 Cubie 的魔方逻辑实现（重构方案）
 * 参考 OPTIMIZATION_PLAN.md 中的方案2：基础数据结构重构
 */

import {
  CubieBasedCubeState,
  CornerCubie,
  EdgeCubie,
  FaceCubie,
  CornerCubieId,
  EdgeCubieId,
  FaceCubieId,
  FACE_COLORS,
  Move,
  FaceColor,
  CubeState,
  Face,
  CubieColors,
} from './cubeTypes'

/**
 * 创建角块颜色（6个面，不可见面用黑色）
 */
function createCornerColors(
  u: FaceColor | null,
  d: FaceColor | null,
  f: FaceColor | null,
  b: FaceColor | null,
  l: FaceColor | null,
  r: FaceColor | null
): CubieColors {
  return {
    U: u ?? 'black',
    D: d ?? 'black',
    F: f ?? 'black',
    B: b ?? 'black',
    L: l ?? 'black',
    R: r ?? 'black',
  }
}

/**
 * 创建边块颜色（6个面，不可见面用黑色）
 */
function createEdgeColors(
  u: FaceColor | null,
  d: FaceColor | null,
  f: FaceColor | null,
  b: FaceColor | null,
  l: FaceColor | null,
  r: FaceColor | null
): CubieColors {
  return {
    U: u ?? 'black',
    D: d ?? 'black',
    F: f ?? 'black',
    B: b ?? 'black',
    L: l ?? 'black',
    R: r ?? 'black',
  }
}

/**
 * 创建已解决的 Cubie-based 魔方状态
 */
export function createSolvedCubieBasedCube(): CubieBasedCubeState {
  // 初始化6个中心块（位置固定，永远不变）
  const faces: Record<FaceCubieId, FaceCubie> = {
    U: { id: 'U', position: 'U', color: FACE_COLORS.U },
    D: { id: 'D', position: 'D', color: FACE_COLORS.D },
    F: { id: 'F', position: 'F', color: FACE_COLORS.F },
    B: { id: 'B', position: 'B', color: FACE_COLORS.B },
    L: { id: 'L', position: 'L', color: FACE_COLORS.L },
    R: { id: 'R', position: 'R', color: FACE_COLORS.R },
  }

  // 初始化8个角块（每个都有6个面的颜色，不可见面用黑色）
  const corners: Record<CornerCubieId, CornerCubie> = {
    // 上层角块
    UFR: {
      id: 'UFR',
      position: 'UFR',
      colors: createCornerColors(FACE_COLORS.U, null, FACE_COLORS.F, null, null, FACE_COLORS.R),
    },
    UFL: {
      id: 'UFL',
      position: 'UFL',
      colors: createCornerColors(FACE_COLORS.U, null, FACE_COLORS.F, null, FACE_COLORS.L, null),
    },
    UBL: {
      id: 'UBL',
      position: 'UBL',
      colors: createCornerColors(FACE_COLORS.U, null, null, FACE_COLORS.B, FACE_COLORS.L, null),
    },
    UBR: {
      id: 'UBR',
      position: 'UBR',
      colors: createCornerColors(FACE_COLORS.U, null, null, FACE_COLORS.B, null, FACE_COLORS.R),
    },
    // 下层角块
    DFR: {
      id: 'DFR',
      position: 'DFR',
      colors: createCornerColors(null, FACE_COLORS.D, FACE_COLORS.F, null, null, FACE_COLORS.R),
    },
    DFL: {
      id: 'DFL',
      position: 'DFL',
      colors: createCornerColors(null, FACE_COLORS.D, FACE_COLORS.F, null, FACE_COLORS.L, null),
    },
    DBL: {
      id: 'DBL',
      position: 'DBL',
      colors: createCornerColors(null, FACE_COLORS.D, null, FACE_COLORS.B, FACE_COLORS.L, null),
    },
    DBR: {
      id: 'DBR',
      position: 'DBR',
      colors: createCornerColors(null, FACE_COLORS.D, null, FACE_COLORS.B, null, FACE_COLORS.R),
    },
  }

  // 初始化12个边块（每个都有6个面的颜色，不可见面用黑色）
  const edges: Record<EdgeCubieId, EdgeCubie> = {
    // 上层边块
    UF: {
      id: 'UF',
      position: 'UF',
      colors: createEdgeColors(FACE_COLORS.U, null, FACE_COLORS.F, null, null, null),
    },
    UR: {
      id: 'UR',
      position: 'UR',
      colors: createEdgeColors(FACE_COLORS.U, null, null, null, null, FACE_COLORS.R),
    },
    UB: {
      id: 'UB',
      position: 'UB',
      colors: createEdgeColors(FACE_COLORS.U, null, null, FACE_COLORS.B, null, null),
    },
    UL: {
      id: 'UL',
      position: 'UL',
      colors: createEdgeColors(FACE_COLORS.U, null, null, null, FACE_COLORS.L, null),
    },
    // 下层边块
    DF: {
      id: 'DF',
      position: 'DF',
      colors: createEdgeColors(null, FACE_COLORS.D, FACE_COLORS.F, null, null, null),
    },
    DR: {
      id: 'DR',
      position: 'DR',
      colors: createEdgeColors(null, FACE_COLORS.D, null, null, null, FACE_COLORS.R),
    },
    DB: {
      id: 'DB',
      position: 'DB',
      colors: createEdgeColors(null, FACE_COLORS.D, null, FACE_COLORS.B, null, null),
    },
    DL: {
      id: 'DL',
      position: 'DL',
      colors: createEdgeColors(null, FACE_COLORS.D, null, null, FACE_COLORS.L, null),
    },
    // 中层边块
    FR: {
      id: 'FR',
      position: 'FR',
      colors: createEdgeColors(null, null, FACE_COLORS.F, null, null, FACE_COLORS.R),
    },
    FL: {
      id: 'FL',
      position: 'FL',
      colors: createEdgeColors(null, null, FACE_COLORS.F, null, FACE_COLORS.L, null),
    },
    BR: {
      id: 'BR',
      position: 'BR',
      colors: createEdgeColors(null, null, null, FACE_COLORS.B, null, FACE_COLORS.R),
    },
    BL: {
      id: 'BL',
      position: 'BL',
      colors: createEdgeColors(null, null, null, FACE_COLORS.B, FACE_COLORS.L, null),
    },
  }

  return { corners, edges, faces }
}

/**
 * 克隆 Cubie-based 状态（深拷贝）
 */
export function cloneCubieBasedState(state: CubieBasedCubeState): CubieBasedCubeState {
  const newCorners: Record<CornerCubieId, CornerCubie> = {} as Record<CornerCubieId, CornerCubie>
  for (const [id, corner] of Object.entries(state.corners)) {
    newCorners[id as CornerCubieId] = {
      ...corner,
      colors: { ...corner.colors },
    }
  }

  const newEdges: Record<EdgeCubieId, EdgeCubie> = {} as Record<EdgeCubieId, EdgeCubie>
  for (const [id, edge] of Object.entries(state.edges)) {
    newEdges[id as EdgeCubieId] = {
      ...edge,
      colors: { ...edge.colors },
    }
  }

  const newFaces: Record<FaceCubieId, FaceCubie> = {} as Record<FaceCubieId, FaceCubie>
  for (const [id, face] of Object.entries(state.faces)) {
    newFaces[id as FaceCubieId] = { ...face }
  }

  return {
    corners: newCorners,
    edges: newEdges,
    faces: newFaces,
  }
}

/**
 * 绕x轴旋转cubie颜色（R/L面旋转）
 * 顺时针：U->F->D->B->U
 */
function rotateColorsAroundXAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    return {
      U: colors.B,
      D: colors.F,
      F: colors.U,
      B: colors.D,
      L: colors.L,
      R: colors.R,
    }
  } else {
    return {
      U: colors.F,
      D: colors.B,
      F: colors.D,
      B: colors.U,
      L: colors.L,
      R: colors.R,
    }
  }
}

/**
 * 绕y轴旋转cubie颜色（U/D面旋转）
 * 顺时针（从上面看）：F->L->B->R->F
 * 逆时针（从上面看）：F->R->B->L->F
 */
function rotateColorsAroundYAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 从上面看顺时针
    return {
      U: colors.U,
      D: colors.D,
      F: colors.L,
      B: colors.R,
      L: colors.B,
      R: colors.F,
    }
  } else {
    // 从上面看逆时针
    return {
      U: colors.U,
      D: colors.D,
      F: colors.R,
      B: colors.L,
      L: colors.F,
      R: colors.B,
    }
  }
}

/**
 * 绕z轴旋转cubie颜色（F/B面旋转）
 * 顺时针（从前面看）：U->L->D->R->U
 * 逆时针（从前面看）：U->R->D->L->U
 */
function rotateColorsAroundZAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 从前面看顺时针
    return {
      U: colors.L,
      D: colors.R,
      F: colors.F,
      B: colors.B,
      L: colors.D,
      R: colors.U,
    }
  } else {
    // 从前面看逆时针
    return {
      U: colors.R,
      D: colors.L,
      F: colors.F,
      B: colors.B,
      L: colors.U,
      R: colors.D,
    }
  }
}

/**
 * 通过position查找corner cubie
 */
function findCornerByPosition(state: CubieBasedCubeState, position: CornerCubieId): CornerCubieId {
  for (const [id, corner] of Object.entries(state.corners)) {
    if (corner.position === position) {
      return id as CornerCubieId
    }
  }
  throw new Error(`Corner cubie not found at position ${position}`)
}

/**
 * 旋转角块循环（简化版本：只替换位置，不旋转颜色）
 * @param state 状态
 * @param cycle 循环顺序，例如 ['UFR', 'DFR', 'DBR', 'UBR'] 表示 UFR位置 -> DFR位置 -> DBR位置 -> UBR位置 -> UFR位置
 * @param clockwise 是否顺时针（影响循环方向）
 */
function cycleCorners(
  state: CubieBasedCubeState,
  cycle: readonly CornerCubieId[],
  clockwise: boolean = true
): void {
  // 找到每个位置上的cubie id
  const cubieIds: CornerCubieId[] = cycle.map(pos => findCornerByPosition(state, pos))

  // 移动位置
  for (let i = 0; i < cycle.length; i++) {
    const nextIndex = clockwise ? (i + 1) % cycle.length : (i - 1 + cycle.length) % cycle.length
    const cubieId = cubieIds[i]
    const nextPosition = cycle[nextIndex]
    
    // 更新位置
    state.corners[cubieId].position = nextPosition
  }
}

/**
 * 通过position查找edge cubie
 */
function findEdgeByPosition(state: CubieBasedCubeState, position: EdgeCubieId): EdgeCubieId {
  for (const [id, edge] of Object.entries(state.edges)) {
    if (edge.position === position) {
      return id as EdgeCubieId
    }
  }
  throw new Error(`Edge cubie not found at position ${position}`)
}

/**
 * 旋转边块循环（简化版本：只替换位置，不旋转颜色）
 * @param state 状态
 * @param cycle 循环顺序
 * @param clockwise 是否顺时针（影响循环方向）
 */
function cycleEdges(
  state: CubieBasedCubeState,
  cycle: readonly EdgeCubieId[],
  clockwise: boolean = true
): void {
  // 找到每个位置上的cubie id
  const cubieIds: EdgeCubieId[] = cycle.map(pos => findEdgeByPosition(state, pos))

  // 移动位置
  for (let i = 0; i < cycle.length; i++) {
    const nextIndex = clockwise ? (i + 1) % cycle.length : (i - 1 + cycle.length) % cycle.length
    const cubieId = cubieIds[i]
    const nextPosition = cycle[nextIndex]
    
    // 更新位置
    state.edges[cubieId].position = nextPosition
  }
}

/**
 * 旋转指定cubie的颜色（用于旋转操作后的颜色旋转）
 */
function rotateCornerColors(
  state: CubieBasedCubeState,
  cornerId: CornerCubieId,
  rotateFn: (colors: CubieColors, clockwise: boolean) => CubieColors,
  clockwise: boolean
): void {
  state.corners[cornerId].colors = rotateFn(state.corners[cornerId].colors, clockwise)
}

/**
 * 旋转指定cubie的颜色（用于旋转操作后的颜色旋转）
 */
function rotateEdgeColors(
  state: CubieBasedCubeState,
  edgeId: EdgeCubieId,
  rotateFn: (colors: CubieColors, clockwise: boolean) => CubieColors,
  clockwise: boolean
): void {
  state.edges[edgeId].colors = rotateFn(state.edges[edgeId].colors, clockwise)
}

/**
 * R面顺时针旋转（绕x轴顺时针90度）
 * 第一步：替换位置
 *   - 角块循环：UFR -> DFR -> DBR -> UBR -> UFR
 *   - 边块循环：UR -> FR -> DR -> BR -> UR
 * 第二步：旋转颜色（绕x轴顺时针90度）
 */
export function rotateR(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 根据旧代码：U的右列 → F的右列 → D的右列 → B的左列 → U的右列
  // 这意味着：UFR位置 -> DFR位置 -> DBR位置 -> UBR位置 -> UFR位置
  // 第一步：替换位置（顺时针循环：UFR -> DFR -> DBR -> UBR -> UFR）
  const cornerCycle: CornerCubieId[] = ['UFR', 'DFR', 'DBR', 'UBR']
  const edgeCycle: EdgeCubieId[] = ['UR', 'FR', 'DR', 'BR']
  
  cycleCorners(newState, cornerCycle, true)
  cycleEdges(newState, edgeCycle, true)
  
  // 第二步：旋转颜色（绕x轴顺时针90度）
  // 找到旋转后的cubie ID（位置已经改变）
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundXAxis, true)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundXAxis, true)
  }
  
  return newState
}

/**
 * R'面逆时针旋转（绕x轴逆时针90度）
 * 第一步：替换位置（逆时针）
 * 第二步：旋转颜色（绕x轴逆时针90度）
 */
export function rotateRPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 第一步：替换位置（逆时针循环）
  const cornerCycle: CornerCubieId[] = ['UFR', 'DFR', 'DBR', 'UBR']
  const edgeCycle: EdgeCubieId[] = ['UR', 'FR', 'DR', 'BR']
  
  cycleCorners(newState, cornerCycle, false)
  cycleEdges(newState, edgeCycle, false)
  
  // 第二步：旋转颜色（绕x轴逆时针90度）
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundXAxis, false)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundXAxis, false)
  }
  
  return newState
}

/**
 * L面顺时针旋转（绕x轴逆时针90度，从标准视角看）
 * 第一步：替换位置
 * 第二步：旋转颜色（绕x轴逆时针90度）
 */
export function rotateL(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UFL', 'UBL', 'DBL', 'DFL']
  const edgeCycle: EdgeCubieId[] = ['UL', 'BL', 'DL', 'FL']
  
  cycleCorners(newState, cornerCycle, true)
  cycleEdges(newState, edgeCycle, true)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundXAxis, false)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundXAxis, false)
  }
  
  return newState
}

/**
 * L'面逆时针旋转
 */
export function rotateLPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UFL', 'UBL', 'DBL', 'DFL']
  const edgeCycle: EdgeCubieId[] = ['UL', 'BL', 'DL', 'FL']
  
  cycleCorners(newState, cornerCycle, false)
  cycleEdges(newState, edgeCycle, false)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundXAxis, true)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundXAxis, true)
  }
  
  return newState
}

/**
 * U面顺时针旋转（绕y轴逆时针90度，从上面看）
 * 第一步：替换位置
 * 第二步：旋转颜色（绕y轴逆时针90度）
 */
export function rotateU(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UFR', 'UBR', 'UBL', 'UFL']
  const edgeCycle: EdgeCubieId[] = ['UF', 'UR', 'UB', 'UL']
  
  cycleCorners(newState, cornerCycle, true)
  cycleEdges(newState, edgeCycle, true)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundYAxis, false)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundYAxis, false)
  }
  
  return newState
}

/**
 * U'面逆时针旋转
 */
export function rotateUPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UFR', 'UBR', 'UBL', 'UFL']
  const edgeCycle: EdgeCubieId[] = ['UF', 'UR', 'UB', 'UL']
  
  cycleCorners(newState, cornerCycle, false)
  cycleEdges(newState, edgeCycle, false)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundYAxis, true)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundYAxis, true)
  }
  
  return newState
}

/**
 * D面顺时针旋转（绕y轴顺时针90度，从下面看）
 * 第一步：替换位置
 * 第二步：旋转颜色（绕y轴顺时针90度）
 */
export function rotateD(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['DFR', 'DFL', 'DBL', 'DBR']
  const edgeCycle: EdgeCubieId[] = ['DF', 'DL', 'DB', 'DR']
  
  cycleCorners(newState, cornerCycle, true)
  cycleEdges(newState, edgeCycle, true)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundYAxis, true)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundYAxis, true)
  }
  
  return newState
}

/**
 * D'面逆时针旋转
 */
export function rotateDPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['DFR', 'DFL', 'DBL', 'DBR']
  const edgeCycle: EdgeCubieId[] = ['DF', 'DL', 'DB', 'DR']
  
  cycleCorners(newState, cornerCycle, false)
  cycleEdges(newState, edgeCycle, false)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundYAxis, false)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundYAxis, false)
  }
  
  return newState
}

/**
 * F面顺时针旋转（绕z轴顺时针90度，从前面看）
 * 第一步：替换位置
 * 第二步：旋转颜色（绕z轴顺时针90度）
 */
export function rotateF(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UFR', 'UFL', 'DFL', 'DFR']
  const edgeCycle: EdgeCubieId[] = ['UF', 'FL', 'DF', 'FR']
  
  cycleCorners(newState, cornerCycle, true)
  cycleEdges(newState, edgeCycle, true)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundZAxis, true)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundZAxis, true)
  }
  
  return newState
}

/**
 * F'面逆时针旋转
 */
export function rotateFPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UFR', 'UFL', 'DFL', 'DFR']
  const edgeCycle: EdgeCubieId[] = ['UF', 'FL', 'DF', 'FR']
  
  cycleCorners(newState, cornerCycle, false)
  cycleEdges(newState, edgeCycle, false)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundZAxis, false)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundZAxis, false)
  }
  
  return newState
}

/**
 * B面顺时针旋转（绕z轴逆时针90度，从前面看）
 * 第一步：替换位置
 * 第二步：旋转颜色（绕z轴逆时针90度）
 */
export function rotateB(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UBR', 'UBL', 'DBL', 'DBR']
  const edgeCycle: EdgeCubieId[] = ['UB', 'BR', 'DB', 'BL']
  
  cycleCorners(newState, cornerCycle, true)
  cycleEdges(newState, edgeCycle, true)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundZAxis, false)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundZAxis, false)
  }
  
  return newState
}

/**
 * B'面逆时针旋转
 */
export function rotateBPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  const cornerCycle: CornerCubieId[] = ['UBR', 'UBL', 'DBL', 'DBR']
  const edgeCycle: EdgeCubieId[] = ['UB', 'BR', 'DB', 'BL']
  
  cycleCorners(newState, cornerCycle, false)
  cycleEdges(newState, edgeCycle, false)
  
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundZAxis, true)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundZAxis, true)
  }
  
  return newState
}

/**
 * 将CornerCubieId转换为3D坐标 (x, y, z)
 */
function cornerIdToCoords(cornerId: CornerCubieId): [number, number, number] {
  const map: Record<CornerCubieId, [number, number, number]> = {
    UFR: [1, 1, 1],   // Up-Front-Right
    UFL: [-1, 1, 1],  // Up-Front-Left
    UBL: [-1, 1, -1], // Up-Back-Left
    UBR: [1, 1, -1],  // Up-Back-Right
    DFR: [1, -1, 1],  // Down-Front-Right
    DFL: [-1, -1, 1], // Down-Front-Left
    DBL: [-1, -1, -1], // Down-Back-Left
    DBR: [1, -1, -1], // Down-Back-Right
  }
  return map[cornerId]
}

/**
 * 将EdgeCubieId转换为3D坐标 (x, y, z)
 * 边块在面的交界处，坐标为两个面的中间位置（0或±1）
 */
function edgeIdToCoords(edgeId: EdgeCubieId): [number, number, number] {
  const map: Record<EdgeCubieId, [number, number, number]> = {
    UF: [0, 1, 1],   // Up-Front
    UR: [1, 1, 0],   // Up-Right
    UB: [0, 1, -1],  // Up-Back
    UL: [-1, 1, 0],  // Up-Left
    DF: [0, -1, 1],  // Down-Front
    DR: [1, -1, 0],  // Down-Right
    DB: [0, -1, -1], // Down-Back
    DL: [-1, -1, 0], // Down-Left
    FR: [1, 0, 1],   // Front-Right
    FL: [-1, 0, 1],  // Front-Left
    BR: [1, 0, -1],  // Back-Right
    BL: [-1, 0, -1], // Back-Left
  }
  return map[edgeId]
}

/**
 * 获取角块的面顺序（按照U/D, F/B, R/L的优先级）
 */
function getCornerFaceOrder(cornerId: CornerCubieId): Face[] {
  const faces: Face[] = []
  // 按照 U/D, F/B, R/L 的顺序
  if (cornerId.includes('U')) faces.push('U')
  else if (cornerId.includes('D')) faces.push('D')
  
  if (cornerId.includes('F')) faces.push('F')
  else if (cornerId.includes('B')) faces.push('B')
  
  if (cornerId.includes('R')) faces.push('R')
  else if (cornerId.includes('L')) faces.push('L')
  
  return faces
}

/**
 * 获取corner cubie在指定位置时，各个面的颜色（简化版本：直接从colors读取）
 * @param corner 角块
 * @param position 当前位置
 * @returns 各个面的颜色映射
 */
function getCornerFaceColors(corner: CornerCubie, position: CornerCubieId): Partial<Record<Face, FaceColor>> {
  // 获取position对应的面（按照固定顺序）
  const positionFaces = getCornerFaceOrder(position)
  
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 简化版本：直接从colors读取对应面的颜色
  for (const face of positionFaces) {
    const color = corner.colors[face]
    // 只返回非黑色的颜色（黑色是不可见的面）
    if (color && color !== 'black') {
      result[face] = color
    }
  }

  return result
}

/**
 * 获取edge cubie在指定位置时，各个面的颜色（简化版本：直接从colors读取）
 * @param edge 边块
 * @param position 当前位置
 * @returns 各个面的颜色映射
 */
function getEdgeFaceColors(edge: EdgeCubie, position: EdgeCubieId): Partial<Record<Face, FaceColor>> {
  // 获取position对应的面
  const positionFaces: Face[] = []
  if (position.includes('U')) positionFaces.push('U')
  if (position.includes('D')) positionFaces.push('D')
  if (position.includes('F')) positionFaces.push('F')
  if (position.includes('B')) positionFaces.push('B')
  if (position.includes('L')) positionFaces.push('L')
  if (position.includes('R')) positionFaces.push('R')

  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 简化版本：直接从colors读取对应面的颜色
  for (const face of positionFaces) {
    const color = edge.colors[face]
    // 只返回非黑色的颜色（黑色是不可见的面）
    if (color && color !== 'black') {
      result[face] = color
    }
  }

  return result
}

/**
 * 从CubieBasedCubeState计算面颜色数组（用于渲染）
 */
export function cubieBasedStateToFaceColors(state: CubieBasedCubeState): CubeState {
  // 初始化所有面为null
  const faceColors: CubeState = {
    U: Array(3).fill(null).map(() => Array(3).fill(null)) as FaceColor[][],
    D: Array(3).fill(null).map(() => Array(3).fill(null)) as FaceColor[][],
    F: Array(3).fill(null).map(() => Array(3).fill(null)) as FaceColor[][],
    B: Array(3).fill(null).map(() => Array(3).fill(null)) as FaceColor[][],
    L: Array(3).fill(null).map(() => Array(3).fill(null)) as FaceColor[][],
    R: Array(3).fill(null).map(() => Array(3).fill(null)) as FaceColor[][],
  }

  // 处理中心块
  for (const face of Object.values(state.faces)) {
    const [row, col] = getFaceCenterCoords(face.position)
    faceColors[face.position][row][col] = face.color
  }

  // 处理角块
  for (const corner of Object.values(state.corners)) {
    const [x, y, z] = cornerIdToCoords(corner.position)
    const colors = getCornerFaceColors(corner, corner.position)

    // 映射到各个面
    if (y === 1 && colors.U) {
      // U面: row = z+1, col = x+1
      faceColors.U[z + 1][x + 1] = colors.U
    }
    if (y === -1 && colors.D) {
      // D面: row = 1-z, col = x+1
      faceColors.D[1 - z][x + 1] = colors.D
    }
    if (z === 1 && colors.F) {
      // F面: row = 1-y, col = x+1
      faceColors.F[1 - y][x + 1] = colors.F
    }
    if (z === -1 && colors.B) {
      // B面: row = 1-y, col = 1-x
      faceColors.B[1 - y][1 - x] = colors.B
    }
    if (x === 1 && colors.R) {
      // R面: row = 1-y, col = 1-z
      faceColors.R[1 - y][1 - z] = colors.R
    }
    if (x === -1 && colors.L) {
      // L面: row = 1-y, col = z+1
      faceColors.L[1 - y][z + 1] = colors.L
    }
  }

  // 处理边块
  for (const edge of Object.values(state.edges)) {
    const [x, y, z] = edgeIdToCoords(edge.position)
    const colors = getEdgeFaceColors(edge, edge.position)

    // 映射到各个面
    if (y === 1 && colors.U) {
      faceColors.U[z + 1][x + 1] = colors.U
    }
    if (y === -1 && colors.D) {
      faceColors.D[1 - z][x + 1] = colors.D
    }
    if (z === 1 && colors.F) {
      faceColors.F[1 - y][x + 1] = colors.F
    }
    if (z === -1 && colors.B) {
      faceColors.B[1 - y][1 - x] = colors.B
    }
    if (x === 1 && colors.R) {
      faceColors.R[1 - y][1 - z] = colors.R
    }
    if (x === -1 && colors.L) {
      faceColors.L[1 - y][z + 1] = colors.L
    }
  }

  return faceColors
}

/**
 * 获取中心块在面数组中的坐标
 */
function getFaceCenterCoords(_faceId: FaceCubieId): [number, number] {
  // 中心块总是在面的中心位置 (1, 1)
  return [1, 1]
}

/**
 * 应用移动操作
 */
export function applyMove(state: CubieBasedCubeState, move: Move): CubieBasedCubeState {
  // 处理带2的旋转（转180度）
  if (move.endsWith('2')) {
    const baseMove = move.slice(0, -1) as Move
    const result1 = applyMove(state, baseMove)
    return applyMove(result1, baseMove)
  }

  // 处理反向旋转
  if (move.endsWith("'")) {
    const baseMove = move.slice(0, -1) as Move
    // 转3次相当于反向转1次
    let result = cloneCubieBasedState(state)
    for (let i = 0; i < 3; i++) {
      result = applyMove(result, baseMove as Move)
    }
    return result
  }

  // 基本旋转
  switch (move) {
    case 'R':
      return rotateR(state)
    case 'L':
      return rotateL(state)
    case 'U':
      return rotateU(state)
    case 'D':
      return rotateD(state)
    case 'F':
      return rotateF(state)
    case 'B':
      return rotateB(state)
    default:
      return cloneCubieBasedState(state)
  }
}
