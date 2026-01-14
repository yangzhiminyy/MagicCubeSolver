# 新的 Cubie 数据结构设计文档

## 1. 设计理念

### 1.1 核心概念

- **ID 和位置分离**：每个 cubie 的 ID 是固定的，不会改变（如 UFR 的 id 永远是 'UFR'）
- **位置用坐标表示**：每个 cubie 有一个坐标 `(x, y, z)`，可以取 -1, 0, 1 三个值
- **颜色固定**：每个 cubie 的 6 个面颜色是确定的，不会改变
- **方位用坐标表示**：cubie 的方位由其坐标决定

### 1.2 优势

1. **逻辑清晰**：ID 不变，位置用坐标表示，更容易理解
2. **旋转简单**：旋转时只需要找出特定坐标的 cubie，然后变换坐标和自身翻转
3. **易于调试**：可以通过 ID 追踪每个 cubie 的位置变化

## 2. 数据结构

### 2.1 角块（CornerCubie）

```typescript
interface CornerCubie {
  id: CornerCubieId  // 固定ID，永远不变，如 'UFR'
  coordinate: [number, number, number]  // 坐标 [x, y, z]，取值 -1, 0, 1
  colors: CubieColors  // 6个面的颜色（固定，不变）
}
```

**注意**：`CubieColors` 使用 `upper, down, right, left, front, back` 表示实时方位，以区分初始的 `UDRLFB`。

**初始状态**：
- UFR: `id='UFR', coordinate=[1, 1, 1], colors={upper: 'white', front: 'red', right: 'blue', down: 'black', back: 'black', left: 'black'}`
- UFL: `id='UFL', coordinate=[-1, 1, 1], colors={upper: 'white', front: 'red', left: 'green', down: 'black', back: 'black', right: 'black'}`
- ... 等等

### 2.2 边块（EdgeCubie）

```typescript
interface EdgeCubie {
  id: EdgeCubieId  // 固定ID，永远不变，如 'UR'
  coordinate: [number, number, number]  // 坐标 [x, y, z]，取值 -1, 0, 1
  colors: CubieColors  // 6个面的颜色（固定，不变）
}
```

**初始状态**：
- UR: `id='UR', coordinate=[1, 1, 0], colors={upper: 'white', right: 'blue', front: 'black', back: 'black', down: 'black', left: 'black'}`
- UF: `id='UF', coordinate=[0, 1, 1], colors={upper: 'white', front: 'red', right: 'black', left: 'black', down: 'black', back: 'black'}`
- ... 等等

### 2.3 中心块（FaceCubie）

```typescript
interface FaceCubie {
  id: FaceCubieId  // 固定ID，永远不变，如 'U'
  coordinate: [number, number, number]  // 坐标 [x, y, z]，固定不变
  color: FaceColor  // 颜色（固定，不变）
}
```

**初始状态**：
- U: `id='U', coordinate=[0, 1, 0], color='white'`（中心块坐标固定）
- D: `id='D', coordinate=[0, -1, 0], color='yellow'`
- F: `id='F', coordinate=[0, 0, 1], color='red'`
- B: `id='B', coordinate=[0, 0, -1], color='orange'`
- L: `id='L', coordinate=[-1, 0, 0], color='green'`
- R: `id='R', coordinate=[1, 0, 0], color='blue'`

## 3. 坐标系统

### 3.1 坐标定义

- **x轴**：-1（左/L面），0（中间），1（右/R面）
- **y轴**：-1（下/D面），0（中间），1（上/U面）
- **z轴**：-1（后/B面），0（中间），1（前/F面）

### 3.2 角块坐标

- UFR: `[1, 1, 1]` - 上-前-右
- UFL: `[-1, 1, 1]` - 上-前-左
- UBL: `[-1, 1, -1]` - 上-后-左
- UBR: `[1, 1, -1]` - 上-后-右
- DFR: `[1, -1, 1]` - 下-前-右
- DFL: `[-1, -1, 1]` - 下-前-左
- DBL: `[-1, -1, -1]` - 下-后-左
- DBR: `[1, -1, -1]` - 下-后-右

### 3.3 边块坐标

- UF: `[0, 1, 1]` - 上-前
- UR: `[1, 1, 0]` - 上-右
- UB: `[0, 1, -1]` - 上-后
- UL: `[-1, 1, 0]` - 上-左
- DF: `[0, -1, 1]` - 下-前
- DR: `[1, -1, 0]` - 下-右
- DB: `[0, -1, -1]` - 下-后
- DL: `[-1, -1, 0]` - 下-左
- FR: `[1, 0, 1]` - 前-右
- FL: `[-1, 0, 1]` - 前-左
- BR: `[1, 0, -1]` - 后-右
- BL: `[-1, 0, -1]` - 后-左

### 3.4 中心块坐标

- U: `[0, 1, 0]`
- D: `[0, -1, 0]`
- F: `[0, 0, 1]`
- B: `[0, 0, -1]`
- L: `[-1, 0, 0]`
- R: `[1, 0, 0]`

## 4. 旋转逻辑

### 4.1 R面旋转（x=1的所有cubie）

**步骤**：
1. 找出所有 `coordinate[0] === 1` 的 cubie（R面的所有cubie）
2. 对这些 cubie 进行：
   - **位置变换**：绕x轴旋转坐标
   - **自身翻转**：旋转cubie的颜色

**坐标变换**（绕x轴顺时针90度）：
```
(x, y, z) -> (x, z, -y)
```

**示例**：
- UFR `[1, 1, 1]` -> `[1, 1, -1]` (UBR位置)
- UBR `[1, 1, -1]` -> `[1, -1, -1]` (DBR位置)
- DBR `[1, -1, -1]` -> `[1, -1, 1]` (DFR位置)
- DFR `[1, -1, 1]` -> `[1, 1, 1]` (UFR位置)

**颜色旋转**（绕x轴顺时针90度）：
```
upper = front的颜色
front = down的颜色
down = back的颜色
back = upper的颜色
left和right不变
```

### 4.2 L面旋转（x=-1的所有cubie）

**坐标变换**（绕x轴逆时针90度）：
```
(x, y, z) -> (x, -z, y)
```

### 4.3 U面旋转（y=1的所有cubie）

**坐标变换**（绕y轴逆时针90度）：
```
(x, y, z) -> (-z, y, x)
```

**颜色旋转**（绕y轴逆时针90度）：
```
front = right的颜色
right = back的颜色
back = left的颜色
left = front的颜色
upper和down不变
```

### 4.4 D面旋转（y=-1的所有cubie）

**坐标变换**（绕y轴顺时针90度）：
```
(x, y, z) -> (z, y, -x)
```

### 4.5 F面旋转（z=1的所有cubie）

**坐标变换**（绕z轴顺时针90度）：
```
(x, y, z) -> (-y, x, z)
```

**颜色旋转**（绕z轴顺时针90度）：
```
upper = left的颜色
left = down的颜色
down = right的颜色
right = upper的颜色
front和back不变
```

### 4.6 B面旋转（z=-1的所有cubie）

**坐标变换**（绕z轴逆时针90度）：
```
(x, y, z) -> (y, -x, z)
```

## 5. 实现步骤

### 5.1 修改数据结构

1. 将 `position` 字段改为 `coordinate: [number, number, number]`
2. 移除 `position` 字段
3. 保持 `id` 字段不变

### 5.2 修改初始化函数

```typescript
export function createSolvedCubieBasedCube(): CubieBasedCubeState {
  const corners: Record<CornerCubieId, CornerCubie> = {
    UFR: {
      id: 'UFR',
      coordinate: [1, 1, 1],  // 使用坐标而不是position
      colors: createCornerColors(FACE_COLORS.U, null, FACE_COLORS.F, null, null, FACE_COLORS.R),
      // upper='white', front='red', right='blue', 其他为'black'
    },
    // ... 其他角块
  }
  
  // ... 边块和中心块类似
}
```

### 5.3 修改旋转函数

```typescript
export function rotateR(state: CubieBasedCubeState): CubieBasedCubeState {
  const newState = cloneCubieBasedState(state)
  
  // 找出所有 x=1 的 cubie
  const affectedCorners = Object.values(newState.corners).filter(
    corner => corner.coordinate[0] === 1
  )
  const affectedEdges = Object.values(newState.edges).filter(
    edge => edge.coordinate[0] === 1
  )
  
  // 对每个cubie进行坐标变换和颜色旋转
  for (const corner of affectedCorners) {
    // 坐标变换：绕x轴顺时针90度 (x, y, z) -> (x, z, -y)
    const [x, y, z] = corner.coordinate
    corner.coordinate = [x, z, -y]
    
    // 颜色旋转：绕x轴顺时针90度
    // upper = front的颜色, front = down的颜色, down = back的颜色, back = upper的颜色
    corner.colors = rotateColorsAroundXAxis(corner.colors, true)
  }
  
  for (const edge of affectedEdges) {
    // 坐标变换
    const [x, y, z] = edge.coordinate
    edge.coordinate = [x, z, -y]
    
    // 颜色旋转
    edge.colors = rotateColorsAroundXAxis(edge.colors, true)
  }
  
  return newState
}
```

### 5.4 修改查找函数

```typescript
// 根据坐标查找cubie
function findCornerByCoordinate(
  state: CubieBasedCubeState,
  coordinate: [number, number, number]
): CornerCubie | null {
  for (const corner of Object.values(state.corners)) {
    if (corner.coordinate[0] === coordinate[0] &&
        corner.coordinate[1] === coordinate[1] &&
        corner.coordinate[2] === coordinate[2]) {
      return corner
    }
  }
  return null
}
```

### 5.5 修改颜色映射函数

```typescript
function getCornerFaceColors(corner: CornerCubie, coordinate: [number, number, number]): Partial<Record<Face, FaceColor>> {
  // 根据坐标确定哪些面可见
  // 注意：坐标对应的是魔方的面（U/D/F/B/L/R），而 corner.colors 存储的是 cubie 的实时方位（upper/down/front/back/left/right）
  const [x, y, z] = coordinate
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // y=1 表示在魔方的上表面（U面），此时 cubie 的 upper 面可见
  if (y === 1) result.U = corner.colors.upper
  // y=-1 表示在魔方的下表面（D面），此时 cubie 的 down 面可见
  if (y === -1) result.D = corner.colors.down
  // z=1 表示在魔方的前表面（F面），此时 cubie 的 front 面可见
  if (z === 1) result.F = corner.colors.front
  // z=-1 表示在魔方的后表面（B面），此时 cubie 的 back 面可见
  if (z === -1) result.B = corner.colors.back
  // x=1 表示在魔方的右表面（R面），此时 cubie 的 right 面可见
  if (x === 1) result.R = corner.colors.right
  // x=-1 表示在魔方的左表面（L面），此时 cubie 的 left 面可见
  if (x === -1) result.L = corner.colors.left
  
  // 过滤黑色（不可见的面）
  Object.keys(result).forEach(face => {
    if (result[face as Face] === 'black') {
      delete result[face as Face]
    }
  })
  
  return result
}
```

## 6. 优势总结

1. **逻辑清晰**：ID不变，位置用坐标表示，更容易理解
2. **旋转简单**：只需要找出特定坐标的cubie，然后变换坐标和颜色
3. **易于调试**：可以通过ID追踪每个cubie的位置变化
4. **代码简洁**：不需要复杂的position查找逻辑

## 7. 需要修改的文件

1. `src/utils/cubeTypes.ts` - 修改数据结构定义
2. `src/utils/cubieBasedCubeLogic.ts` - 修改所有相关函数
3. `src/utils/cubeSolver.ts` - 可能需要调整查找逻辑
4. `src/utils/cubeConverter.ts` - 可能需要调整转换逻辑

## 8. 实现顺序

1. 修改数据结构定义（`cubeTypes.ts`）
2. 修改初始化函数（`createSolvedCubieBasedCube`）
3. 修改旋转函数（`rotateR`, `rotateL`, 等）
4. 修改查找和映射函数
5. 测试和调试

---

**文档生成时间**：2024年
**设计理念**：ID固定，位置用坐标表示，颜色固定
