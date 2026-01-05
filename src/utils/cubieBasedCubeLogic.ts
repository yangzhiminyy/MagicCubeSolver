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
 * 旋转角块循环
 * @param state 状态
 * @param cycle 循环顺序，例如 ['UFR', 'DFR', 'DBR', 'UBR'] 表示 UFR位置 -> DFR位置 -> DBR位置 -> UBR位置 -> UFR位置
 * @param clockwise 是否顺时针（影响orientation的变化）
 */
function cycleCorners(
  state: CubieBasedCubeState,
  cycle: readonly CornerCubieId[],
  clockwise: boolean = true
): void {
  // 找到每个位置上的cubie id
  const cubieIds: CornerCubieId[] = cycle.map(pos => findCornerByPosition(state, pos))
  const orientations: (0 | 1 | 2)[] = cubieIds.map(id => state.corners[id].orientation)

  // 移动位置
  for (let i = 0; i < cycle.length; i++) {
    const nextIndex = clockwise ? (i + 1) % cycle.length : (i - 1 + cycle.length) % cycle.length
    const cubieId = cubieIds[i]
    const nextPosition = cycle[nextIndex]
    
    // 更新位置
    state.corners[cubieId].position = nextPosition
    
    // 更新方向：角块每转一次，orientation + 1 (顺时针) 或 - 1 (逆时针)
    // 注意：这里使用的是移动前的orientation，因为我们要基于当前状态计算新orientation
    const currentOrientation = orientations[i]
    if (clockwise) {
      state.corners[cubieId].orientation = ((currentOrientation + 1) % 3) as 0 | 1 | 2
    } else {
      state.corners[cubieId].orientation = ((currentOrientation - 1 + 3) % 3) as 0 | 1 | 2
    }
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
 * 旋转边块循环
 * @param state 状态
 * @param cycle 循环顺序
 * @param clockwise 是否顺时针（影响orientation的变化）
 */
function cycleEdges(
  state: CubieBasedCubeState,
  cycle: readonly EdgeCubieId[],
  clockwise: boolean = true
): void {
  // 找到每个位置上的cubie id
  const cubieIds: EdgeCubieId[] = cycle.map(pos => findEdgeByPosition(state, pos))
  const orientations: (0 | 1)[] = cubieIds.map(id => state.edges[id].orientation)

  // 移动位置
  for (let i = 0; i < cycle.length; i++) {
    const nextIndex = clockwise ? (i + 1) % cycle.length : (i - 1 + cycle.length) % cycle.length
    const cubieId = cubieIds[i]
    const nextPosition = cycle[nextIndex]
    
    // 更新位置
    state.edges[cubieId].position = nextPosition
    
    // 更新方向：边块每转一次，orientation翻转（0变1，1变0）
    state.edges[cubieId].orientation = orientations[i] === 0 ? 1 : 0
  }
}

/**
 * R面顺时针旋转
 * 根据旧代码：U的右列 → F的右列 → D的右列 → B的左列 → U的右列
 * 这意味着：
 * - UFR位置上的cubie -> DFR位置
 * - DFR位置上的cubie -> DBR位置  
 * - DBR位置上的cubie -> UBR位置
 * - UBR位置上的cubie -> UFR位置
 * 
 * 但是，从R面看（从右侧看），顺时针旋转应该是：
 * - 上面的角块（UFR）-> 前面的角块（DFR）
 * - 前面的角块（DFR）-> 下面的角块（DBR）
 * - 下面的角块（DBR）-> 后面的角块（UBR）
 * - 后面的角块（UBR）-> 上面的角块（UFR）
 * 
 * 所以循环顺序应该是：UFR -> DFR -> DBR -> UBR -> UFR
 * 但是，如果从标准视角看（从前面看），R面顺时针旋转应该是逆时针的循环
 * 
 * 让我检查一下：从前面看R面，顺时针旋转时：
 * - UFR -> UBR -> DBR -> DFR -> UFR（这是从前面看的顺时针）
 * 
 * 但是从R面自己看，顺时针旋转应该是：
 * - UFR -> DFR -> DBR -> UBR -> UFR
 * 
 * 根据旧代码的实现，应该是：UFR -> DFR -> DBR -> UBR -> UFR
 */
export function rotateR(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 根据旧代码：U的右列 → F的右列 → D的右列 → B的左列 → U的右列
  // 这意味着：UFR位置 -> DFR位置 -> DBR位置 -> UBR位置 -> UFR位置
  // 但是，如果看起来是逆时针，可能需要反转循环顺序
  // 从R面看（从右侧看），顺时针旋转应该是：UFR -> DFR -> DBR -> UBR -> UFR
  // 但如果从前面看，顺时针旋转应该是逆时针的循环：UBR -> UFR -> DFR -> DBR -> UBR
  // 尝试反转循环顺序，同时保持clockwise=true（这样orientation的计算方向也会相应调整）
  cycleCorners(newState, ['UBR', 'UFR', 'DFR', 'DBR'], true)
  
  // 边块循环：UR -> FR -> DR -> BR -> UR
  // 同样反转：BR -> UR -> FR -> DR -> BR
  cycleEdges(newState, ['BR', 'UR', 'FR', 'DR'], true)
  
  return newState
}

/**
 * R'面逆时针旋转
 */
export function rotateRPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 角块循环（逆时针）
  cycleCorners(newState, ['UFR', 'DFR', 'DBR', 'UBR'], false)
  
  // 边块循环（逆时针）
  cycleEdges(newState, ['UR', 'FR', 'DR', 'BR'], false)
  
  return newState
}

/**
 * L面顺时针旋转
 * 角块循环：UFL -> DBL -> DFL -> UBL -> UFL（从L面看是顺时针）
 * 边块循环：UL -> BL -> DL -> FL -> UL
 */
export function rotateL(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 角块循环（从L面看顺时针，从标准视角看是逆时针）
  cycleCorners(newState, ['UFL', 'UBL', 'DBL', 'DFL'], true)
  
  // 边块循环
  cycleEdges(newState, ['UL', 'BL', 'DL', 'FL'], true)
  
  return newState
}

/**
 * L'面逆时针旋转
 */
export function rotateLPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  cycleCorners(newState, ['UFL', 'UBL', 'DBL', 'DFL'], false)
  cycleEdges(newState, ['UL', 'BL', 'DL', 'FL'], false)
  
  return newState
}

/**
 * U面顺时针旋转
 * 角块循环：UFR -> UBR -> UBL -> UFL -> UFR
 * 边块循环：UF -> UR -> UB -> UL -> UF
 */
export function rotateU(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 角块循环（顺时针）
  cycleCorners(newState, ['UFR', 'UBR', 'UBL', 'UFL'], true)
  
  // 边块循环（顺时针）
  cycleEdges(newState, ['UF', 'UR', 'UB', 'UL'], true)
  
  return newState
}

/**
 * U'面逆时针旋转
 */
export function rotateUPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  cycleCorners(newState, ['UFR', 'UBR', 'UBL', 'UFL'], false)
  cycleEdges(newState, ['UF', 'UR', 'UB', 'UL'], false)
  
  return newState
}

/**
 * D面顺时针旋转
 * 角块循环：DFR -> DFL -> DBL -> DBR -> DFR
 * 边块循环：DF -> DL -> DB -> DR -> DF
 */
export function rotateD(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 角块循环（顺时针）
  cycleCorners(newState, ['DFR', 'DFL', 'DBL', 'DBR'], true)
  
  // 边块循环（顺时针）
  cycleEdges(newState, ['DF', 'DL', 'DB', 'DR'], true)
  
  return newState
}

/**
 * D'面逆时针旋转
 */
export function rotateDPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  cycleCorners(newState, ['DFR', 'DFL', 'DBL', 'DBR'], false)
  cycleEdges(newState, ['DF', 'DL', 'DB', 'DR'], false)
  
  return newState
}

/**
 * F面顺时针旋转
 * 角块循环：UFR -> UFL -> DFL -> DFR -> UFR
 * 边块循环：UF -> FL -> DF -> FR -> UF
 */
export function rotateF(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 角块循环（顺时针）
  cycleCorners(newState, ['UFR', 'UFL', 'DFL', 'DFR'], true)
  
  // 边块循环（顺时针）
  cycleEdges(newState, ['UF', 'FL', 'DF', 'FR'], true)
  
  return newState
}

/**
 * F'面逆时针旋转
 */
export function rotateFPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  cycleCorners(newState, ['UFR', 'UFL', 'DFL', 'DFR'], false)
  cycleEdges(newState, ['UF', 'FL', 'DF', 'FR'], false)
  
  return newState
}

/**
 * B面顺时针旋转
 * 角块循环：UBR -> UBL -> DBL -> DBR -> UBR
 * 边块循环：UB -> BR -> DB -> BL -> UB
 */
export function rotateB(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 角块循环（顺时针）
  cycleCorners(newState, ['UBR', 'UBL', 'DBL', 'DBR'], true)
  
  // 边块循环（顺时针）
  cycleEdges(newState, ['UB', 'BR', 'DB', 'BL'], true)
  
  return newState
}

/**
 * B'面逆时针旋转
 */
export function rotateBPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  cycleCorners(newState, ['UBR', 'UBL', 'DBL', 'DBR'], false)
  cycleEdges(newState, ['UB', 'BR', 'DB', 'BL'], false)
  
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
 * 获取corner cubie在指定位置时，各个面的颜色
 * @param corner 角块
 * @param position 当前位置
 * @returns 各个面的颜色映射
 */
function getCornerFaceColors(corner: CornerCubie, position: CornerCubieId): Partial<Record<Face, FaceColor>> {
  // 获取position对应的面（按照固定顺序）
  const positionFaces = getCornerFaceOrder(position)
  
  // 获取原始颜色的面（按照固定顺序）
  const originalFaces = getCornerFaceOrder(corner.id)

  // 根据orientation旋转颜色映射
  // orientation = 0: 原始顺序 (originalFaces[0] -> positionFaces[0], originalFaces[1] -> positionFaces[1], originalFaces[2] -> positionFaces[2])
  // orientation = 1: 顺时针转一次 (originalFaces[0] -> positionFaces[1], originalFaces[1] -> positionFaces[2], originalFaces[2] -> positionFaces[0])
  // orientation = 2: 顺时针转两次 (originalFaces[0] -> positionFaces[2], originalFaces[1] -> positionFaces[0], originalFaces[2] -> positionFaces[1])
  const result: Partial<Record<Face, FaceColor>> = {}
  
  for (let i = 0; i < positionFaces.length; i++) {
    const targetFace = positionFaces[i]
    // 根据orientation计算源索引
    // orientation的定义：表示角块需要顺时针旋转多少次才能让原始面的颜色对应到正确的位置
    // orientation = 0: originalFaces[0] -> positionFaces[0], originalFaces[1] -> positionFaces[1], originalFaces[2] -> positionFaces[2]
    // orientation = 1: originalFaces[0] -> positionFaces[1], originalFaces[1] -> positionFaces[2], originalFaces[2] -> positionFaces[0]
    // orientation = 2: originalFaces[0] -> positionFaces[2], originalFaces[1] -> positionFaces[0], originalFaces[2] -> positionFaces[1]
    // 对于 positionFaces[i]，应该显示 originalFaces[(i - orientation + 3) % 3] 的颜色
    // 验证：如果orientation=1, i=0，那么sourceIndex=(0-1+3)%3=2，所以originalFaces[0] -> positionFaces[1] ✓
    const sourceIndex = (i - corner.orientation + 3) % 3
    const sourceFace = originalFaces[sourceIndex]
    if (corner.colors[sourceFace]) {
      result[targetFace] = corner.colors[sourceFace]!
    }
  }

  return result
}

/**
 * 获取edge cubie在指定位置时，各个面的颜色
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

  // 获取原始颜色的面
  const originalFaces: Face[] = []
  if (edge.id.includes('U')) originalFaces.push('U')
  if (edge.id.includes('D')) originalFaces.push('D')
  if (edge.id.includes('F')) originalFaces.push('F')
  if (edge.id.includes('B')) originalFaces.push('B')
  if (edge.id.includes('L')) originalFaces.push('L')
  if (edge.id.includes('R')) originalFaces.push('R')

  // 根据orientation翻转颜色映射
  // 确保面的顺序一致（按照U/D, F/B, R/L的优先级排序）
  const sortedPositionFaces = [...positionFaces].sort((a, b) => {
    const order: Record<Face, number> = { U: 0, D: 1, F: 2, B: 3, R: 4, L: 5 }
    return order[a] - order[b]
  })
  const sortedOriginalFaces = [...originalFaces].sort((a, b) => {
    const order: Record<Face, number> = { U: 0, D: 1, F: 2, B: 3, R: 4, L: 5 }
    return order[a] - order[b]
  })
  
  const result: Partial<Record<Face, FaceColor>> = {}
  
  if (edge.orientation === 0) {
    // 正常方向：按照排序后的顺序映射
    for (let i = 0; i < sortedPositionFaces.length; i++) {
      const posFace = sortedPositionFaces[i]
      const origFace = sortedOriginalFaces[i]
      result[posFace] = edge.colors[origFace]
    }
  } else {
    // 翻转方向（orientation = 1）：交换映射
    for (let i = 0; i < sortedPositionFaces.length; i++) {
      const posFace = sortedPositionFaces[i]
      const origFace = sortedOriginalFaces[(i + 1) % sortedOriginalFaces.length]
      result[posFace] = edge.colors[origFace]
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
