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
// 使用 upper/down/front/back/left/right 表示 cubie 的实时方位，以区分魔方的固定面 U/D/F/B/L/R
export interface CubieColors {
  upper: FaceColor   // cubie 的上表面（对应魔方的 U 面）
  down: FaceColor    // cubie 的下表面（对应魔方的 D 面）
  front: FaceColor   // cubie 的前表面（对应魔方的 F 面）
  back: FaceColor    // cubie 的后表面（对应魔方的 B 面）
  left: FaceColor    // cubie 的左表面（对应魔方的 L 面）
  right: FaceColor   // cubie 的右表面（对应魔方的 R 面）
}

// 角块：有6个面的颜色（3个可见面，3个不可见面用黑色）
export interface CornerCubie {
  id: CornerCubieId
  coordinate: [number, number, number]  // 坐标 [x, y, z]，取值 -1, 0, 1
  colors: CubieColors      // 颜色（可旋转）
}

// 边块：有6个面的颜色（2个可见面，4个不可见面用黑色）
export interface EdgeCubie {
  id: EdgeCubieId
  coordinate: [number, number, number]  // 坐标 [x, y, z]，取值 -1, 0, 1
  colors: CubieColors      // 颜色（可旋转）
}

// 面块：只有1个面（中心块）
export interface FaceCubie {
  id: FaceCubieId
  coordinate: [number, number, number]  // 坐标 [x, y, z]，固定不变
  color: FaceColor         // 颜色（不变）
}

// 新的基于 Cubie 的 CubeState
export interface CubieBasedCubeState {
  corners: Record<CornerCubieId, CornerCubie>
  edges: Record<EdgeCubieId, EdgeCubie>
  faces: Record<FaceCubieId, FaceCubie>
}
