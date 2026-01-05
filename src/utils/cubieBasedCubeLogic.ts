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
} from './cubeTypes'

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

  // 初始化8个角块
  // 每个角块的colors记录初始状态下的颜色（不变）
  const corners: Record<CornerCubieId, CornerCubie> = {
    // 上层角块
    UFR: {
      id: 'UFR',
      position: 'UFR',
      orientation: 0,
      colors: { U: FACE_COLORS.U, F: FACE_COLORS.F, R: FACE_COLORS.R },
    },
    UFL: {
      id: 'UFL',
      position: 'UFL',
      orientation: 0,
      colors: { U: FACE_COLORS.U, F: FACE_COLORS.F, L: FACE_COLORS.L },
    },
    UBL: {
      id: 'UBL',
      position: 'UBL',
      orientation: 0,
      colors: { U: FACE_COLORS.U, B: FACE_COLORS.B, L: FACE_COLORS.L },
    },
    UBR: {
      id: 'UBR',
      position: 'UBR',
      orientation: 0,
      colors: { U: FACE_COLORS.U, B: FACE_COLORS.B, R: FACE_COLORS.R },
    },
    // 下层角块
    DFR: {
      id: 'DFR',
      position: 'DFR',
      orientation: 0,
      colors: { D: FACE_COLORS.D, F: FACE_COLORS.F, R: FACE_COLORS.R },
    },
    DFL: {
      id: 'DFL',
      position: 'DFL',
      orientation: 0,
      colors: { D: FACE_COLORS.D, F: FACE_COLORS.F, L: FACE_COLORS.L },
    },
    DBL: {
      id: 'DBL',
      position: 'DBL',
      orientation: 0,
      colors: { D: FACE_COLORS.D, B: FACE_COLORS.B, L: FACE_COLORS.L },
    },
    DBR: {
      id: 'DBR',
      position: 'DBR',
      orientation: 0,
      colors: { D: FACE_COLORS.D, B: FACE_COLORS.B, R: FACE_COLORS.R },
    },
  }

  // 初始化12个边块
  const edges: Record<EdgeCubieId, EdgeCubie> = {
    // 上层边块
    UF: {
      id: 'UF',
      position: 'UF',
      orientation: 0,
      colors: { U: FACE_COLORS.U, F: FACE_COLORS.F },
    },
    UR: {
      id: 'UR',
      position: 'UR',
      orientation: 0,
      colors: { U: FACE_COLORS.U, R: FACE_COLORS.R },
    },
    UB: {
      id: 'UB',
      position: 'UB',
      orientation: 0,
      colors: { U: FACE_COLORS.U, B: FACE_COLORS.B },
    },
    UL: {
      id: 'UL',
      position: 'UL',
      orientation: 0,
      colors: { U: FACE_COLORS.U, L: FACE_COLORS.L },
    },
    // 下层边块
    DF: {
      id: 'DF',
      position: 'DF',
      orientation: 0,
      colors: { D: FACE_COLORS.D, F: FACE_COLORS.F },
    },
    DR: {
      id: 'DR',
      position: 'DR',
      orientation: 0,
      colors: { D: FACE_COLORS.D, R: FACE_COLORS.R },
    },
    DB: {
      id: 'DB',
      position: 'DB',
      orientation: 0,
      colors: { D: FACE_COLORS.D, B: FACE_COLORS.B },
    },
    DL: {
      id: 'DL',
      position: 'DL',
      orientation: 0,
      colors: { D: FACE_COLORS.D, L: FACE_COLORS.L },
    },
    // 中层边块
    FR: {
      id: 'FR',
      position: 'FR',
      orientation: 0,
      colors: { F: FACE_COLORS.F, R: FACE_COLORS.R },
    },
    FL: {
      id: 'FL',
      position: 'FL',
      orientation: 0,
      colors: { F: FACE_COLORS.F, L: FACE_COLORS.L },
    },
    BR: {
      id: 'BR',
      position: 'BR',
      orientation: 0,
      colors: { B: FACE_COLORS.B, R: FACE_COLORS.R },
    },
    BL: {
      id: 'BL',
      position: 'BL',
      orientation: 0,
      colors: { B: FACE_COLORS.B, L: FACE_COLORS.L },
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
    if (clockwise) {
      state.corners[cubieId].orientation = ((orientations[i] + 1) % 3) as 0 | 1 | 2
    } else {
      state.corners[cubieId].orientation = ((orientations[i] - 1 + 3) % 3) as 0 | 1 | 2
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
 * 角块循环：UFR -> DFR -> DBR -> UBR -> UFR
 * 边块循环：UR -> FR -> DR -> BR -> UR
 */
export function rotateR(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 角块循环（顺时针）
  cycleCorners(newState, ['UFR', 'DFR', 'DBR', 'UBR'], true)
  
  // 边块循环（顺时针）
  cycleEdges(newState, ['UR', 'FR', 'DR', 'BR'], true)
  
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
    // 对于 positionFaces[i]，应该显示 originalFaces[(i + orientation) % 3] 的颜色
    // orientation = 0: i -> i (originalFaces[0] -> positionFaces[0])
    // orientation = 1: i -> (i+1)%3 (originalFaces[0] -> positionFaces[1])
    // orientation = 2: i -> (i+2)%3 (originalFaces[0] -> positionFaces[2])
    const sourceIndex = (i + corner.orientation) % 3
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
  const result: Partial<Record<Face, FaceColor>> = {}
  
  if (edge.orientation === 0) {
    // 正常方向
    result[positionFaces[0]] = edge.colors[originalFaces[0]]
    result[positionFaces[1]] = edge.colors[originalFaces[1]]
  } else {
    // 翻转方向
    result[positionFaces[0]] = edge.colors[originalFaces[1]]
    result[positionFaces[1]] = edge.colors[originalFaces[0]]
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
