import { Move } from './cubeTypes'

/**
 * 动画类型定义
 */
export interface AnimationState {
  isAnimating: boolean
  move: Move | null
  progress: number // 0 到 1
  axis: [number, number, number] | null // 旋转轴
  angle: number // 目标角度（弧度）
  affectedCubies: Array<{ x: number; y: number; z: number }> // 需要旋转的 cubies
  rotationCenter: [number, number, number] | null // 旋转中心
}

/**
 * 根据移动类型确定需要旋转的 cubies 和旋转轴
 */
export function getAnimationInfo(move: Move): {
  axis: [number, number, number]
  angle: number
  affectedCubies: Array<{ x: number; y: number; z: number }>
  rotationCenter: [number, number, number] // 旋转中心
} {
  // 确定旋转角度
  let angle = Math.PI / 2 // 90度
  if (move.endsWith('2')) {
    angle = Math.PI // 180度
  }
  
  // 确定旋转方向（顺时针或逆时针）
  if (move.endsWith("'")) {
    angle = -angle // 逆时针
  }
  
  // 确定旋转轴和受影响的 cubies
  const baseMove = move.replace("'", '').replace('2', '')
  let axis: [number, number, number] = [0, 0, 0]
  let rotationCenter: [number, number, number] = [0, 0, 0]
  const affectedCubies: Array<{ x: number; y: number; z: number }> = []
  
  switch (baseMove) {
    case 'R':
      // R面：x=1，绕 x 轴旋转（从右侧看，顺时针）
      // 在 Three.js 中，从 x 轴正方向看，顺时针是负角度
      axis = [1, 0, 0] // 绕 x 轴（左右轴）
      rotationCenter = [1, 0, 0] // R 面的中心
      // 所有 x=1 的 cubies
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          affectedCubies.push({ x: 1, y, z })
        }
      }
      // R 从右侧看顺时针，需要取反角度
      angle = -angle
      break
      
    case 'L':
      // L面：x=-1，绕 x 轴旋转（从左侧看，顺时针）
      // 从左侧看（x 轴负方向），顺时针是正角度
      axis = [1, 0, 0] // 绕 x 轴（左右轴）
      rotationCenter = [-1, 0, 0] // L 面的中心
      // 所有 x=-1 的 cubies
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          affectedCubies.push({ x: -1, y, z })
        }
      }
      // L 从左侧看顺时针，保持正角度（不需要取反）
      break
      
    case 'U':
      // U面：y=1，绕 y 轴旋转（从上往下看，顺时针）
      // 在 Three.js 中，从 y 轴正方向看，顺时针是负角度
      axis = [0, 1, 0] // 绕 y 轴（垂直轴）
      rotationCenter = [0, 1, 0] // U 面的中心
      // 所有 y=1 的 cubies
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          affectedCubies.push({ x, y: 1, z })
        }
      }
      // U 从上方看顺时针，需要取反角度
      angle = -angle
      break
      
    case 'D':
      // D面：y=-1，绕 y 轴旋转（从下往上看，顺时针）
      // 从下方看（y 轴负方向），顺时针是正角度
      axis = [0, 1, 0] // 绕 y 轴
      rotationCenter = [0, -1, 0] // D 面的中心
      // 所有 y=-1 的 cubies
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          affectedCubies.push({ x, y: -1, z })
        }
      }
      // D 从下方看顺时针，保持正角度（不需要取反）
      break
      
    case 'F':
      // F面：z=1，绕 z 轴旋转（从前往后看，顺时针）
      // 在 Three.js 中，从 z 轴正方向看，顺时针是负角度
      axis = [0, 0, 1] // 绕 z 轴（前后轴）
      rotationCenter = [0, 0, 1] // F 面的中心
      // 所有 z=1 的 cubies
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          affectedCubies.push({ x, y, z: 1 })
        }
      }
      // F 从前方看顺时针，需要取反角度
      angle = -angle
      break
      
    case 'B':
      // B面：z=-1，绕 z 轴旋转（从后往前看，顺时针）
      // 从后方看（z 轴负方向），顺时针是正角度
      axis = [0, 0, 1] // 绕 z 轴
      rotationCenter = [0, 0, -1] // B 面的中心
      // 所有 z=-1 的 cubies
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          affectedCubies.push({ x, y, z: -1 })
        }
      }
      // B 从后方看顺时针，保持正角度（不需要取反）
      break
  }
  
  return { axis, angle, affectedCubies, rotationCenter }
}

/**
 * 检查一个 cubie 是否在动画中
 */
export function isCubieAffected(
  cubiePos: { x: number; y: number; z: number },
  affectedCubies: Array<{ x: number; y: number; z: number }>
): boolean {
  return affectedCubies.some(
    pos => pos.x === cubiePos.x && pos.y === cubiePos.y && pos.z === cubiePos.z
  )
}
