import { Move, CubieBasedCubeState } from './cubeTypes'
import { cubieBasedStateToFaceColors } from './cubieBasedCubeLogic'
import { createSolvedCubieBasedCube } from './cubieBasedCubeLogic'
import { CubeState } from './cubeTypes'
import { solve as kociembaWasmSolve } from 'kociemba-wasm'

// 将 CubeState 转换为 Kociemba 算法需要的 cubestring 格式
// 格式: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
// 面顺序: U R F D L B，每个面按行优先顺序（从左到右，从上到下）
// 
// 根据 RubiksCube.tsx 的坐标映射：
// - U面: row=z+1 (row=0对应z=-1/B面, row=2对应z=1/F面), col=x+1 (col=0对应x=-1/L面, col=2对应x=1/R面)
//   从上到下：row=0到2（B到F），从左到右：col=0到2（L到R）
// - R面: row=1-y (row=0对应y=1/U面, row=2对应y=-1/D面), col=1-z (col=0对应z=1/F面, col=2对应z=-1/B面)
//   从上到下：row=0到2（U到D），从左到右：col=0到2（F到B）
// - F面: row=1-y (row=0对应y=1/U面, row=2对应y=-1/D面), col=x+1 (col=0对应x=-1/L面, col=2对应x=1/R面)
//   从上到下：row=0到2（U到D），从左到右：col=0到2（L到R）
// - D面: row=1-z (row=0对应z=1/F面, row=2对应z=-1/B面), col=x+1 (col=0对应x=-1/L面, col=2对应x=1/R面)
//   从上到下：row=0到2（F到B），从左到右：col=0到2（L到R）
// - L面: row=1-y (row=0对应y=1/U面, row=2对应y=-1/D面), col=z+1 (col=0对应z=-1/B面, col=2对应z=1/F面)
//   从上到下：row=0到2（U到D），从左到右：col=0到2（B到F）
// - B面: row=1-y (row=0对应y=1/U面, row=2对应y=-1/D面), col=1-x (col=0对应x=1/R面, col=2对应x=-1/L面)
//   从上到下：row=0到2（U到D），从左到右：col=0到2（R到L，注意是镜像的）
export function cubeStateToCubestring(cubeState: CubeState): string {
  let cubestring = ''
  
  // Kociemba 官方格式（根据官方文档）：
  // 面顺序：U R F D L B
  // 每个面按行优先顺序（从左到右，从上到下）：U1-U9, R1-R9, F1-F9, D1-D9, L1-L9, B1-B9
  // 
  // 根据 RubiksCube.tsx 的坐标映射：
  // - U面: row=z+1 (row=0对应z=-1/B, row=2对应z=1/F), col=x+1 (col=0对应x=-1/L, col=2对应x=1/R)
  //   Kociemba的U1-U9对应：从上到下（row=0到2），从左到右（col=0到2）
  //   但我们的row=0是B方向，row=2是F方向，所以需要调整
  // - R面: row=1-y (row=0对应y=1/U, row=2对应y=-1/D), col=1-z (col=0对应z=1/F, col=2对应z=-1/B)
  //   Kociemba的R1-R9对应：从上到下（row=0到2），从左到右（col=0到2）
  // - F面: row=1-y (row=0对应y=1/U, row=2对应y=-1/D), col=x+1 (col=0对应x=-1/L, col=2对应x=1/R)
  //   Kociemba的F1-F9对应：从上到下（row=0到2），从左到右（col=0到2）
  // - D面: row=1-z (row=0对应z=1/F, row=2对应z=-1/B), col=x+1 (col=0对应x=-1/L, col=2对应x=1/R)
  //   Kociemba的D1-D9对应：从上到下（row=0到2），从左到右（col=0到2）
  // - L面: row=1-y (row=0对应y=1/U, row=2对应y=-1/D), col=z+1 (col=0对应z=-1/B, col=2对应z=1/F)
  //   Kociemba的L1-L9对应：从上到下（row=0到2），从左到右（col=0到2）
  // - B面: row=1-y (row=0对应y=1/U, row=2对应y=-1/D), col=1-x (col=0对应x=1/R, col=2对应x=-1/L)
  //   Kociemba的B1-B9对应：从上到下（row=0到2），从左到右（col=0到2）
  //   但B面是镜像的，需要调整
  
  // U面 (上，白色) - U1-U9
  // 根据坐标映射，U面 row=z+1，所以row=0是B方向，row=2是F方向
  // Kociemba的U1-U9是从上到下、从左到右
  // 标准顺序：row=0到2, col=0到2
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cubestring += colorToKociembaChar(cubeState.U[row][col])
    }
  }
  
  // R面 (右，蓝色) - R1-R9
  // 根据坐标映射，R面 row=1-y，col=1-z
  // Kociemba的R1-R9是从上到下、从左到右
  // 从右往左看R面：左应该是F方向（col=0），右应该是B方向（col=2）
  // 标准顺序：row=0到2, col=0到2
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cubestring += colorToKociembaChar(cubeState.R[row][col])
    }
  }
  
  // F面 (前，红色) - F1-F9
  // 根据坐标映射，F面 row=1-y，col=x+1
  // Kociemba的F1-F9是从上到下、从左到右
  // 标准顺序：row=0到2, col=0到2
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cubestring += colorToKociembaChar(cubeState.F[row][col])
    }
  }
  
  // D面 (下，黄色) - D1-D9
  // 根据坐标映射，D面 row=1-z，col=x+1
  // Kociemba的D1-D9是从上到下、从左到右
  // 标准顺序：row=0到2, col=0到2
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cubestring += colorToKociembaChar(cubeState.D[row][col])
    }
  }
  
  // L面 (左，绿色) - L1-L9
  // 根据坐标映射，L面 row=1-y，col=z+1
  // Kociemba的L1-L9是从上到下、从左到右
  // 从左往右看L面：左应该是B方向（col=0），右应该是F方向（col=2）
  // 标准顺序：row=0到2, col=0到2
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cubestring += colorToKociembaChar(cubeState.L[row][col])
    }
  }
  
  // B面 (后，橙色) - B1-B9
  // 根据坐标映射，B面 row=1-y，col=1-x（镜像）
  // Kociemba的B1-B9是从上到下、从左到右
  // 使用标准顺序：row=0到2, col=0到2
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cubestring += colorToKociembaChar(cubeState.B[row][col])
    }
  }
  
  return cubestring
}

// Kociemba 算法的颜色映射
// 根据我们的 CubeState 定义：
// U=白(white), R=蓝(blue), F=红(red), D=黄(yellow), L=绿(green), B=橙(orange)
// Kociemba 标准格式：URFDLB，所以：
// white -> U, blue -> R, red -> F, yellow -> D, green -> L, orange -> B
function colorToKociembaChar(color: string): string {
  const colorMap: Record<string, string> = {
    'white': 'U',   // 上 -> U
    'blue': 'R',    // 右 -> R
    'red': 'F',     // 前 -> F
    'yellow': 'D',  // 下 -> D
    'green': 'L',   // 左 -> L
    'orange': 'B',  // 后 -> B
  }
  return colorMap[color] || 'U'
}


// 将 Kociemba 算法返回的字符串转换为 Move[] 数组
// Kociemba 返回格式: "R U R' U' R2 F' B D2" 等
export function kociembaStringToMoves(solutionString: string): Move[] {
  const moves: Move[] = []
  const moveStrings = solutionString.trim().split(/\s+/).filter(s => s.length > 0)
  
  console.log('Kociemba 原始字符串:', solutionString)
  console.log('分割后的移动字符串:', moveStrings)
  
  for (const moveStr of moveStrings) {
    // Kociemba 格式: R, R', R2, U, U', U2, etc.
    // 匹配模式：
    // - R, L, U, D, F, B (简单移动)
    // - R', L', U', D', F', B' (反向移动)
    // - R2, L2, U2, D2, F2, B2 (180度旋转)
    
    if (moveStr.match(/^[RLUDFB]$/)) {
      // 简单移动：R, L, U, D, F, B
      moves.push(moveStr as Move)
      console.log(`解析移动: ${moveStr} -> ${moveStr}`)
    } else if (moveStr.match(/^[RLUDFB]'$/)) {
      // 反向移动：R', L', etc.
      moves.push(moveStr as Move)
      console.log(`解析移动: ${moveStr} -> ${moveStr}`)
    } else if (moveStr.match(/^[RLUDFB]2$/)) {
      // 180度旋转：R2, L2, etc.
      moves.push(moveStr as Move)
      console.log(`解析移动: ${moveStr} -> ${moveStr}`)
    } else {
      console.warn(`无法解析的移动格式: "${moveStr}"`)
    }
  }
  
  console.log('最终解析的移动序列:', moves)
  return moves
}

// 使用 Kociemba 算法求解魔方
// movesToState 参数保留以保持 API 兼容性，但不再使用（Kociemba 直接从 cubestring 求解）
export async function solveCube(cubieBasedState: CubieBasedCubeState, _movesToState?: Move[]): Promise<Move[]> {
  try {
    // 检查当前状态是否已经是已解决状态
    const solvedState = createSolvedCubieBasedCube()
    const cubeState = cubieBasedStateToFaceColors(cubieBasedState)
    const solvedCubeState = cubieBasedStateToFaceColors(solvedState)
    
    if (JSON.stringify(cubeState) === JSON.stringify(solvedCubeState)) {
      console.log('魔方已经解决，无需求解')
      return []
    }
    
    // 将 CubeState 转换为 Kociemba 算法需要的 cubestring 格式
    const cubestring = cubeStateToCubestring(cubeState)
    console.log('Kociemba 输入 cubestring:', cubestring)
    console.log('cubestring 长度:', cubestring.length)
    
    // 验证已解决状态的 cubestring
    const solvedCubestring = cubeStateToCubestring(solvedCubeState)
    console.log('已解决状态的 cubestring:', solvedCubestring)
    console.log('期望的已解决状态: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB')
    
    // 打印每个面的详细信息
    console.log('当前状态各面:')
    console.log('U面:', cubeState.U.flat().map(c => colorToKociembaChar(c)).join(''))
    console.log('R面:', cubeState.R.flat().map(c => colorToKociembaChar(c)).join(''))
    console.log('F面:', cubeState.F.flat().map(c => colorToKociembaChar(c)).join(''))
    console.log('D面:', cubeState.D.flat().map(c => colorToKociembaChar(c)).join(''))
    console.log('L面:', cubeState.L.flat().map(c => colorToKociembaChar(c)).join(''))
    console.log('B面:', cubeState.B.flat().map(c => colorToKociembaChar(c)).join(''))
    
    // 输出用于 Python 测试的命令
    console.log('\n' + '='.repeat(60))
    console.log('Python 测试命令:')
    console.log(`python test_cubestring.py ${cubestring}`)
    console.log('='.repeat(60))
    
    // 验证 cubestring 长度
    if (cubestring.length !== 54) {
      throw new Error(`cubestring 长度不正确: ${cubestring.length}，应该是 54`)
    }
    
    // 使用 Kociemba 算法求解
    // kociemba-wasm 支持 cubestring 格式（54 字符）
    const solutionString = await kociembaWasmSolve(cubestring)
    console.log('Kociemba 求解结果（原始字符串）:', solutionString)
    
    // 将求解结果转换为 Move[] 数组
    const moves = kociembaStringToMoves(solutionString)
    console.log('转换后的移动序列:', moves)
    console.log('移动序列长度:', moves.length)
    
    // 验证：如果移动序列为空，可能是解析问题
    if (moves.length === 0 && solutionString.trim().length > 0) {
      console.error('警告：Kociemba 返回了非空字符串，但解析后移动序列为空！')
      console.error('原始字符串:', JSON.stringify(solutionString))
    }
    
    return moves
  } catch (error) {
    console.error('求解失败:', error)
    throw error
  }
}
