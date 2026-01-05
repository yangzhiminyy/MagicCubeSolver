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
  FaceColor,
  FACE_COLORS,
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
