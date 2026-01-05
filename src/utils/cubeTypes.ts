export type FaceColor = 'white' | 'yellow' | 'red' | 'orange' | 'green' | 'blue' | 'black'

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

// Cubie 颜色映射：每个cubie都有6个面的颜色（不可见面用黑色）
export interface CubieColors {
  U: FaceColor
  D: FaceColor
  F: FaceColor
  B: FaceColor
  L: FaceColor
  R: FaceColor
}

// 角块：有6个面的颜色（3个可见面，3个不可见面用黑色）
export interface CornerCubie {
  id: CornerCubieId
  position: CornerCubieId  // 当前位置
  colors: CubieColors      // 颜色（可旋转）
}

// 边块：有6个面的颜色（2个可见面，4个不可见面用黑色）
export interface EdgeCubie {
  id: EdgeCubieId
  position: EdgeCubieId    // 当前位置
  colors: CubieColors      // 颜色（可旋转）
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
