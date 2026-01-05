/**
 * 魔方输入状态转换工具
 * 将 FaceInputState 转换为 CubieBasedCubeState
 */

import { FaceColor, Face, CubeState, CubieBasedCubeState } from './cubeTypes'
import { createSolvedCubieBasedCube, cubieBasedStateToFaceColors } from './cubieBasedCubeLogic'

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
 * 
 * 注意：这是一个简化的实现，通过创建已解决状态然后应用移动来匹配输入状态。
 * 更准确的实现需要从面颜色直接推断每个 cubie 的位置和方向，这比较复杂。
 * 当前实现：先创建已解决状态，然后尝试找到一组移动来匹配输入状态。
 * 
 * 对于初始状态录入，我们可以直接使用 CubeState，然后在需要时转换为 CubieBasedCubeState。
 * 或者，我们可以实现一个更复杂的算法来从面颜色推断 cubie 状态。
 * 
 * 暂时使用一个简化方法：假设输入状态是有效的，直接使用 CubeState。
 * 如果需要 CubieBasedCubeState，可以通过其他方式（如求解算法）来获得。
 */
export function inputStateToCubieBasedState(inputState: CubeInputState): CubieBasedCubeState {
  // TODO: 实现从 CubeState 到 CubieBasedCubeState 的完整转换
  // 这需要分析每个面的颜色，推断每个 cubie 的位置和方向
  // 当前返回已解决状态作为占位符
  // 实际使用时，应该通过求解算法或其他方式获得正确的 CubieBasedCubeState
  return createSolvedCubieBasedCube()
}

/**
 * 检查输入状态是否完整（所有面都已录入）
 */
export function isInputStateComplete(inputState: CubeInputState): boolean {
  return Object.values(inputState.faces).every(face => face.isComplete)
}
