import { CubeState } from './cubeTypes'

// 将我们的CubeState转换为cubing库需要的面状态字符串
// cubing库使用标准颜色映射：U=白, D=黄, F=红, B=橙, L=绿, R=蓝
export function cubeStateToFacelets(cubeState: CubeState): string {
  // 面顺序: U R F D L B
  // 每个面是3x3，按行优先顺序
  
  let facelets = ''
  
  // U面 (上，白色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.U[row][col])
    }
  }
  
  // R面 (右，蓝色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.R[row][col])
    }
  }
  
  // F面 (前，红色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.F[row][col])
    }
  }
  
  // D面 (下，黄色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.D[row][col])
    }
  }
  
  // L面 (左，绿色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.L[row][col])
    }
  }
  
  // B面 (后，橙色)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      facelets += colorToChar(cubeState.B[row][col])
    }
  }
  
  return facelets
}

function colorToChar(color: string): string {
  const colorMap: Record<string, string> = {
    'white': 'U',
    'yellow': 'D',
    'red': 'F',
    'orange': 'B',
    'green': 'L',
    'blue': 'R',
  }
  return colorMap[color] || 'U'
}
