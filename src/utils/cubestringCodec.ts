import type { CubeState, CubieBasedCubeState, FaceColor, Move } from './cubeTypes'
import { FACE_COLORS } from './cubeTypes'
import { applyMove } from './cubeLogic'
import { cubeStateToCubestring } from './cubeConverter'
import { faceColorsToCubieBasedState } from './faceColorsToCubieBased'
import { cubieBasedStateToFaceColors } from './cubieBasedCubeLogic'

/**
 * Kociemba 标准已解 cubestring（URFDLB，每面 9 贴纸行优先）。
 * 与 `cubeStateToCubestring(createSolvedCube())` 一致。
 */
export const SOLVED_CUBESTRING =
  'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'

const KOCIEMBA_CHAR_TO_FACE: Record<string, FaceColor> = {
  U: FACE_COLORS.U,
  R: FACE_COLORS.R,
  F: FACE_COLORS.F,
  D: FACE_COLORS.D,
  L: FACE_COLORS.L,
  B: FACE_COLORS.B,
}

function kociembaCharToFaceColor(c: string): FaceColor {
  const col = KOCIEMBA_CHAR_TO_FACE[c]
  if (!col) {
    throw new Error(`无效的 cubestring 字符: "${c}"（期望 U R F D L B 之一）`)
  }
  return col
}

/**
 * 将 54 位 Kociemba cubestring 解析为面模型（与 `cubeStateToCubestring` 互逆）。
 * `parseCubestring` 为文档约定名称，与本函数等价。
 */
export function cubestringToCubeState(cubestring: string): CubeState {
  const s = cubestring.trim()
  if (s.length !== 54) {
    throw new Error(`cubestring 长度应为 54，实际为 ${s.length}`)
  }
  const chars = [...s]
  let i = 0
  const takeFace = (): FaceColor[][] => {
    const face: FaceColor[][] = []
    for (let row = 0; row < 3; row++) {
      face[row] = []
      for (let col = 0; col < 3; col++) {
        face[row][col] = kociembaCharToFaceColor(chars[i]!)
        i++
      }
    }
    return face
  }
  return {
    U: takeFace(),
    R: takeFace(),
    F: takeFace(),
    D: takeFace(),
    L: takeFace(),
    B: takeFace(),
  }
}

/** @alias {@link cubestringToCubeState} */
export function parseCubestring(cubestring: string): CubeState {
  return cubestringToCubeState(cubestring)
}

/** 单步面模型转动（与 `cubeLogic.applyMove` 一致） */
export function applyMoveToCubeState(state: CubeState, m: Move): CubeState {
  return applyMove(state, m)
}

/** 与 Kociemba 一致的规范 cubestring，供求解器入口与测试与 UI cubie 状态对齐 */
export function cubieBasedStateToCanonicalCubestring(
  state: CubieBasedCubeState
): string {
  return cubeStateToCubestring(cubieBasedStateToFaceColors(state))
}

/** 与 `cubeStateToCubestring` 同义，便于与文档命名一致 */
export { cubeStateToCubestring as serializeCubeState } from './cubeConverter'

/**
 * cubestring → 与渲染、IDA*、Thistlethwaite 共用的 cubie 状态（经 `faceColorsToCubieBasedState`）。
 */
export function cubieFromCubestring(cubestring: string): CubieBasedCubeState {
  return faceColorsToCubieBasedState(cubestringToCubeState(cubestring))
}

/**
 * 从初始 cubestring 依次应用转动，返回结果 cubestring。
 * 用于单元测试验收「解法是否还原」，不依赖 3D 与 cubie 求解器。
 */
export function applyMovesToCubestring(start: string, moves: readonly Move[]): string {
  let state = cubestringToCubeState(start)
  for (const m of moves) {
    state = applyMove(state, m)
  }
  return cubeStateToCubestring(state)
}
