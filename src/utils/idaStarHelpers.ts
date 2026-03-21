/**
 * IDA* 辅助：紧凑状态键、快速判等、Manhattan 下界（与 cubeSolver 配合）
 */

import type { CubieBasedCubeState, CubeState, FaceColor } from './cubeTypes'

/** 与 Kociemba cubestring 一致的颜色单字符，便于 54 位状态键 */
export function faceColorToKeyChar(c: FaceColor): string {
  switch (c) {
    case 'white':
      return 'U'
    case 'yellow':
      return 'D'
    case 'red':
      return 'F'
    case 'orange':
      return 'B'
    case 'green':
      return 'L'
    case 'blue':
      return 'R'
    case 'black':
      return 'X'
    default:
      return 'X'
  }
}

/** 54 字符状态键（面顺序 U R F D L B，与 cubeConverter.cubeStateToCubestring 一致） */
export function cubeStateToKeyString(cs: CubeState): string {
  let s = ''
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      s += faceColorToKeyChar(cs.U[row][col])
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      s += faceColorToKeyChar(cs.R[row][col])
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      s += faceColorToKeyChar(cs.F[row][col])
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      s += faceColorToKeyChar(cs.D[row][col])
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      s += faceColorToKeyChar(cs.L[row][col])
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      s += faceColorToKeyChar(cs.B[row][col])
    }
  }
  return s
}

/** 逐格比较，避免 JSON.stringify 热路径开销 */
export function cubeStatesEqual(a: CubeState, b: CubeState): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (a.U[row][col] !== b.U[row][col]) return false
      if (a.D[row][col] !== b.D[row][col]) return false
      if (a.F[row][col] !== b.F[row][col]) return false
      if (a.B[row][col] !== b.B[row][col]) return false
      if (a.L[row][col] !== b.L[row][col]) return false
      if (a.R[row][col] !== b.R[row][col]) return false
    }
  }
  return true
}

function manhattan3(
  a: readonly [number, number, number],
  b: readonly [number, number, number]
): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
}

/**
 * 各角块、边块当前坐标到其「家」坐标（解状态中该 id 的坐标）的 Manhattan 之和。
 * 与「错块数/4」合并取 max 可得到信息量更大的可采纳下界（见 cubeSolver 内说明）。
 */
export function manhattanSums(
  state: CubieBasedCubeState,
  solved: CubieBasedCubeState
): { sumCorner: number; sumEdge: number } {
  let sumCorner = 0
  let sumEdge = 0

  for (const id of Object.keys(state.corners) as (keyof typeof state.corners)[]) {
    const c = state.corners[id]
    const home = solved.corners[id].coordinate
    sumCorner += manhattan3(c.coordinate, home)
  }

  for (const id of Object.keys(state.edges) as (keyof typeof state.edges)[]) {
    const e = state.edges[id]
    const home = solved.edges[id].coordinate
    sumEdge += manhattan3(e.coordinate, home)
  }

  return { sumCorner, sumEdge }
}
