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

/**
 * 创建空的输入状态
 */
export function createEmptyInputState(): CubeInputState {
  const faces: Record<Face, FaceInputState> = {
    U: { face: 'U', colors: Array(3).fill(null).map(() => Array(3).fill('black') as FaceColor[]), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    D: { face: 'D', colors: Array(3).fill(null).map(() => Array(3).fill('black') as FaceColor[]), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    F: { face: 'F', colors: Array(3).fill(null).map(() => Array(3).fill('black') as FaceColor[]), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    B: { face: 'B', colors: Array(3).fill(null).map(() => Array(3).fill('black') as FaceColor[]), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    L: { face: 'L', colors: Array(3).fill(null).map(() => Array(3).fill('black') as FaceColor[]), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
    R: { face: 'R', colors: Array(3).fill(null).map(() => Array(3).fill('black') as FaceColor[]), confidence: Array(3).fill(null).map(() => Array(3).fill(0)), isComplete: false },
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
 * 检查输入状态是否完整（所有面都已录入）
 */
export function isInputStateComplete(inputState: CubeInputState): boolean {
  return Object.values(inputState.faces).every(face => face.isComplete)
}
