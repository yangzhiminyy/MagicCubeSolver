# 颜色映射函数详细解释

## 1. 核心概念

### 1.1 问题：为什么需要颜色映射？

在魔方中，每个 cubie 有 6 个面的颜色，但：
- **角块**：只有 3 个面可见（其他 3 个面在魔方内部，用黑色表示）
- **边块**：只有 2 个面可见（其他 4 个面在魔方内部，用黑色表示）
- **中心块**：只有 1 个面可见（其他 5 个面在魔方内部）

**关键问题**：当 cubie 旋转到不同位置时，它的哪些面可见？这些可见面应该显示什么颜色？

### 1.2 解决方案：根据坐标确定可见面

**核心思想**：cubie 的坐标 `[x, y, z]` 决定了哪些面是可见的。

### 1.3 命名约定

**重要**：为了避免混淆，我们使用不同的命名：
- **魔方的固定面**：`U, D, R, L, F, B`（Upper, Down, Right, Left, Front, Back）
- **Cubie 的实时方位**：`upper, down, right, left, front, back`（小写，表示 cubie 相对于自身的方位）

**区别**：
- `U` 是魔方的上表面（固定不变）
- `upper` 是 cubie 的上表面（会随着 cubie 旋转而改变）

## 2. 坐标与可见面的关系

### 2.1 坐标系统

- **x轴**：-1（左/L面），0（中间），1（右/R面）
- **y轴**：-1（下/D面），0（中间），1（上/U面）
- **z轴**：-1（后/B面），0（中间），1（前/F面）

### 2.2 可见面判断规则

**角块（坐标的每个分量都是 ±1）**：
- 如果 `y === 1`：在魔方的 U 面 → cubie 的 `upper` 面可见 → 显示 `corner.colors.upper`
- 如果 `y === -1`：在魔方的 D 面 → cubie 的 `down` 面可见 → 显示 `corner.colors.down`
- 如果 `z === 1`：在魔方的 F 面 → cubie 的 `front` 面可见 → 显示 `corner.colors.front`
- 如果 `z === -1`：在魔方的 B 面 → cubie 的 `back` 面可见 → 显示 `corner.colors.back`
- 如果 `x === 1`：在魔方的 R 面 → cubie 的 `right` 面可见 → 显示 `corner.colors.right`
- 如果 `x === -1`：在魔方的 L 面 → cubie 的 `left` 面可见 → 显示 `corner.colors.left`

**边块（坐标的一个分量是 0，两个分量是 ±1）**：
- 如果 `y === 1`：在魔方的 U 面 → cubie 的 `upper` 面可见 → 显示 `edge.colors.upper`
- 如果 `y === -1`：在魔方的 D 面 → cubie 的 `down` 面可见 → 显示 `edge.colors.down`
- 如果 `z === 1`：在魔方的 F 面 → cubie 的 `front` 面可见 → 显示 `edge.colors.front`
- 如果 `z === -1`：在魔方的 B 面 → cubie 的 `back` 面可见 → 显示 `edge.colors.back`
- 如果 `x === 1`：在魔方的 R 面 → cubie 的 `right` 面可见 → 显示 `edge.colors.right`
- 如果 `x === -1`：在魔方的 L 面 → cubie 的 `left` 面可见 → 显示 `edge.colors.left`

## 3. 具体示例

### 3.1 示例1：UFR 角块在初始位置

**初始状态**：
- ID: `'UFR'`（固定不变）
- 坐标: `[1, 1, 1]`（上-前-右）
- 颜色: `{upper: 'white', front: 'red', right: 'blue', down: 'black', back: 'black', left: 'black'}`

**颜色映射过程**：
```typescript
function getCornerFaceColors(corner: CornerCubie, coordinate: [number, number, number]) {
  const [x, y, z] = coordinate  // [1, 1, 1]
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // y === 1，在魔方的 U 面，所以 cubie 的 upper 面可见
  if (y === 1) result.U = corner.colors.upper  // result.U = 'white'
  
  // z === 1，在魔方的 F 面，所以 cubie 的 front 面可见
  if (z === 1) result.F = corner.colors.front  // result.F = 'red'
  
  // x === 1，在魔方的 R 面，所以 cubie 的 right 面可见
  if (x === 1) result.R = corner.colors.right  // result.R = 'blue'
  
  // 过滤黑色（不可见的面）
  // down, back, left 都是黑色，不添加到 result 中
  
  return result  // {U: 'white', F: 'red', R: 'blue'}
}
```

**结果**：魔方的 U 面显示白色，F 面显示红色，R 面显示蓝色。

### 3.2 示例2：UFR 角块旋转到 DFR 位置（R旋转后）

**旋转后状态**：
- ID: `'UFR'`（不变）
- 坐标: `[1, -1, 1]`（下-前-右，从 [1, 1, 1] 旋转而来）
- 颜色: 经过颜色旋转后，`{upper: 'red', front: 'blue', right: 'white', down: 'black', back: 'black', left: 'black'}`

**颜色映射过程**：
```typescript
const [x, y, z] = [1, -1, 1]

// y === -1，在魔方的 D 面，所以 cubie 的 down 面可见
if (y === -1) result.D = corner.colors.down  // 但是 colors.down 是 'black'，不添加

// z === 1，在魔方的 F 面，所以 cubie 的 front 面可见
if (z === 1) result.F = corner.colors.front  // result.F = 'blue'

// x === 1，在魔方的 R 面，所以 cubie 的 right 面可见
if (x === 1) result.R = corner.colors.right  // result.R = 'white'

// 过滤黑色后
return result  // {F: 'blue', R: 'white'}
```

**问题**：这里有问题！DFR 位置应该显示 D 面的颜色，但 `colors.D` 是黑色。

**原因**：颜色旋转后，原来 U 面的颜色（白色）现在在 F 面，原来 F 面的颜色（红色）现在在 D 面。

**正确的理解**：
- 在 DFR 位置（坐标 [1, -1, 1]），魔方的 D 面可见，应该显示 `corner.colors.down`
- 但是，由于颜色旋转，`corner.colors.down` 现在存储的是原来 front 面的颜色（红色）
- 所以魔方的 D 面应该显示红色

**等等，让我重新理解**：

实际上，颜色旋转后：
- 原来 U 面的颜色（白色）→ 现在在 F 面位置
- 原来 F 面的颜色（红色）→ 现在在 D 面位置
- 原来 R 面的颜色（蓝色）→ 现在在 U 面位置

所以在 DFR 位置：
- D 面可见，应该显示 `corner.colors.D`，而 `corner.colors.D` 现在是红色（原来 F 面的颜色）✓
- F 面可见，应该显示 `corner.colors.F`，而 `corner.colors.F` 现在是白色（原来 U 面的颜色）✓
- R 面可见，应该显示 `corner.colors.R`，而 `corner.colors.R` 现在是蓝色（原来 R 面的颜色）✓

**但是**，如果 `corner.colors.D` 是黑色，说明颜色旋转逻辑有问题。

让我重新检查颜色旋转逻辑...

## 4. 颜色映射函数的完整实现

### 4.1 角块颜色映射

```typescript
function getCornerFaceColors(
  corner: CornerCubie, 
  coordinate: [number, number, number]
): Partial<Record<Face, FaceColor>> {
  const [x, y, z] = coordinate
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 根据坐标确定哪些面可见，然后从 corner.colors 中读取对应面的颜色
  // 注意：坐标对应魔方的面（U/D/F/B/L/R），colors 对应 cubie 的实时方位（upper/down/front/back/left/right）
  if (y === 1) {
    // 在魔方的 U 面，cubie 的 upper 面可见
    const color = corner.colors.upper
    if (color && color !== 'black') {
      result.U = color
    }
  }
  
  if (y === -1) {
    // 在魔方的 D 面，cubie 的 down 面可见
    const color = corner.colors.down
    if (color && color !== 'black') {
      result.D = color
    }
  }
  
  if (z === 1) {
    // 在魔方的 F 面，cubie 的 front 面可见
    const color = corner.colors.front
    if (color && color !== 'black') {
      result.F = color
    }
  }
  
  if (z === -1) {
    // 在魔方的 B 面，cubie 的 back 面可见
    const color = corner.colors.back
    if (color && color !== 'black') {
      result.B = color
    }
  }
  
  if (x === 1) {
    // 在魔方的 R 面，cubie 的 right 面可见
    const color = corner.colors.right
    if (color && color !== 'black') {
      result.R = color
    }
  }
  
  if (x === -1) {
    // 在魔方的 L 面，cubie 的 left 面可见
    const color = corner.colors.left
    if (color && color !== 'black') {
      result.L = color
    }
  }
  
  return result
}
```

### 4.2 边块颜色映射

```typescript
function getEdgeFaceColors(
  edge: EdgeCubie, 
  coordinate: [number, number, number]
): Partial<Record<Face, FaceColor>> {
  const [x, y, z] = coordinate
  const result: Partial<Record<Face, FaceColor>> = {}
  
  // 同样的逻辑：根据坐标确定可见面
  if (y === 1) {
    const color = edge.colors.upper
    if (color && color !== 'black') result.U = color
  }
  
  if (y === -1) {
    const color = edge.colors.down
    if (color && color !== 'black') result.D = color
  }
  
  if (z === 1) {
    const color = edge.colors.front
    if (color && color !== 'black') result.F = color
  }
  
  if (z === -1) {
    const color = edge.colors.back
    if (color && color !== 'black') result.B = color
  }
  
  if (x === 1) {
    const color = edge.colors.right
    if (color && color !== 'black') result.R = color
  }
  
  if (x === -1) {
    const color = edge.colors.left
    if (color && color !== 'black') result.L = color
  }
  
  return result
}
```

## 5. 完整流程示例

### 5.1 UFR 角块在初始位置

**步骤1：初始化**
```typescript
UFR: {
  id: 'UFR',
  coordinate: [1, 1, 1],
  colors: {
    U: 'white',   // 上表面颜色
    F: 'red',     // 前表面颜色
    R: 'blue',    // 右表面颜色
    D: 'black',   // 下表面（不可见）
    B: 'black',   // 后表面（不可见）
    L: 'black',   // 左表面（不可见）
  }
}
```

**步骤2：颜色映射**
```typescript
const [x, y, z] = [1, 1, 1]

// y === 1 → 在魔方的 U 面 → cubie 的 upper 面可见 → 显示 corner.colors.upper = 'white'
result.U = 'white'

// z === 1 → 在魔方的 F 面 → cubie 的 front 面可见 → 显示 corner.colors.front = 'red'
result.F = 'red'

// x === 1 → 在魔方的 R 面 → cubie 的 right 面可见 → 显示 corner.colors.right = 'blue'
result.R = 'blue'

// 返回 {U: 'white', F: 'red', R: 'blue'}
```

**步骤3：渲染**
- 在坐标 `[1, 1, 1]` 位置渲染一个 cubie
- U面（上面）显示白色
- F面（前面）显示红色
- R面（右面）显示蓝色

### 5.2 UFR 角块旋转到 DFR 位置（R旋转后）

**步骤1：坐标变换**
```typescript
// R旋转：绕x轴顺时针90度
// 坐标变换：(x, y, z) -> (x, z, -y)
[1, 1, 1] -> [1, 1, -1]  // 等等，这不对

// 让我重新计算：
// UFR [1, 1, 1] 旋转后应该到 DFR [1, -1, 1] 吗？
// 不对，R旋转时，UFR应该到 UBR位置 [1, 1, -1]

// 实际上，R旋转的坐标变换应该是：
// (x, y, z) -> (x, z, -y)
[1, 1, 1] -> [1, 1, -1]  // UFR -> UBR

// 但是根据旧代码，UFR -> DFR，所以坐标变换可能是：
// (x, y, z) -> (x, -z, y)
[1, 1, 1] -> [1, -1, 1]  // UFR -> DFR
```

**步骤2：颜色旋转**
```typescript
// 绕x轴顺时针90度
// U = F的颜色, F = D的颜色, D = B的颜色, B = U的颜色

// 旋转前：{U: 'white', F: 'red', R: 'blue', D: 'black', B: 'black', L: 'black'}
// 旋转后：{U: 'red', F: 'black', R: 'blue', D: 'black', B: 'white', L: 'black'}

// 等等，这也不对。让我重新理解颜色旋转...

// 如果 U = F的颜色，意思是：
// 新U面显示原来F面的颜色 = 'red'
// 新F面显示原来D面的颜色 = 'black'
// 新D面显示原来B面的颜色 = 'black'
// 新B面显示原来U面的颜色 = 'white'

// 所以旋转后：{U: 'red', F: 'black', D: 'black', B: 'white', R: 'blue', L: 'black'}
```

**步骤3：颜色映射**
```typescript
// 现在坐标是 [1, -1, 1]（DFR位置）
const [x, y, z] = [1, -1, 1]

// y === -1 → D面可见 → 显示 corner.colors.D = 'black'（不添加）
// z === 1 → F面可见 → 显示 corner.colors.F = 'black'（不添加）
// x === 1 → R面可见 → 显示 corner.colors.R = 'blue'

// 返回 {R: 'blue'}
```

**问题**：这样只显示了 R 面的颜色，D 面和 F 面都是黑色，不对！

**原因分析**：颜色旋转逻辑可能有问题，或者我对颜色旋转的理解不对。

## 6. 正确的理解

### 6.1 颜色旋转的含义

当 cubie 绕 x 轴顺时针旋转 90 度时：
- **U 面转到 F 面位置**：所以新 F 面应该显示原来 U 面的颜色
- **F 面转到 D 面位置**：所以新 D 面应该显示原来 F 面的颜色
- **D 面转到 B 面位置**：所以新 B 面应该显示原来 D 面的颜色
- **B 面转到 U 面位置**：所以新 U 面应该显示原来 B 面的颜色

**所以颜色旋转函数应该是**：
```typescript
// 顺时针：upper->front->down->back->upper
return {
  upper: colors.back,   // 新 upper 面 = 原来 back 面的颜色
  front: colors.upper,  // 新 front 面 = 原来 upper 面的颜色
  down: colors.front,   // 新 down 面 = 原来 front 面的颜色
  back: colors.down,    // 新 back 面 = 原来 down 面的颜色
  left: colors.left,    // left 不变
  right: colors.right,   // right 不变
}
```

### 6.2 颜色映射的含义

颜色映射函数的作用是：**根据 cubie 的当前坐标，确定哪些面可见，然后从 cubie.colors 中读取对应面的颜色**。

**关键点**：
- 坐标决定了哪些面可见（y=1 → U面可见，y=-1 → D面可见，等等）
- `corner.colors.U` 存储的是"当 U 面可见时应该显示的颜色"
- 当 cubie 旋转后，`corner.colors` 也会旋转，所以 `corner.colors.U` 可能存储的是原来其他面的颜色

## 7. 总结

**颜色映射函数的逻辑**：
1. 输入：cubie 和它的坐标
2. 根据坐标判断哪些面可见（y=1 → U面，y=-1 → D面，等等）
3. 从 `cubie.colors` 中读取对应面的颜色
4. 过滤黑色（不可见的面）
5. 返回可见面的颜色映射

**关键理解**：
- 坐标决定可见面（坐标对应魔方的固定面 U/D/F/B/L/R）
- `cubie.colors` 存储的是 cubie 的实时方位颜色（upper/down/front/back/left/right）
- 当 cubie 旋转时，坐标和 colors 都会更新，但映射逻辑不变
- **命名区分**：魔方的面用大写 `U/D/F/B/L/R`，cubie 的方位用小写 `upper/down/front/back/left/right`

---

**文档生成时间**：2024年
**相关文件**：`src/utils/cubieBasedCubeLogic.ts`
