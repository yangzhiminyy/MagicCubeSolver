# Cubie 自转逻辑文档

本文档详细说明当前实现的cubie自转逻辑，用于检查和调试。

## 1. 颜色旋转函数

### 1.1 绕x轴旋转（R/L面）

```typescript
function rotateColorsAroundXAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 顺时针：U->F->D->B->U
    // 新U面显示旧B面的颜色，新F面显示旧U面的颜色，新D面显示旧F面的颜色，新B面显示旧D面的颜色
    return {
      U: colors.B,  // U面显示B面的颜色
      D: colors.F,  // D面显示F面的颜色
      F: colors.U,  // F面显示U面的颜色
      B: colors.D,  // B面显示D面的颜色
      L: colors.L,  // L面不变
      R: colors.R,  // R面不变
    }
  } else {
    // 逆时针：U->B->D->F->U
    return {
      U: colors.F,  // U面显示F面的颜色
      D: colors.B,  // D面显示B面的颜色
      F: colors.D,  // F面显示D面的颜色
      B: colors.U,  // B面显示U面的颜色
      L: colors.L,  // L面不变
      R: colors.R,  // R面不变
    }
  }
}
```

**说明**：
- 从+x方向看（从R面看），顺时针旋转时：U面 -> F面 -> D面 -> B面 -> U面
- 这意味着：原来U面的颜色会移到F面，原来F面的颜色会移到D面，等等

### 1.2 绕y轴旋转（U/D面）

```typescript
function rotateColorsAroundYAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 从上面看顺时针：F->L->B->R->F
    return {
      U: colors.U,  // U面不变
      D: colors.D,  // D面不变
      F: colors.L,  // F面显示L面的颜色
      B: colors.R,  // B面显示R面的颜色
      L: colors.B,  // L面显示B面的颜色
      R: colors.F,  // R面显示F面的颜色
    }
  } else {
    // 从上面看逆时针：F->R->B->L->F
    return {
      U: colors.U,  // U面不变
      D: colors.D,  // D面不变
      F: colors.R,  // F面显示R面的颜色
      B: colors.L,  // B面显示L面的颜色
      L: colors.F,  // L面显示F面的颜色
      R: colors.B,  // R面显示B面的颜色
    }
  }
}
```

### 1.3 绕z轴旋转（F/B面）

```typescript
function rotateColorsAroundZAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    // 从前面看顺时针：U->L->D->R->U
    return {
      U: colors.L,  // U面显示L面的颜色
      D: colors.R,  // D面显示R面的颜色
      F: colors.F,  // F面不变
      B: colors.B,  // B面不变
      L: colors.D,  // L面显示D面的颜色
      R: colors.U,  // R面显示U面的颜色
    }
  } else {
    // 从前面看逆时针：U->R->D->L->U
    return {
      U: colors.R,  // U面显示R面的颜色
      D: colors.L,  // D面显示L面的颜色
      F: colors.F,  // F面不变
      B: colors.B,  // B面不变
      L: colors.U,  // L面显示U面的颜色
      R: colors.D,  // R面显示D面的颜色
    }
  }
}
```

## 2. 位置循环函数

### 2.1 cycleCorners（角块循环）

```typescript
function cycleCorners(
  state: CubieBasedCubeState,
  cycle: readonly CornerCubieId[],
  clockwise: boolean = true
): void {
  // 找到每个位置上的cubie id
  const cubieIds: CornerCubieId[] = cycle.map(pos => findCornerByPosition(state, pos))

  // 移动位置
  for (let i = 0; i < cycle.length; i++) {
    const nextIndex = clockwise ? (i + 1) % cycle.length : (i - 1 + cycle.length) % cycle.length
    const cubieId = cubieIds[i]
    const nextPosition = cycle[nextIndex]
    
    // 更新位置
    state.corners[cubieId].position = nextPosition
  }
}
```

**逻辑说明**：
- `clockwise=true`: 位置i的cubie移动到位置(i+1)
- `clockwise=false`: 位置i的cubie移动到位置(i-1)

**示例**：
- 循环：`['UFR', 'DFR', 'DBR', 'UBR']`，`clockwise=true`
- i=0: UFR位置的cubie -> DFR位置
- i=1: DFR位置的cubie -> DBR位置
- i=2: DBR位置的cubie -> UBR位置
- i=3: UBR位置的cubie -> UFR位置

### 2.2 cycleEdges（边块循环）

```typescript
function cycleEdges(
  state: CubieBasedCubeState,
  cycle: readonly EdgeCubieId[],
  clockwise: boolean = true
): void {
  // 找到每个位置上的cubie id
  const cubieIds: EdgeCubieId[] = cycle.map(pos => findEdgeByPosition(state, pos))

  // 移动位置
  for (let i = 0; i < cycle.length; i++) {
    const nextIndex = clockwise ? (i + 1) % cycle.length : (i - 1 + cycle.length) % cycle.length
    const cubieId = cubieIds[i]
    const nextPosition = cycle[nextIndex]
    
    // 更新位置
    state.edges[cubieId].position = nextPosition
  }
}
```

## 3. R面旋转实现

### 3.1 rotateR（R面顺时针）

```typescript
export function rotateR(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 根据旧代码：U的右列 → F的右列 → D的右列 → B的左列 → U的右列
  // 这意味着：UFR位置 -> DFR位置 -> DBR位置 -> UBR位置 -> UFR位置
  // 第一步：替换位置（顺时针循环）
  const cornerCycle: CornerCubieId[] = ['UFR', 'DFR', 'DBR', 'UBR']
  const edgeCycle: EdgeCubieId[] = ['UR', 'FR', 'DR', 'BR']
  
  cycleCorners(newState, cornerCycle, true)
  cycleEdges(newState, edgeCycle, true)
  
  // 第二步：旋转颜色（绕x轴顺时针90度）
  // 找到旋转后的cubie ID（位置已经改变）
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  // 注意：当前使用false（逆时针颜色旋转）
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundXAxis, false)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundXAxis, false)
  }
  
  return newState
}
```

**当前实现**：
- 位置循环：`['UFR', 'DFR', 'DBR', 'UBR']`，`clockwise=true`
- 颜色旋转：`rotateColorsAroundXAxis`，`clockwise=false`（逆时针）

**问题分析**：
- 如果旋转方向是逆时针，可能需要将位置循环改为`clockwise=false`
- 如果颜色变成黑色，可能是颜色旋转方向不对

### 3.2 rotateRPrime（R'面逆时针）

```typescript
export function rotateRPrime(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 第一步：替换位置（逆时针循环）
  const cornerCycle: CornerCubieId[] = ['UFR', 'DFR', 'DBR', 'UBR']
  const edgeCycle: EdgeCubieId[] = ['UR', 'FR', 'DR', 'BR']
  
  cycleCorners(newState, cornerCycle, false)
  cycleEdges(newState, edgeCycle, false)
  
  // 第二步：旋转颜色（绕x轴逆时针90度）
  const rotatedCornerIds = cornerCycle.map(pos => findCornerByPosition(newState, pos))
  const rotatedEdgeIds = edgeCycle.map(pos => findEdgeByPosition(newState, pos))
  
  for (const cornerId of rotatedCornerIds) {
    rotateCornerColors(newState, cornerId, rotateColorsAroundXAxis, true)
  }
  for (const edgeId of rotatedEdgeIds) {
    rotateEdgeColors(newState, edgeId, rotateColorsAroundXAxis, true)
  }
  
  return newState
}
```

## 4. 颜色映射函数

### 4.1 getCornerFaceColors（角块颜色映射）

```typescript
function getCornerFaceColors(corner: CornerCubie, position: CornerCubieId): Partial<Record<Face, FaceColor>> {
  // 获取position对应的面（按照固定顺序）
  const positionFaces = getCornerFaceOrder(position)
  
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 简化版本：直接从colors读取对应面的颜色
  for (const face of positionFaces) {
    const color = corner.colors[face]
    // 只返回非黑色的颜色（黑色是不可见的面）
    if (color && color !== 'black') {
      result[face] = color
    }
  }

  return result
}
```

**说明**：
- 直接从`corner.colors[face]`读取颜色
- 只返回非黑色的颜色（黑色是不可见的面）

### 4.2 getEdgeFaceColors（边块颜色映射）

```typescript
function getEdgeFaceColors(edge: EdgeCubie, position: EdgeCubieId): Partial<Record<Face, FaceColor>> {
  // 获取position对应的面
  const positionFaces: Face[] = []
  if (position.includes('U')) positionFaces.push('U')
  if (position.includes('D')) positionFaces.push('D')
  if (position.includes('F')) positionFaces.push('F')
  if (position.includes('B')) positionFaces.push('B')
  if (position.includes('L')) positionFaces.push('L')
  if (position.includes('R')) positionFaces.push('R')

  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 简化版本：直接从colors读取对应面的颜色
  for (const face of positionFaces) {
    const color = edge.colors[face]
    // 只返回非黑色的颜色（黑色是不可见的面）
    if (color && color !== 'black') {
      result[face] = color
    }
  }

  return result
}
```

## 5. 当前问题

### 5.1 R面旋转问题

**现象**：
1. R旋转后变成黑色
2. 旋转方向是逆时针（应该是顺时针）

**可能原因**：
1. 位置循环顺序不对
2. 颜色旋转方向不对
3. 颜色旋转函数的方向定义不对

### 5.2 需要检查的点

1. **位置循环顺序**：
   - 当前：`['UFR', 'DFR', 'DBR', 'UBR']`，`clockwise=true`
   - 是否应该改为：`['UBR', 'DBR', 'DFR', 'UFR']` 或 `clockwise=false`？

2. **颜色旋转方向**：
   - 当前：`rotateColorsAroundXAxis`，`clockwise=false`
   - 是否应该改为：`clockwise=true`？

3. **颜色旋转函数**：
   - 当前实现：顺时针时 `U: colors.B, F: colors.U, D: colors.F, B: colors.D`
   - 这个映射是否正确？

## 6. 测试建议

### 6.1 测试UFR角块

初始状态：
- UFR角块：`colors = {U: 'white', F: 'red', R: 'blue', D: 'black', B: 'black', L: 'black'}`

R旋转后（假设移动到DFR位置）：
- 位置：`position = 'DFR'`
- 颜色应该旋转：`{U: colors.F, D: colors.U, F: colors.D, B: colors.B, L: colors.L, R: colors.R}`
- 如果`clockwise=false`：`{U: 'red', D: 'white', F: 'black', B: 'black', L: 'black', R: 'blue'}`
- 在DFR位置，应该显示：D面（白色），F面（红色），R面（蓝色）

### 6.2 检查逻辑

1. 检查位置循环是否正确
2. 检查颜色旋转方向是否正确
3. 检查颜色映射是否正确（是否过滤了黑色）

---

**文档生成时间**：2024年
**代码版本**：refactor/cubie-based-structure分支
**文件**：`src/utils/cubieBasedCubeLogic.ts`
