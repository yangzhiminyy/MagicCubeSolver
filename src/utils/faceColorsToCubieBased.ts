/**
 * 从面颜色数组（CubeState）转换为 CubieBasedCubeState
 * 
 * 这个函数通过分析每个面的颜色，推断每个 cubie 的位置和方向
 */

import { CubeState, CubieBasedCubeState, FaceColor, CornerCubieId, EdgeCubieId, FaceCubieId, CubieColors } from './cubeTypes'
import { createSolvedCubieBasedCube } from './cubieBasedCubeLogic'

/**
 * 从 CubeState 创建 CubieBasedCubeState
 * 
 * 算法思路：
 * 1. 首先识别中心块的颜色，确定每个面的标准颜色
 * 2. 对于每个角块位置，查找匹配该位置颜色的角块
 * 3. 对于每个边块位置，查找匹配该位置颜色的边块
 * 4. 确定每个 cubie 的方向（颜色朝向）
 */
export function faceColorsToCubieBasedState(cubeState: CubeState): CubieBasedCubeState {
  // 创建已解决状态作为基础
  const solved = createSolvedCubieBasedCube()
  const result: CubieBasedCubeState = {
    corners: {} as Record<CornerCubieId, typeof solved.corners[CornerCubieId]>,
    edges: {} as Record<EdgeCubieId, typeof solved.edges[EdgeCubieId]>,
    faces: {} as Record<FaceCubieId, typeof solved.faces[FaceCubieId]>,
  }

  // 设置中心块（根据识别的颜色）
  for (const [faceId, face] of Object.entries(solved.faces)) {
    const [x, y, z] = face.coordinate
    let detectedColor: FaceColor = face.color
    
    // 根据坐标确定是哪个面，读取中心块颜色
    if (y === 1) detectedColor = cubeState.U[1][1]
    else if (y === -1) detectedColor = cubeState.D[1][1]
    else if (z === 1) detectedColor = cubeState.F[1][1]
    else if (z === -1) detectedColor = cubeState.B[1][1]
    else if (x === 1) detectedColor = cubeState.R[1][1]
    else if (x === -1) detectedColor = cubeState.L[1][1]
    
    result.faces[faceId as FaceCubieId] = {
      ...face,
      color: detectedColor,
    }
  }

  // 处理角块：对于每个角块位置，找到匹配的角块
  // 根据 cubieBasedStateToFaceColors 的映射：
  // U面: row = z+1, col = x+1
  // D面: row = 1-z, col = x+1
  // F面: row = 1-y, col = x+1
  // B面: row = 1-y, col = 1-x
  // R面: row = 1-y, col = 1-z
  // L面: row = 1-y, col = z+1
  const cornerPositions: Array<{ 
    coord: [number, number, number], 
    faceColors: { U?: FaceColor, D?: FaceColor, F?: FaceColor, B?: FaceColor, R?: FaceColor, L?: FaceColor }
  }> = [
    // UFR: [1, 1, 1]
    { 
      coord: [1, 1, 1], 
      faceColors: {
        U: cubeState.U[1 + 1][1 + 1], // row=z+1=2, col=x+1=2
        F: cubeState.F[1 - 1][1 + 1], // row=1-y=0, col=x+1=2
        R: cubeState.R[1 - 1][1 - 1], // row=1-y=0, col=1-z=0
      }
    },
    // UFL: [-1, 1, 1]
    { 
      coord: [-1, 1, 1], 
      faceColors: {
        U: cubeState.U[1 + 1][-1 + 1], // row=z+1=2, col=x+1=0
        F: cubeState.F[1 - 1][-1 + 1], // row=1-y=0, col=x+1=0
        L: cubeState.L[1 - 1][1 + 1], // row=1-y=0, col=z+1=2
      }
    },
    // UBL: [-1, 1, -1]
    { 
      coord: [-1, 1, -1], 
      faceColors: {
        U: cubeState.U[-1 + 1][-1 + 1], // row=z+1=0, col=x+1=0
        B: cubeState.B[1 - 1][1 - (-1)], // row=1-y=0, col=1-x=2
        L: cubeState.L[1 - 1][-1 + 1], // row=1-y=0, col=z+1=0
      }
    },
    // UBR: [1, 1, -1]
    { 
      coord: [1, 1, -1], 
      faceColors: {
        U: cubeState.U[-1 + 1][1 + 1], // row=z+1=0, col=x+1=2
        B: cubeState.B[1 - 1][1 - 1], // row=1-y=0, col=1-x=0
        R: cubeState.R[1 - 1][1 - (-1)], // row=1-y=0, col=1-z=2
      }
    },
    // DFR: [1, -1, 1]
    { 
      coord: [1, -1, 1], 
      faceColors: {
        D: cubeState.D[1 - 1][1 + 1], // row=1-z=0, col=x+1=2
        F: cubeState.F[1 - (-1)][1 + 1], // row=1-y=2, col=x+1=2
        R: cubeState.R[1 - (-1)][1 - 1], // row=1-y=2, col=1-z=0
      }
    },
    // DFL: [-1, -1, 1]
    { 
      coord: [-1, -1, 1], 
      faceColors: {
        D: cubeState.D[1 - 1][-1 + 1], // row=1-z=0, col=x+1=0
        F: cubeState.F[1 - (-1)][-1 + 1], // row=1-y=2, col=x+1=0
        L: cubeState.L[1 - (-1)][1 + 1], // row=1-y=2, col=z+1=2
      }
    },
    // DBL: [-1, -1, -1]
    { 
      coord: [-1, -1, -1], 
      faceColors: {
        D: cubeState.D[1 - (-1)][-1 + 1], // row=1-z=2, col=x+1=0
        B: cubeState.B[1 - (-1)][1 - (-1)], // row=1-y=2, col=1-x=2
        L: cubeState.L[1 - (-1)][-1 + 1], // row=1-y=2, col=z+1=0
      }
    },
    // DBR: [1, -1, -1]
    { 
      coord: [1, -1, -1], 
      faceColors: {
        D: cubeState.D[1 - (-1)][1 + 1], // row=1-z=2, col=x+1=2
        B: cubeState.B[1 - (-1)][1 - 1], // row=1-y=2, col=1-x=0
        R: cubeState.R[1 - (-1)][1 - (-1)], // row=1-y=2, col=1-z=2
      }
    },
  ]

  // 为每个位置找到匹配的角块
  for (const pos of cornerPositions) {
    const targetColors = Object.values(pos.faceColors).filter(c => c !== undefined) as FaceColor[]
    const matchingCorner = findMatchingCorner(targetColors, solved.corners, result.corners)
    if (matchingCorner) {
      result.corners[matchingCorner.id] = {
        ...matchingCorner,
        coordinate: pos.coord,
        colors: adjustCornerColors(matchingCorner.colors, pos.faceColors, pos.coord),
      }
    }
  }

  // 处理边块：对于每个边块位置，找到匹配的边块
  const edgePositions: Array<{ 
    coord: [number, number, number], 
    faceColors: { U?: FaceColor, D?: FaceColor, F?: FaceColor, B?: FaceColor, R?: FaceColor, L?: FaceColor }
  }> = [
    // UF: [0, 1, 1]
    { 
      coord: [0, 1, 1], 
      faceColors: {
        U: cubeState.U[1 + 1][0 + 1], // row=z+1=2, col=x+1=1
        F: cubeState.F[1 - 1][0 + 1], // row=1-y=0, col=x+1=1
      }
    },
    // UR: [1, 1, 0]
    { 
      coord: [1, 1, 0], 
      faceColors: {
        U: cubeState.U[0 + 1][1 + 1], // row=z+1=1, col=x+1=2
        R: cubeState.R[1 - 1][1 - 0], // row=1-y=0, col=1-z=1
      }
    },
    // UB: [0, 1, -1]
    { 
      coord: [0, 1, -1], 
      faceColors: {
        U: cubeState.U[-1 + 1][0 + 1], // row=z+1=0, col=x+1=1
        B: cubeState.B[1 - 1][1 - 0], // row=1-y=0, col=1-x=1
      }
    },
    // UL: [-1, 1, 0]
    { 
      coord: [-1, 1, 0], 
      faceColors: {
        U: cubeState.U[0 + 1][-1 + 1], // row=z+1=1, col=x+1=0
        L: cubeState.L[1 - 1][0 + 1], // row=1-y=0, col=z+1=1
      }
    },
    // DF: [0, -1, 1]
    { 
      coord: [0, -1, 1], 
      faceColors: {
        D: cubeState.D[1 - 1][0 + 1], // row=1-z=0, col=x+1=1
        F: cubeState.F[1 - (-1)][0 + 1], // row=1-y=2, col=x+1=1
      }
    },
    // DR: [1, -1, 0]
    { 
      coord: [1, -1, 0], 
      faceColors: {
        D: cubeState.D[1 - 0][1 + 1], // row=1-z=1, col=x+1=2
        R: cubeState.R[1 - (-1)][1 - 0], // row=1-y=2, col=1-z=1
      }
    },
    // DB: [0, -1, -1]
    { 
      coord: [0, -1, -1], 
      faceColors: {
        D: cubeState.D[1 - (-1)][0 + 1], // row=1-z=2, col=x+1=1
        B: cubeState.B[1 - (-1)][1 - 0], // row=1-y=2, col=1-x=1
      }
    },
    // DL: [-1, -1, 0]
    { 
      coord: [-1, -1, 0], 
      faceColors: {
        D: cubeState.D[1 - 0][-1 + 1], // row=1-z=1, col=x+1=0
        L: cubeState.L[1 - (-1)][0 + 1], // row=1-y=2, col=z+1=1
      }
    },
    // FR: [1, 0, 1]
    { 
      coord: [1, 0, 1], 
      faceColors: {
        F: cubeState.F[1 - 0][1 + 1], // row=1-y=1, col=x+1=2
        R: cubeState.R[1 - 0][1 - 1], // row=1-y=1, col=1-z=0
      }
    },
    // FL: [-1, 0, 1]
    { 
      coord: [-1, 0, 1], 
      faceColors: {
        F: cubeState.F[1 - 0][-1 + 1], // row=1-y=1, col=x+1=0
        L: cubeState.L[1 - 0][1 + 1], // row=1-y=1, col=z+1=2
      }
    },
    // BR: [1, 0, -1]
    { 
      coord: [1, 0, -1], 
      faceColors: {
        B: cubeState.B[1 - 0][1 - 1], // row=1-y=1, col=1-x=0
        R: cubeState.R[1 - 0][1 - (-1)], // row=1-y=1, col=1-z=2
      }
    },
    // BL: [-1, 0, -1]
    { 
      coord: [-1, 0, -1], 
      faceColors: {
        B: cubeState.B[1 - 0][1 - (-1)], // row=1-y=1, col=1-x=2
        L: cubeState.L[1 - 0][-1 + 1], // row=1-y=1, col=z+1=0
      }
    },
  ]

  // 为每个位置找到匹配的边块
  for (const pos of edgePositions) {
    const targetColors = Object.values(pos.faceColors).filter(c => c !== undefined) as FaceColor[]
    const matchingEdge = findMatchingEdge(targetColors, solved.edges, result.edges)
    if (matchingEdge) {
      result.edges[matchingEdge.id] = {
        ...matchingEdge,
        coordinate: pos.coord,
        colors: adjustEdgeColors(matchingEdge.colors, pos.faceColors, pos.coord),
      }
    }
  }

  return result
}

/**
 * 找到匹配给定颜色的角块
 */
function findMatchingCorner(
  targetColors: FaceColor[],
  solvedCorners: Record<CornerCubieId, { id: CornerCubieId, colors: CubieColors }>,
  usedCorners: Record<string, any>
): { id: CornerCubieId, colors: CubieColors } | null {
  for (const [id, corner] of Object.entries(solvedCorners)) {
    if (usedCorners[id]) continue // 已经被使用
    
    // 获取角块的三个可见颜色
    const cornerColors = [
      corner.colors.upper !== 'black' ? corner.colors.upper : null,
      corner.colors.front !== 'black' ? corner.colors.front : null,
      corner.colors.right !== 'black' ? corner.colors.right : null,
      corner.colors.back !== 'black' ? corner.colors.back : null,
      corner.colors.left !== 'black' ? corner.colors.left : null,
      corner.colors.down !== 'black' ? corner.colors.down : null,
    ].filter(c => c !== null) as FaceColor[]
    
    // 检查是否包含所有目标颜色
    const hasAllColors = targetColors.every(tc => cornerColors.includes(tc))
    if (hasAllColors && cornerColors.length === 3 && targetColors.length === 3) {
      return { id: id as CornerCubieId, colors: corner.colors }
    }
  }
  return null
}

/**
 * 找到匹配给定颜色的边块
 */
function findMatchingEdge(
  targetColors: FaceColor[],
  solvedEdges: Record<EdgeCubieId, { id: EdgeCubieId, colors: CubieColors }>,
  usedEdges: Record<string, any>
): { id: EdgeCubieId, colors: CubieColors } | null {
  for (const [id, edge] of Object.entries(solvedEdges)) {
    if (usedEdges[id]) continue // 已经被使用
    
    // 获取边块的两个可见颜色
    const edgeColors = [
      edge.colors.upper !== 'black' ? edge.colors.upper : null,
      edge.colors.front !== 'black' ? edge.colors.front : null,
      edge.colors.right !== 'black' ? edge.colors.right : null,
      edge.colors.back !== 'black' ? edge.colors.back : null,
      edge.colors.left !== 'black' ? edge.colors.left : null,
      edge.colors.down !== 'black' ? edge.colors.down : null,
    ].filter(c => c !== null) as FaceColor[]
    
    // 检查是否包含所有目标颜色
    const hasAllColors = targetColors.every(tc => edgeColors.includes(tc))
    if (hasAllColors && edgeColors.length === 2 && targetColors.length === 2) {
      return { id: id as EdgeCubieId, colors: edge.colors }
    }
  }
  return null
}

/**
 * 调整角块颜色以匹配当前位置
 * 根据坐标确定哪些面可见，然后设置对应的颜色
 */
function adjustCornerColors(
  originalColors: CubieColors,
  targetFaceColors: { U?: FaceColor, D?: FaceColor, F?: FaceColor, B?: FaceColor, R?: FaceColor, L?: FaceColor },
  coord: [number, number, number]
): CubieColors {
  const [x, y, z] = coord
  const result: CubieColors = { ...originalColors }
  
  // 根据坐标确定哪些面可见，然后设置对应的颜色
  // y=1 表示在魔方的 U 面，此时 cubie 的 upper 面可见
  if (y === 1 && targetFaceColors.U) {
    result.upper = targetFaceColors.U
  }
  // y=-1 表示在魔方的 D 面，此时 cubie 的 down 面可见
  if (y === -1 && targetFaceColors.D) {
    result.down = targetFaceColors.D
  }
  // z=1 表示在魔方的 F 面，此时 cubie 的 front 面可见
  if (z === 1 && targetFaceColors.F) {
    result.front = targetFaceColors.F
  }
  // z=-1 表示在魔方的 B 面，此时 cubie 的 back 面可见
  if (z === -1 && targetFaceColors.B) {
    result.back = targetFaceColors.B
  }
  // x=1 表示在魔方的 R 面，此时 cubie 的 right 面可见
  if (x === 1 && targetFaceColors.R) {
    result.right = targetFaceColors.R
  }
  // x=-1 表示在魔方的 L 面，此时 cubie 的 left 面可见
  if (x === -1 && targetFaceColors.L) {
    result.left = targetFaceColors.L
  }
  
  return result
}

/**
 * 调整边块颜色以匹配当前位置
 * 根据坐标确定哪些面可见，然后设置对应的颜色
 */
function adjustEdgeColors(
  originalColors: CubieColors,
  targetFaceColors: { U?: FaceColor, D?: FaceColor, F?: FaceColor, B?: FaceColor, R?: FaceColor, L?: FaceColor },
  coord: [number, number, number]
): CubieColors {
  const [x, y, z] = coord
  const result: CubieColors = { ...originalColors }
  
  // 根据坐标确定哪些面可见，然后设置对应的颜色
  if (y === 1 && targetFaceColors.U) {
    result.upper = targetFaceColors.U
  }
  if (y === -1 && targetFaceColors.D) {
    result.down = targetFaceColors.D
  }
  if (z === 1 && targetFaceColors.F) {
    result.front = targetFaceColors.F
  }
  if (z === -1 && targetFaceColors.B) {
    result.back = targetFaceColors.B
  }
  if (x === 1 && targetFaceColors.R) {
    result.right = targetFaceColors.R
  }
  if (x === -1 && targetFaceColors.L) {
    result.left = targetFaceColors.L
  }
  
  return result
}
