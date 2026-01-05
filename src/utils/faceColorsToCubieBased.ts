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

  // 2. 创建已解决状态作为基础
  const solved = createSolvedCubieBasedCube()
  const result: CubieBasedCubeState = {
    corners: {} as Record<CornerCubieId, typeof solved.corners[CornerCubieId]>,
    edges: {} as Record<EdgeCubieId, typeof solved.edges[EdgeCubieId]>,
    faces: {} as Record<FaceCubieId, typeof solved.faces[FaceCubieId]>,
  }

  // 3. 设置中心块（根据识别的颜色）
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

  // 4. 处理角块：对于每个角块位置，找到匹配的角块
  const cornerPositions: Array<{ coord: [number, number, number], colors: [FaceColor, FaceColor, FaceColor] }> = [
    // UFR: [1, 1, 1] -> U面(1,1), F面(1,1), R面(1,1)
    { coord: [1, 1, 1], colors: [cubeState.U[2][2], cubeState.F[0][2], cubeState.R[0][0]] },
    // UFL: [-1, 1, 1] -> U面(1,0), F面(1,0), L面(1,2)
    { coord: [-1, 1, 1], colors: [cubeState.U[2][0], cubeState.F[0][0], cubeState.L[0][2]] },
    // UBL: [-1, 1, -1] -> U面(0,0), B面(1,0), L面(1,0)
    { coord: [-1, 1, -1], colors: [cubeState.U[0][0], cubeState.B[0][2], cubeState.L[0][0]] },
    // UBR: [1, 1, -1] -> U面(0,2), B面(1,2), R面(1,2)
    { coord: [1, 1, -1], colors: [cubeState.U[0][2], cubeState.B[0][0], cubeState.R[0][2]] },
    // DFR: [1, -1, 1] -> D面(0,2), F面(2,2), R面(2,0)
    { coord: [1, -1, 1], colors: [cubeState.D[0][2], cubeState.F[2][2], cubeState.R[2][0]] },
    // DFL: [-1, -1, 1] -> D面(0,0), F面(2,0), L面(2,2)
    { coord: [-1, -1, 1], colors: [cubeState.D[0][0], cubeState.F[2][0], cubeState.L[2][2]] },
    // DBL: [-1, -1, -1] -> D面(2,0), B面(2,0), L面(2,0)
    { coord: [-1, -1, -1], colors: [cubeState.D[2][0], cubeState.B[2][2], cubeState.L[2][0]] },
    // DBR: [1, -1, -1] -> D面(2,2), B面(2,2), R面(2,2)
    { coord: [1, -1, -1], colors: [cubeState.D[2][2], cubeState.B[2][0], cubeState.R[2][2]] },
  ]

  // 为每个位置找到匹配的角块
  for (const pos of cornerPositions) {
    const matchingCorner = findMatchingCorner(pos.colors, solved.corners, result.corners)
    if (matchingCorner) {
      result.corners[matchingCorner.id] = {
        ...matchingCorner,
        coordinate: pos.coord,
        colors: adjustCornerColors(matchingCorner.colors, pos.colors, pos.coord),
      }
    }
  }

  // 5. 处理边块：对于每个边块位置，找到匹配的边块
  const edgePositions: Array<{ coord: [number, number, number], colors: [FaceColor, FaceColor] }> = [
    // UF: [0, 1, 1] -> U面(1,1), F面(0,1)
    { coord: [0, 1, 1], colors: [cubeState.U[2][1], cubeState.F[0][1]] },
    // UR: [1, 1, 0] -> U面(1,2), R面(0,1)
    { coord: [1, 1, 0], colors: [cubeState.U[1][2], cubeState.R[0][1]] },
    // UB: [0, 1, -1] -> U面(0,1), B面(0,1)
    { coord: [0, 1, -1], colors: [cubeState.U[0][1], cubeState.B[0][1]] },
    // UL: [-1, 1, 0] -> U面(1,0), L面(0,1)
    { coord: [-1, 1, 0], colors: [cubeState.U[1][0], cubeState.L[0][1]] },
    // DF: [0, -1, 1] -> D面(0,1), F面(2,1)
    { coord: [0, -1, 1], colors: [cubeState.D[0][1], cubeState.F[2][1]] },
    // DR: [1, -1, 0] -> D面(1,2), R面(2,1)
    { coord: [1, -1, 0], colors: [cubeState.D[1][2], cubeState.R[2][1]] },
    // DB: [0, -1, -1] -> D面(2,1), B面(2,1)
    { coord: [0, -1, -1], colors: [cubeState.D[2][1], cubeState.B[2][1]] },
    // DL: [-1, -1, 0] -> D面(1,0), L面(2,1)
    { coord: [-1, -1, 0], colors: [cubeState.D[1][0], cubeState.L[2][1]] },
    // FR: [1, 0, 1] -> F面(1,2), R面(1,0)
    { coord: [1, 0, 1], colors: [cubeState.F[1][2], cubeState.R[1][0]] },
    // FL: [-1, 0, 1] -> F面(1,0), L面(1,2)
    { coord: [-1, 0, 1], colors: [cubeState.F[1][0], cubeState.L[1][2]] },
    // BR: [1, 0, -1] -> B面(1,0), R面(1,2)
    { coord: [1, 0, -1], colors: [cubeState.B[1][2], cubeState.R[1][2]] },
    // BL: [-1, 0, -1] -> B面(1,2), L面(1,0)
    { coord: [-1, 0, -1], colors: [cubeState.B[1][0], cubeState.L[1][0]] },
  ]

  // 为每个位置找到匹配的边块
  for (const pos of edgePositions) {
    const matchingEdge = findMatchingEdge(pos.colors, solved.edges, result.edges)
    if (matchingEdge) {
      result.edges[matchingEdge.id] = {
        ...matchingEdge,
        coordinate: pos.coord,
        colors: adjustEdgeColors(matchingEdge.colors, pos.colors, pos.coord),
      }
    }
  }

  return result
}

/**
 * 找到匹配给定颜色的角块
 */
function findMatchingCorner(
  targetColors: [FaceColor, FaceColor, FaceColor],
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
    if (hasAllColors && cornerColors.length === 3) {
      return { id: id as CornerCubieId, colors: corner.colors }
    }
  }
  return null
}

/**
 * 找到匹配给定颜色的边块
 */
function findMatchingEdge(
  targetColors: [FaceColor, FaceColor],
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
    if (hasAllColors && edgeColors.length === 2) {
      return { id: id as EdgeCubieId, colors: edge.colors }
    }
  }
  return null
}

/**
 * 调整角块颜色以匹配当前位置
 */
function adjustCornerColors(
  originalColors: CubieColors,
  targetColors: [FaceColor, FaceColor, FaceColor],
  coord: [number, number, number]
): CubieColors {
  const [x, y, z] = coord
  const result: CubieColors = { ...originalColors }
  
  // 根据坐标确定哪个面应该显示哪个颜色
  // UFR [1,1,1]: upper=targetColors[0], front=targetColors[1], right=targetColors[2]
  // UFL [-1,1,1]: upper=targetColors[0], front=targetColors[1], left=targetColors[2]
  // 等等...
  
  // 简化实现：直接根据坐标映射
  if (y === 1) result.upper = targetColors[0] // U面
  if (y === -1) result.down = targetColors.find(c => c !== result.upper && c !== result.front && c !== result.back && c !== result.left && c !== result.right) || targetColors[0]
  if (z === 1) result.front = targetColors[1] // F面
  if (z === -1) result.back = targetColors.find(c => c !== result.upper && c !== result.down && c !== result.front && c !== result.left && c !== result.right) || targetColors[1]
  if (x === 1) result.right = targetColors[2] // R面
  if (x === -1) result.left = targetColors.find(c => c !== result.upper && c !== result.down && c !== result.front && c !== result.back && c !== result.right) || targetColors[2]
  
  // 更准确的实现需要根据角块的实际方向来调整
  // 这里使用简化版本，实际应该考虑所有可能的旋转
  
  return result
}

/**
 * 调整边块颜色以匹配当前位置
 */
function adjustEdgeColors(
  originalColors: CubieColors,
  targetColors: [FaceColor, FaceColor],
  coord: [number, number, number]
): CubieColors {
  const [x, y, z] = coord
  const result: CubieColors = { ...originalColors }
  
  // 根据坐标确定哪个面应该显示哪个颜色
  // 简化实现
  if (y === 1) result.upper = targetColors[0]
  if (y === -1) result.down = targetColors[0]
  if (z === 1) result.front = targetColors[1]
  if (z === -1) result.back = targetColors[1]
  if (x === 1) result.right = targetColors[1]
  if (x === -1) result.left = targetColors[1]
  
  return result
}
