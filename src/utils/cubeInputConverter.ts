/**
 * 魔方输入状态转换工具
 * 将 FaceInputState 转换为 CubieBasedCubeState
 */

import { FaceColor, Face, CubeState, CubieBasedCubeState } from './cubeTypes'
import { faceColorsToCubieBasedState } from './faceColorsToCubieBased'

/**
 * 每个面的输入状态
 */
export interface FaceInputState {
  face: Face
  colors: FaceColor[][]  // 3x3 颜色数组
  confidence: number[][]  // 识别置信度（0-1）
  isComplete: boolean
}

/**
 * 所有面的输入状态
 */
export interface CubeInputState {
  faces: Record<Face, FaceInputState>
}

// 中心块颜色固定
const CENTER_COLORS: Record<Face, FaceColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'green',
  R: 'blue',
}

/**
 * 创建空的输入状态
 */
export function createEmptyInputState(): CubeInputState {
  const createFaceColors = (face: Face): FaceColor[][] => {
    const colors: FaceColor[][] = Array(3).fill(null).map(() => Array(3).fill('black') as FaceColor[])
    // 中心块设置为固定颜色
    colors[1][1] = CENTER_COLORS[face]
    return colors
  }

  const faces: Record<Face, FaceInputState> = {
    U: { face: 'U', colors: createFaceColors('U'), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    D: { face: 'D', colors: createFaceColors('D'), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    F: { face: 'F', colors: createFaceColors('F'), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    B: { face: 'B', colors: createFaceColors('B'), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    L: { face: 'L', colors: createFaceColors('L'), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    R: { face: 'R', colors: createFaceColors('R'), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
  }
  return { faces }
}

/**
 * 将 FaceInputState 转换为 CubeState
 */
export function inputStateToCubeState(inputState: CubeInputState): CubeState {
  const cubeState: CubeState = {
    U: inputState.faces.U.colors,
    D: inputState.faces.D.colors,
    F: inputState.faces.F.colors,
    B: inputState.faces.B.colors,
    L: inputState.faces.L.colors,
    R: inputState.faces.R.colors,
  }
  return cubeState
}

/**
 * 将 CubeInputState 转换为 CubieBasedCubeState
 */
export function inputStateToCubieBasedState(inputState: CubeInputState): CubieBasedCubeState {
  const cubeState = inputStateToCubeState(inputState)
  return faceColorsToCubieBasedState(cubeState)
}

/**
 * 检查某个面的所有颜色是否都已设置（不是black）
 */
export function isFaceComplete(faceState: FaceInputState): boolean {
  // 检查所有9个格子，中心块固定颜色不算，其他8个必须都不是black
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // 跳过中心块（中心块颜色是固定的）
      if (row === 1 && col === 1) continue
      if (faceState.colors[row][col] === 'black') {
        return false
      }
    }
  }
  return true
}

/**
 * 检查输入状态是否完整（所有面都已录入）
 */
export function isInputStateComplete(inputState: CubeInputState): boolean {
  return Object.values(inputState.faces).every(face => face.isComplete)
}
