import { CubeState, FaceColor, Move, FACE_COLORS } from './cubeTypes'

export function createSolvedCube(): CubeState {
  const cube: CubeState = {
    U: Array(3).fill(null).map(() => Array(3).fill(FACE_COLORS.U)) as FaceColor[][],
    D: Array(3).fill(null).map(() => Array(3).fill(FACE_COLORS.D)) as FaceColor[][],
    F: Array(3).fill(null).map(() => Array(3).fill(FACE_COLORS.F)) as FaceColor[][],
    B: Array(3).fill(null).map(() => Array(3).fill(FACE_COLORS.B)) as FaceColor[][],
    L: Array(3).fill(null).map(() => Array(3).fill(FACE_COLORS.L)) as FaceColor[][],
    R: Array(3).fill(null).map(() => Array(3).fill(FACE_COLORS.R)) as FaceColor[][],
  }
  return cube
}

export function rotateFaceClockwise(face: FaceColor[][]): FaceColor[][] {
  const rotated = Array(3).fill(null).map(() => Array(3).fill('white')) as FaceColor[][]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      rotated[j][2 - i] = face[i][j]
    }
  }
  return rotated
}

export function rotateFaceCounterClockwise(face: FaceColor[][]): FaceColor[][] {
  const rotated = Array(3).fill(null).map(() => Array(3).fill('white')) as FaceColor[][]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      rotated[2 - j][i] = face[i][j]
    }
  }
  return rotated
}

// U面特殊的顺时针旋转函数，考虑坐标映射row=z+1的特殊性
// 由于U面的row=z+1，U[0]对应z=-1（B面），U[2]对应z=1（F面）
// 当U面顺时针旋转时，需要使用标准的顺时针旋转
export function rotateUFaceClockwise(face: FaceColor[][]): FaceColor[][] {
  // 使用标准的顺时针旋转
  return rotateFaceClockwise(face)
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState

  // 处理带2的旋转（转180度）
  if (move.endsWith('2')) {
    const baseMove = move.slice(0, -1) as Move
    const result1 = applyMove(newState, baseMove)
    return applyMove(result1, baseMove)
  }

  // 处理反向旋转
  if (move.endsWith("'")) {
    const baseMove = move.slice(0, -1) as Move
    // 转3次相当于反向转1次
    let result = JSON.parse(JSON.stringify(newState)) as CubeState
    for (let i = 0; i < 3; i++) {
      result = applyMove(result, baseMove as Move)
    }
    return result
  }

  // 基本旋转
  switch (move) {
    case 'R':
      return rotateR(newState)
    case 'L':
      return rotateL(newState)
    case 'U':
      return rotateU(newState)
    case 'D':
      return rotateD(newState)
    case 'F':
      return rotateF(newState)
    case 'B':
      return rotateB(newState)
    default:
      return newState
  }
}

// R面顺时针：U的右列→F的右列→D的右列→B的左列→U的右列
// 根据坐标映射：
// U面row=z+1，所以U[2][2]对应z=1（F面），U[0][2]对应z=-1（B面）
// D面row=1-z，所以D[0][2]对应z=1（F面），D[2][2]对应z=-1（B面）
// 根据显示的坐标，U的右列直接对应F的右列，不需要反向
function rotateR(state: CubeState): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  newState.R = rotateFaceClockwise(state.R)
  
  const temp = [state.U[2][2], state.U[1][2], state.U[0][2]]
  // U的右列 ← F的右列（直接对应，不需要反向）
  newState.U[0][2] = state.F[0][2]
  newState.U[1][2] = state.F[1][2]
  newState.U[2][2] = state.F[2][2]
  newState.F[0][2] = state.D[0][2]
  newState.F[1][2] = state.D[1][2]
  newState.F[2][2] = state.D[2][2]
  // D的右列从F到B是D[0][2], D[1][2], D[2][2]，但B的左列需要反向
  newState.D[0][2] = state.B[2][0]
  newState.D[1][2] = state.B[1][0]
  newState.D[2][2] = state.B[0][0]
  newState.B[2][0] = temp[0]
  newState.B[1][0] = temp[1]
  newState.B[0][0] = temp[2]
  
  return newState
}

// L面顺时针：U的左列→B的右列→D的左列→F的左列→U的左列
// 根据坐标映射：
// U面row=z+1，所以U[2][0]对应z=1（F面），U[0][0]对应z=-1（B面）
// D面row=1-z，所以D[0][0]对应z=1（F面），D[2][0]对应z=-1（B面）
// 根据显示的坐标，U的左列从B的右列获取时，直接对应，不需要反向
function rotateL(state: CubeState): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  newState.L = rotateFaceClockwise(state.L)
  
  const temp = [state.U[0][0], state.U[1][0], state.U[2][0]]
  // U的左列 ← B的右列（直接对应，不需要反向）
  newState.U[0][0] = state.B[2][2]
  newState.U[1][0] = state.B[1][2]
  newState.U[2][0] = state.B[0][2]
  // B的右列需要反向，D的左列从F到B是D[0][0], D[1][0], D[2][0]
  newState.B[2][2] = state.D[0][0]
  newState.B[1][2] = state.D[1][0]
  newState.B[0][2] = state.D[2][0]
  newState.D[0][0] = state.F[0][0]
  newState.D[1][0] = state.F[1][0]
  newState.D[2][0] = state.F[2][0]
  newState.F[0][0] = temp[0]
  newState.F[1][0] = temp[1]
  newState.F[2][0] = temp[2]
  
  return newState
}

// U面顺时针：F的第一行→R的第一行→B的第一行→L的第一行→F的第一行
// 坐标映射（y=1平面）：
// 根据坐标映射：R面col=1-z，所以z=1时col=0（左列，靠近F面），z=-1时col=2（右列，靠近B面）
// U旋转时，y=1平面上的边缘块顺时针移动：F→R→B→L→F
function rotateU(state: CubeState): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  // U面使用标准的顺时针旋转
  newState.U = rotateFaceClockwise(state.U)
  
  const temp = [state.F[0][0], state.F[0][1], state.F[0][2]]
  
  // U旋转时，边缘块顺时针移动：F→R→B→L→F
  // 根据坐标映射，不需要做镜像处理，直接对应即可
  // F的第一行 ← R的第一行（顺时针：F←R）
  newState.F[0][0] = state.R[0][0]
  newState.F[0][1] = state.R[0][1]
  newState.F[0][2] = state.R[0][2]
  
  // R的第一行 ← B的第一行（直接对应，不需要反向，顺时针：R←B）
  newState.R[0][0] = state.B[0][0]
  newState.R[0][1] = state.B[0][1]
  newState.R[0][2] = state.B[0][2]
  
  // B的第一行 ← L的第一行（直接对应，不需要反向，顺时针：B←L）
  newState.B[0][0] = state.L[0][0]
  newState.B[0][1] = state.L[0][1]
  newState.B[0][2] = state.L[0][2]
  
  // L的第一行 ← temp（顺时针：L←F）
  newState.L[0][0] = temp[0]
  newState.L[0][1] = temp[1]
  newState.L[0][2] = temp[2]
  
  return newState
}

// D面顺时针：F的第三行→L的第三行→B的第三行→R的第三行→F的第三行
// 从下面看，D面顺时针旋转：F→L→B→R→F
// 根据坐标映射，边缘块顺时针移动：F←L←B←R←F
function rotateD(state: CubeState): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  newState.D = rotateFaceClockwise(state.D)
  
  const temp = [state.F[2][0], state.F[2][1], state.F[2][2]]
  
  // F的第三行 ← L的第三行（顺时针：F←L）
  newState.F[2][0] = state.L[2][0]
  newState.F[2][1] = state.L[2][1]
  newState.F[2][2] = state.L[2][2]
  
  // L的第三行 ← B的第三行（顺时针：L←B）
  newState.L[2][0] = state.B[2][0]
  newState.L[2][1] = state.B[2][1]
  newState.L[2][2] = state.B[2][2]
  
  // B的第三行 ← R的第三行（顺时针：B←R）
  newState.B[2][0] = state.R[2][0]
  newState.B[2][1] = state.R[2][1]
  newState.B[2][2] = state.R[2][2]
  
  // R的第三行 ← temp（顺时针：R←F）
  newState.R[2][0] = temp[0]
  newState.R[2][1] = temp[1]
  newState.R[2][2] = temp[2]
  
  return newState
}

// F面顺时针：U的第三行→R的左列→D的第一行→L的右列→U的第三行
// 标准魔方旋转：F面顺时针时，边缘块循环移动
function rotateF(state: CubeState): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  newState.F = rotateFaceClockwise(state.F)
  
  const temp = [state.U[2][0], state.U[2][1], state.U[2][2]]
  
  // U的第三行 ← L的右列（从上到下，反向读取）
  newState.U[2][0] = state.L[2][2]
  newState.U[2][1] = state.L[1][2]
  newState.U[2][2] = state.L[0][2]
  
  // L的右列 ← D的第一行（从左到右，不反向）
  newState.L[0][2] = state.D[0][0]
  newState.L[1][2] = state.D[0][1]
  newState.L[2][2] = state.D[0][2]
  
  // D的第一行 ← R的左列（从上到下，不反向）
  newState.D[0][2] = state.R[0][0]
  newState.D[0][1] = state.R[1][0]
  newState.D[0][0] = state.R[2][0]
  
  // R的左列 ← temp（从上到下，不反向写入）
  newState.R[0][0] = temp[0]
  newState.R[1][0] = temp[1]
  newState.R[2][0] = temp[2]
  
  return newState
}

// B面顺时针：U的第一行→L的左列→D的第三行→R的右列→U的第一行
// B面是背面，旋转方向与F面相反
// 根据坐标映射，需要正确处理方向
function rotateB(state: CubeState): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  newState.B = rotateFaceClockwise(state.B)
  
  // temp保存U的第一行（反向保存，因为后续需要反向使用）
  const temp = [state.U[0][2], state.U[0][1], state.U[0][0]]
  
  // U的第一行 ← R的右列（从上到下，反向读取）
  newState.U[0][0] = state.R[0][2]
  newState.U[0][1] = state.R[1][2]
  newState.U[0][2] = state.R[2][2]
  
  // R的右列 ← D的第三行（从左到右，需要反向）
  newState.R[0][2] = state.D[2][2]
  newState.R[1][2] = state.D[2][1]
  newState.R[2][2] = state.D[2][0]
  
  // D的第三行 ← L的左列（从上到下，不反向）
  newState.D[2][0] = state.L[0][0]
  newState.D[2][1] = state.L[1][0]
  newState.D[2][2] = state.L[2][0]
  
  // L的左列 ← temp（从上到下，不反向写入）
  newState.L[0][0] = temp[2]
  newState.L[1][0] = temp[1]
  newState.L[2][0] = temp[0]
  
  return newState
}
