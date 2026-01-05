export type FaceColor = 'white' | 'yellow' | 'red' | 'orange' | 'green' | 'blue'

export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R'

export type Move = 
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2'
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'

export interface CubeState {
  // 每个面是一个3x3的数组，存储颜色
  U: FaceColor[][]
  D: FaceColor[][]
  F: FaceColor[][]
  B: FaceColor[][]
  L: FaceColor[][]
  R: FaceColor[][]
}

export const FACE_COLORS: Record<Face, FaceColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'green',
  R: 'blue',
}

// ============================================================================
// 新的 Cubie-based 数据结构（重构方案）
// ============================================================================

// Corner Cubie IDs (8个角块)
export type CornerCubieId = 
  | 'UFR' | 'UFL' | 'UBL' | 'UBR'  // 上层角块
  | 'DFR' | 'DFL' | 'DBL' | 'DBR'  // 下层角块

// Edge Cubie IDs (12个边块)
export type EdgeCubieId =
  | 'UF' | 'UR' | 'UB' | 'UL'      // 上层边块
  | 'DF' | 'DR' | 'DB' | 'DL'      // 下层边块
  | 'FR' | 'FL' | 'BR' | 'BL'      // 中层边块

// Face Cubie IDs (6个中心块)
export type FaceCubieId = 'U' | 'D' | 'F' | 'B' | 'L' | 'R'

export type CubieId = CornerCubieId | EdgeCubieId | FaceCubieId

// Cubie 颜色映射
export interface CubieColors {
  U?: FaceColor
  D?: FaceColor
  F?: FaceColor
  B?: FaceColor
  L?: FaceColor
  R?: FaceColor
}

// 角块：有3个面，每个面有颜色
// orientation: 0 = 正确方向, 1 = 顺时针转一次, 2 = 顺时针转两次
export interface CornerCubie {
  id: CornerCubieId
  position: CornerCubieId  // 当前位置
  orientation: 0 | 1 | 2   // 方向（0, 1, 2）
  colors: CubieColors      // 初始颜色（不变）
}

// 边块：有2个面
// orientation: 0 = 正确方向, 1 = 翻转
export interface EdgeCubie {
  id: EdgeCubieId
  position: EdgeCubieId    // 当前位置
  orientation: 0 | 1       // 方向（0=正确，1=翻转）
  colors: CubieColors      // 初始颜色（不变）
}

// 面块：只有1个面（中心块）
export interface FaceCubie {
  id: FaceCubieId
  position: FaceCubieId    // 中心块位置固定
  color: FaceColor         // 颜色（不变）
}

// 新的基于 Cubie 的 CubeState
export interface CubieBasedCubeState {
  corners: Record<CornerCubieId, CornerCubie>
  edges: Record<EdgeCubieId, EdgeCubie>
  faces: Record<FaceCubieId, FaceCubie>
}
