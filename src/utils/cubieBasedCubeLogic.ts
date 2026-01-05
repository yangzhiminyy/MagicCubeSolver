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
  upper: FaceColor | null,
  down: FaceColor | null,
  front: FaceColor | null,
  back: FaceColor | null,
  left: FaceColor | null,
  right: FaceColor | null
): CubieColors {
  return {
    upper: upper ?? 'black',
    down: down ?? 'black',
    front: front ?? 'black',
    back: back ?? 'black',
    left: left ?? 'black',
    right: right ?? 'black',
  }
}

/**
 * 创建边块颜色（6个面，不可见面用黑色）
 */
function createEdgeColors(
  upper: FaceColor | null,
  down: FaceColor | null,
  front: FaceColor | null,
  back: FaceColor | null,
  left: FaceColor | null,
  right: FaceColor | null
): CubieColors {
  return {
    upper: upper ?? 'black',
    down: down ?? 'black',
    front: front ?? 'black',
    back: back ?? 'black',
    left: left ?? 'black',
    right: right ?? 'black',
  }
}

/**
 * 创建已解决的 Cubie-based 魔方状态
 */
export function createSolvedCubieBasedCube(): CubieBasedCubeState {
  // 初始化6个中心块（位置固定，永远不变）
  const faces: Record<FaceCubieId, FaceCubie> = {
    U: { id: 'U', coordinate: [0, 1, 0], color: FACE_COLORS.U },
    D: { id: 'D', coordinate: [0, -1, 0], color: FACE_COLORS.D },
    F: { id: 'F', coordinate: [0, 0, 1], color: FACE_COLORS.F },
    B: { id: 'B', coordinate: [0, 0, -1], color: FACE_COLORS.B },
    L: { id: 'L', coordinate: [-1, 0, 0], color: FACE_COLORS.L },
    R: { id: 'R', coordinate: [1, 0, 0], color: FACE_COLORS.R },
  }

  // 初始化8个角块（每个都有6个面的颜色，不可见面用黑色）
  const corners: Record<CornerCubieId, CornerCubie> = {
    // 上层角块
    UFR: {
      id: 'UFR',
      coordinate: [1, 1, 1],
      colors: createCornerColors(FACE_COLORS.U, null, FACE_COLORS.F, null, null, FACE_COLORS.R),
    },
    UFL: {
      id: 'UFL',
      coordinate: [-1, 1, 1],
      colors: createCornerColors(FACE_COLORS.U, null, FACE_COLORS.F, null, FACE_COLORS.L, null),
    },
    UBL: {
      id: 'UBL',
      coordinate: [-1, 1, -1],
      colors: createCornerColors(FACE_COLORS.U, null, null, FACE_COLORS.B, FACE_COLORS.L, null),
    },
    UBR: {
      id: 'UBR',
      coordinate: [1, 1, -1],
      colors: createCornerColors(FACE_COLORS.U, null, null, FACE_COLORS.B, null, FACE_COLORS.R),
    },
    // 下层角块
    DFR: {
      id: 'DFR',
      coordinate: [1, -1, 1],
      colors: createCornerColors(null, FACE_COLORS.D, FACE_COLORS.F, null, null, FACE_COLORS.R),
    },
    DFL: {
      id: 'DFL',
      coordinate: [-1, -1, 1],
      colors: createCornerColors(null, FACE_COLORS.D, FACE_COLORS.F, null, FACE_COLORS.L, null),
    },
    DBL: {
      id: 'DBL',
      coordinate: [-1, -1, -1],
      colors: createCornerColors(null, FACE_COLORS.D, null, FACE_COLORS.B, FACE_COLORS.L, null),
    },
    DBR: {
      id: 'DBR',
      coordinate: [1, -1, -1],
      colors: createCornerColors(null, FACE_COLORS.D, null, FACE_COLORS.B, null, FACE_COLORS.R),
    },
  }

  // 初始化12个边块（每个都有6个面的颜色，不可见面用黑色）
  const edges: Record<EdgeCubieId, EdgeCubie> = {
    // 上层边块
    UF: {
      id: 'UF',
      coordinate: [0, 1, 1],
      colors: createEdgeColors(FACE_COLORS.U, null, FACE_COLORS.F, null, null, null),
    },
    UR: {
      id: 'UR',
      coordinate: [1, 1, 0],
      colors: createEdgeColors(FACE_COLORS.U, null, null, null, null, FACE_COLORS.R),
    },
    UB: {
      id: 'UB',
      coordinate: [0, 1, -1],
      colors: createEdgeColors(FACE_COLORS.U, null, null, FACE_COLORS.B, null, null),
    },
    UL: {
      id: 'UL',
      coordinate: [-1, 1, 0],
      colors: createEdgeColors(FACE_COLORS.U, null, null, null, FACE_COLORS.L, null),
    },
    // 下层边块
    DF: {
      id: 'DF',
      coordinate: [0, -1, 1],
      colors: createEdgeColors(null, FACE_COLORS.D, FACE_COLORS.F, null, null, null),
    },
    DR: {
      id: 'DR',
      coordinate: [1, -1, 0],
      colors: createEdgeColors(null, FACE_COLORS.D, null, null, null, FACE_COLORS.R),
    },
    DB: {
      id: 'DB',
      coordinate: [0, -1, -1],
      colors: createEdgeColors(null, FACE_COLORS.D, null, FACE_COLORS.B, null, null),
    },
    DL: {
      id: 'DL',
      coordinate: [-1, -1, 0],
      colors: createEdgeColors(null, FACE_COLORS.D, null, null, FACE_COLORS.L, null),
    },
    // 中层边块
    FR: {
      id: 'FR',
      coordinate: [1, 0, 1],
      colors: createEdgeColors(null, null, FACE_COLORS.F, null, null, FACE_COLORS.R),
    },
    FL: {
      id: 'FL',
      coordinate: [-1, 0, 1],
      colors: createEdgeColors(null, null, FACE_COLORS.F, null, FACE_COLORS.L, null),
    },
    BR: {
      id: 'BR',
      coordinate: [1, 0, -1],
      colors: createEdgeColors(null, null, null, FACE_COLORS.B, null, FACE_COLORS.R),
    },
    BL: {
      id: 'BL',
      coordinate: [-1, 0, -1],
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
      coordinate: [...corner.coordinate] as [number, number, number],
      colors: { ...corner.colors },
    }
  }

  const newEdges: Record<EdgeCubieId, EdgeCubie> = {} as Record<EdgeCubieId, EdgeCubie>
  for (const [id, edge] of Object.entries(state.edges)) {
    newEdges[id as EdgeCubieId] = {
      ...edge,
      coordinate: [...edge.coordinate] as [number, number, number],
      colors: { ...edge.colors },
    }
  }

  const newFaces: Record<FaceCubieId, FaceCubie> = {} as Record<FaceCubieId, FaceCubie>
  for (const [id, face] of Object.entries(state.faces)) {
    newFaces[id as FaceCubieId] = {
      ...face,
      coordinate: [...face.coordinate] as [number, number, number],
    }
  }

  return {
    corners: newCorners,
    edges: newEdges,
    faces: newFaces,
  }
}

/**
 * 绕x轴旋转cubie颜色（R/L面旋转）
 * 从R面看（从+x方向看），顺时针旋转时：upper->front->down->back->upper
 * 这意味着：upper面转到front面位置，front面转到down面位置，down面转到back面位置，back面转到upper面位置
 * 所以旋转后：新upper面显示原来front面的颜色，新front面显示原来down面的颜色，新down面显示原来back面的颜色，新back面显示原来upper面的颜色
 */
function rotateColorsAroundXAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 顺时针：upper->front->down->back->upper
    return {
      upper: colors.front,  // upper = front的颜色
      front: colors.down,    // front = down的颜色
      down: colors.back,      // down = back的颜色
      back: colors.upper,     // back = upper的颜色
      left: colors.left,      // left不变
      right: colors.right,    // right不变
    }
  } else {
    // 逆时针：upper->back->down->front->upper
    return {
      upper: colors.back,     // upper = back的颜色
      front: colors.upper,     // front = upper的颜色
      down: colors.front,     // down = front的颜色
      back: colors.down,      // back = down的颜色
      left: colors.left,      // left不变
      right: colors.right,   // right不变
    }
  }
}

/**
 * 绕y轴旋转cubie颜色（U/D面旋转）
 * 顺时针（从上面看）：front->left->back->right->front
 */
function rotateColorsAroundYAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 从上面看顺时针：front->left->back->right->front
    return {
      upper: colors.upper,   // upper不变
      down: colors.down,      // down不变
      front: colors.left,     // front = left的颜色
      left: colors.back,      // left = back的颜色
      back: colors.right,     // back = right的颜色
      right: colors.front,    // right = front的颜色
    }
  } else {
    // 从上面看逆时针：front->right->back->left->front
    return {
      upper: colors.upper,   // upper不变
      down: colors.down,     // down不变
      front: colors.right,   // front = right的颜色
      right: colors.back,     // right = back的颜色
      back: colors.left,      // back = left的颜色
      left: colors.front,     // left = front的颜色
    }
  }
}

/**
 * 绕z轴旋转cubie颜色（F/B面旋转）
 * 顺时针（从前面看）：upper->left->down->right->upper
 */
function rotateColorsAroundZAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 从前面看顺时针：upper->left->down->right->upper
    return {
      upper: colors.left,     // upper = left的颜色
      left: colors.down,       // left = down的颜色
      down: colors.right,     // down = right的颜色
      right: colors.upper,     // right = upper的颜色
      front: colors.front,     // front不变
      back: colors.back,       // back不变
    }
  } else {
    // 从前面看逆时针：upper->right->down->left->upper
    return {
      upper: colors.right,    // upper = right的颜色
      right: colors.down,      // right = down的颜色
      down: colors.left,      // down = left的颜色
      left: colors.upper,      // left = upper的颜色
      front: colors.front,    // front不变
      back: colors.back,      // back不变
    }
  }
}


/**
 * R面顺时针旋转（绕x轴顺时针90度）
 * 找出所有 x=1 的 cubie，然后进行坐标变换和颜色旋转
 */
export function rotateR(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 x=1 的 cubie（R面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[0] === 1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[0] === 1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕x轴顺时针90度 (x, y, z) -> (x, z, -y)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [x, z, -y]
    
    // 颜色旋转：绕x轴顺时针90度
    corner.colors = rotateColorsAroundXAxis(corner.colors, true)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕x轴顺时针90度 (x, y, z) -> (x, z, -y)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [x, z, -y]
    
    // 颜色旋转：绕x轴顺时针90度
    edge.colors = rotateColorsAroundXAxis(edge.colors, true)
  }
  
  return newState
}

/**
 * R'面逆时针旋转（绕x轴逆时针90度）
 * 找出所有 x=1 的 cubie，然后进行坐标变换和颜色旋转
 */
export function rotateRPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 x=1 的 cubie（R面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[0] === 1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[0] === 1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕x轴逆时针90度 (x, y, z) -> (x, -z, y)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [x, -z, y]
    
    // 颜色旋转：绕x轴逆时针90度
    corner.colors = rotateColorsAroundXAxis(corner.colors, false)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕x轴逆时针90度 (x, y, z) -> (x, -z, y)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [x, -z, y]
    
    // 颜色旋转：绕x轴逆时针90度
    edge.colors = rotateColorsAroundXAxis(edge.colors, false)
  }
  
  return newState
}

/**
 * L面顺时针旋转（绕x轴逆时针90度，从标准视角看）
 * 找出所有 x=-1 的 cubie，然后进行坐标变换和颜色旋转
 */
export function rotateL(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 x=-1 的 cubie（L面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[0] === -1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[0] === -1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕x轴逆时针90度 (x, y, z) -> (x, -z, y)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [x, -z, y]
    
    // 颜色旋转：绕x轴逆时针90度
    corner.colors = rotateColorsAroundXAxis(corner.colors, false)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕x轴逆时针90度 (x, y, z) -> (x, -z, y)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [x, -z, y]
    
    // 颜色旋转：绕x轴逆时针90度
    edge.colors = rotateColorsAroundXAxis(edge.colors, false)
  }
  
  return newState
}

/**
 * L'面逆时针旋转
 */
export function rotateLPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 x=-1 的 cubie（L面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[0] === -1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[0] === -1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕x轴顺时针90度 (x, y, z) -> (x, z, -y)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [x, z, -y]
    
    // 颜色旋转：绕x轴顺时针90度
    corner.colors = rotateColorsAroundXAxis(corner.colors, true)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕x轴顺时针90度 (x, y, z) -> (x, z, -y)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [x, z, -y]
    
    // 颜色旋转：绕x轴顺时针90度
    edge.colors = rotateColorsAroundXAxis(edge.colors, true)
  }
  
  return newState
}

/**
 * U面顺时针旋转（绕y轴逆时针90度，从上面看）
 * 找出所有 y=1 的 cubie，然后进行坐标变换和颜色旋转
 */
export function rotateU(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 y=1 的 cubie（U面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[1] === 1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[1] === 1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕y轴逆时针90度 (x, y, z) -> (-z, y, x)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [-z, y, x]
    
    // 颜色旋转：绕y轴逆时针90度
    corner.colors = rotateColorsAroundYAxis(corner.colors, false)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕y轴逆时针90度 (x, y, z) -> (-z, y, x)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [-z, y, x]
    
    // 颜色旋转：绕y轴逆时针90度
    edge.colors = rotateColorsAroundYAxis(edge.colors, false)
  }
  
  return newState
}

/**
 * U'面逆时针旋转
 */
export function rotateUPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 y=1 的 cubie（U面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[1] === 1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[1] === 1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕y轴顺时针90度 (x, y, z) -> (z, y, -x)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [z, y, -x]
    
    // 颜色旋转：绕y轴顺时针90度
    corner.colors = rotateColorsAroundYAxis(corner.colors, true)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕y轴顺时针90度 (x, y, z) -> (z, y, -x)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [z, y, -x]
    
    // 颜色旋转：绕y轴顺时针90度
    edge.colors = rotateColorsAroundYAxis(edge.colors, true)
  }
  
  return newState
}

/**
 * D面顺时针旋转（绕y轴顺时针90度，从下面看）
 * 找出所有 y=-1 的 cubie，然后进行坐标变换和颜色旋转
 */
export function rotateD(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 y=-1 的 cubie（D面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[1] === -1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[1] === -1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕y轴顺时针90度 (x, y, z) -> (z, y, -x)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [z, y, -x]
    
    // 颜色旋转：绕y轴顺时针90度
    corner.colors = rotateColorsAroundYAxis(corner.colors, true)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕y轴顺时针90度 (x, y, z) -> (z, y, -x)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [z, y, -x]
    
    // 颜色旋转：绕y轴顺时针90度
    edge.colors = rotateColorsAroundYAxis(edge.colors, true)
  }
  
  return newState
}

/**
 * D'面逆时针旋转
 */
export function rotateDPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 y=-1 的 cubie（D面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[1] === -1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[1] === -1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕y轴逆时针90度 (x, y, z) -> (-z, y, x)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [-z, y, x]
    
    // 颜色旋转：绕y轴逆时针90度
    corner.colors = rotateColorsAroundYAxis(corner.colors, false)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕y轴逆时针90度 (x, y, z) -> (-z, y, x)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [-z, y, x]
    
    // 颜色旋转：绕y轴逆时针90度
    edge.colors = rotateColorsAroundYAxis(edge.colors, false)
  }
  
  return newState
}

/**
 * F面顺时针旋转（绕z轴顺时针90度，从前面看）
 * 找出所有 z=1 的 cubie，然后进行坐标变换和颜色旋转
 */
export function rotateF(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 z=1 的 cubie（F面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[2] === 1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[2] === 1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕z轴顺时针90度 (x, y, z) -> (y, -x, z)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [y, -x, z]
    
    // 颜色旋转：绕z轴顺时针90度
    corner.colors = rotateColorsAroundZAxis(corner.colors, true)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕z轴顺时针90度 (x, y, z) -> (y, -x, z)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [y, -x, z]
    
    // 颜色旋转：绕z轴顺时针90度
    edge.colors = rotateColorsAroundZAxis(edge.colors, true)
  }
  
  return newState
}

/**
 * F'面逆时针旋转
 */
export function rotateFPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 z=1 的 cubie（F面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[2] === 1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[2] === 1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕z轴顺时针90度 (x, y, z) -> (-y, x, z)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [-y, x, z]
    
    // 颜色旋转：绕z轴顺时针90度
    corner.colors = rotateColorsAroundZAxis(corner.colors, false)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕z轴顺时针90度 (x, y, z) -> (-y, x, z)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [-y, x, z]
    
    // 颜色旋转：绕z轴顺时针90度
    edge.colors = rotateColorsAroundZAxis(edge.colors, false)
  }
  
  return newState
}

/**
 * B面顺时针旋转（绕z轴顺时针90度，从前面看）
 * 找出所有 z=-1 的 cubie，然后进行坐标变换和颜色旋转
 */
export function rotateB(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 z=-1 的 cubie（B面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[2] === -1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[2] === -1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕z轴顺时针90度 (x, y, z) -> (-y, x, z)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [-y, x, z]
    
    // 颜色旋转：绕z轴顺时针90度
    corner.colors = rotateColorsAroundZAxis(corner.colors, false)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕z轴顺时针90度 (x, y, z) -> (-y, x, z)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [-y, x, z]
    
    // 颜色旋转：绕z轴顺时针90度
    edge.colors = rotateColorsAroundZAxis(edge.colors, false)
  }
  
  return newState
}

/**
 * B'面逆时针旋转
 */
export function rotateBPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 z=-1 的 cubie（B面的所有cubie）
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[2] === -1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[2] === -1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕z轴逆时针90度 (x, y, z) -> (y, -x, z)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [y, -x, z]
    
    // 颜色旋转：绕z轴逆时针90度
    corner.colors = rotateColorsAroundZAxis(corner.colors, true)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换：绕z轴逆时针90度 (x, y, z) -> (y, -x, z)
    const [x, y, z] = edge.coordinate
    edge.coordinate = [y, -x, z]
    
    // 颜色旋转：绕z轴逆时针90度
    edge.colors = rotateColorsAroundZAxis(edge.colors, true)
  }
  
  return newState
}


/**
 * 获取corner cubie在指定坐标时，各个面的颜色
 * 根据坐标确定哪些面可见，然后从 corner.colors 中读取对应面的颜色
 * @param corner 角块
 * @param coordinate 当前坐标
 * @returns 各个面的颜色映射
 */
function getCornerFaceColors(corner: CornerCubie, coordinate: [number, number, number]): Partial<Record<Face, FaceColor>> {
  const [x, y, z] = coordinate
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 根据坐标确定哪些面可见，然后从 corner.colors 中读取对应面的颜色
  // y=1 表示在魔方的 U 面，此时 cubie 的 upper 面可见
  if (y === 1) {
    const color = corner.colors.upper
    if (color && color !== 'black') {
      result.U = color
    }
  }
  
  // y=-1 表示在魔方的 D 面，此时 cubie 的 down 面可见
  if (y === -1) {
    const color = corner.colors.down
    if (color && color !== 'black') {
      result.D = color
    }
  }
  
  // z=1 表示在魔方的 F 面，此时 cubie 的 front 面可见
  if (z === 1) {
    const color = corner.colors.front
    if (color && color !== 'black') {
      result.F = color
    }
  }
  
  // z=-1 表示在魔方的 B 面，此时 cubie 的 back 面可见
  if (z === -1) {
    const color = corner.colors.back
    if (color && color !== 'black') {
      result.B = color
    }
  }
  
  // x=1 表示在魔方的 R 面，此时 cubie 的 right 面可见
  if (x === 1) {
    const color = corner.colors.right
    if (color && color !== 'black') {
      result.R = color
    }
  }
  
  // x=-1 表示在魔方的 L 面，此时 cubie 的 left 面可见
  if (x === -1) {
    const color = corner.colors.left
    if (color && color !== 'black') {
      result.L = color
    }
  }

  return result
}

/**
 * 获取edge cubie在指定坐标时，各个面的颜色
 * 根据坐标确定哪些面可见，然后从 edge.colors 中读取对应面的颜色
 * @param edge 边块
 * @param coordinate 当前坐标
 * @returns 各个面的颜色映射
 */
function getEdgeFaceColors(edge: EdgeCubie, coordinate: [number, number, number]): Partial<Record<Face, FaceColor>> {
  const [x, y, z] = coordinate
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 根据坐标确定哪些面可见，然后从 edge.colors 中读取对应面的颜色
  if (y === 1) {
    const color = edge.colors.upper
    if (color && color !== 'black') result.U = color
  }
  
  if (y === -1) {
    const color = edge.colors.down
    if (color && color !== 'black') result.D = color
  }
  
  if (z === 1) {
    const color = edge.colors.front
    if (color && color !== 'black') result.F = color
  }
  
  if (z === -1) {
    const color = edge.colors.back
    if (color && color !== 'black') result.B = color
  }
  
  if (x === 1) {
    const color = edge.colors.right
    if (color && color !== 'black') result.R = color
  }
  
  if (x === -1) {
    const color = edge.colors.left
    if (color && color !== 'black') result.L = color
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
    const [x, y, z] = face.coordinate
    // 根据坐标确定是哪个面，中心块总是在面的中心位置 (1, 1)
    if (y === 1) faceColors.U[1][1] = face.color
    else if (y === -1) faceColors.D[1][1] = face.color
    else if (z === 1) faceColors.F[1][1] = face.color
    else if (z === -1) faceColors.B[1][1] = face.color
    else if (x === 1) faceColors.R[1][1] = face.color
    else if (x === -1) faceColors.L[1][1] = face.color
  }

  // 处理角块
  for (const corner of Object.values(state.corners)) {
    const [x, y, z] = corner.coordinate
    const colors = getCornerFaceColors(corner, corner.coordinate)

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
    const [x, y, z] = edge.coordinate
    const colors = getEdgeFaceColors(edge, edge.coordinate)

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
