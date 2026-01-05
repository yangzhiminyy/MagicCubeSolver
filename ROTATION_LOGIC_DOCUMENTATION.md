# 魔方旋转逻辑文档

本文档详细说明当前基于Cubie的魔方旋转逻辑实现。

## 1. 核心数据结构

### 1.1 Cubie类型

- **CornerCubie（角块）**: 8个，每个有3个面
  - `id`: 唯一标识（如 'UFR', 'DFL'）
  - `position`: 当前位置
  - `orientation`: 方向（0, 1, 2）
  - `colors`: 初始颜色（不变）

- **EdgeCubie（边块）**: 12个，每个有2个面
  - `id`: 唯一标识（如 'UF', 'UR'）
  - `position`: 当前位置
  - `orientation`: 方向（0, 1）
  - `colors`: 初始颜色（不变）

- **FaceCubie（中心块）**: 6个，每个有1个面
  - `id`: 唯一标识（'U', 'D', 'F', 'B', 'L', 'R'）
  - `position`: 当前位置（固定）
  - `color`: 颜色（不变）

## 2. 旋转函数列表

### 2.1 R面旋转

```typescript
rotateR(state): CubieBasedCubeState
  - 角块循环: ['UBR', 'UFR', 'DFR', 'DBR'], clockwise=true
  - 边块循环: ['BR', 'UR', 'FR', 'DR'], clockwise=true

rotateRPrime(state): CubieBasedCubeState
  - 角块循环: ['UFR', 'DFR', 'DBR', 'UBR'], clockwise=false
  - 边块循环: ['UR', 'FR', 'DR', 'BR'], clockwise=false
```

**注意**: R面旋转的循环顺序已经反转（从标准视角看）。

### 2.2 L面旋转

```typescript
rotateL(state): CubieBasedCubeState
  - 角块循环: ['UFL', 'UBL', 'DBL', 'DFL'], clockwise=true
  - 边块循环: ['UL', 'BL', 'DL', 'FL'], clockwise=true

rotateLPrime(state): CubieBasedCubeState
  - 角块循环: ['UFL', 'UBL', 'DBL', 'DFL'], clockwise=false
  - 边块循环: ['UL', 'BL', 'DL', 'FL'], clockwise=false
```

### 2.3 U面旋转

```typescript
rotateU(state): CubieBasedCubeState
  - 角块循环: ['UFR', 'UBR', 'UBL', 'UFL'], clockwise=true
  - 边块循环: ['UF', 'UR', 'UB', 'UL'], clockwise=true

rotateUPrime(state): CubieBasedCubeState
  - 角块循环: ['UFR', 'UBR', 'UBL', 'UFL'], clockwise=false
  - 边块循环: ['UF', 'UR', 'UB', 'UL'], clockwise=false
```

### 2.4 D面旋转

```typescript
rotateD(state): CubieBasedCubeState
  - 角块循环: ['DFR', 'DFL', 'DBL', 'DBR'], clockwise=true
  - 边块循环: ['DF', 'DL', 'DB', 'DR'], clockwise=true

rotateDPrime(state): CubieBasedCubeState
  - 角块循环: ['DFR', 'DFL', 'DBL', 'DBR'], clockwise=false
  - 边块循环: ['DF', 'DL', 'DB', 'DR'], clockwise=false
```

### 2.5 F面旋转

```typescript
rotateF(state): CubieBasedCubeState
  - 角块循环: ['UFR', 'UFL', 'DFL', 'DFR'], clockwise=true
  - 边块循环: ['UF', 'FL', 'DF', 'FR'], clockwise=true

rotateFPrime(state): CubieBasedCubeState
  - 角块循环: ['UFR', 'UFL', 'DFL', 'DFR'], clockwise=false
  - 边块循环: ['UF', 'FL', 'DF', 'FR'], clockwise=false
```

### 2.6 B面旋转

```typescript
rotateB(state): CubieBasedCubeState
  - 角块循环: ['UBR', 'UBL', 'DBL', 'DBR'], clockwise=true
  - 边块循环: ['UB', 'BR', 'DB', 'BL'], clockwise=true

rotateBPrime(state): CubieBasedCubeState
  - 角块循环: ['UBR', 'UBL', 'DBL', 'DBR'], clockwise=false
  - 边块循环: ['UB', 'BR', 'DB', 'BL'], clockwise=false
```

## 3. 核心旋转逻辑

### 3.1 cycleCorners（角块循环）

```typescript
function cycleCorners(
  state: CubieBasedCubeState,
  cycle: readonly CornerCubieId[],
  clockwise: boolean = true
): void
```

**逻辑**:
1. 找到每个位置上的cubie id
2. 保存每个cubie的当前orientation
3. 移动位置:
   - `clockwise=true`: `nextIndex = (i + 1) % cycle.length`
   - `clockwise=false`: `nextIndex = (i - 1 + cycle.length) % cycle.length`
4. 更新orientation:
   - `clockwise=true`: `orientation = (currentOrientation + 1) % 3`
   - `clockwise=false`: `orientation = (currentOrientation - 1 + 3) % 3`

**示例**:
- 循环: `['UBR', 'UFR', 'DFR', 'DBR']`, `clockwise=true`
- i=0: UBR位置的cubie -> UFR位置, orientation+1
- i=1: UFR位置的cubie -> DFR位置, orientation+1
- i=2: DFR位置的cubie -> DBR位置, orientation+1
- i=3: DBR位置的cubie -> UBR位置, orientation+1

### 3.2 cycleEdges（边块循环）

```typescript
function cycleEdges(
  state: CubieBasedCubeState,
  cycle: readonly EdgeCubieId[],
  clockwise: boolean = true
): void
```

**逻辑**:
1. 找到每个位置上的cubie id
2. 保存每个cubie的当前orientation
3. 移动位置（同角块）
4. 更新orientation: **总是翻转**（0变1，1变0）

**注意**: 边块的orientation更新不依赖于clockwise参数，总是翻转。

## 4. Orientation定义

### 4.1 角块Orientation

**定义**: 表示角块需要顺时针旋转多少次才能让原始面的颜色对应到正确的位置。

- `orientation = 0`: 原始顺序
  - `originalFaces[0] -> positionFaces[0]`
  - `originalFaces[1] -> positionFaces[1]`
  - `originalFaces[2] -> positionFaces[2]`

- `orientation = 1`: 顺时针转一次
  - `originalFaces[0] -> positionFaces[1]`
  - `originalFaces[1] -> positionFaces[2]`
  - `originalFaces[2] -> positionFaces[0]`

- `orientation = 2`: 顺时针转两次
  - `originalFaces[0] -> positionFaces[2]`
  - `originalFaces[1] -> positionFaces[0]`
  - `originalFaces[2] -> positionFaces[1]`

**计算方式**:
```typescript
// 对于 positionFaces[i]，应该显示 originalFaces[(i - orientation + 3) % 3] 的颜色
const sourceIndex = (i - corner.orientation + 3) % 3
```

**验证**:
- 如果 `orientation=1, i=0`:
  - `sourceIndex = (0 - 1 + 3) % 3 = 2`
  - 所以 `originalFaces[0] -> positionFaces[1]` ✓

### 4.2 边块Orientation

**定义**: 表示边块是否翻转。

- `orientation = 0`: 正常方向
  - `originalFaces[0] -> positionFaces[0]`
  - `originalFaces[1] -> positionFaces[1]`

- `orientation = 1`: 翻转方向
  - `originalFaces[0] -> positionFaces[1]`
  - `originalFaces[1] -> positionFaces[0]`

**计算方式**:
```typescript
if (edge.orientation === 0) {
  // 正常方向：按照排序后的顺序映射
  result[sortedPositionFaces[i]] = edge.colors[sortedOriginalFaces[i]]
} else {
  // 翻转方向：交换映射
  result[sortedPositionFaces[i]] = edge.colors[sortedOriginalFaces[(i + 1) % 2]]
}
```

**注意**: 边块的面顺序需要按照 `U/D, F/B, R/L` 的优先级排序。

## 5. 颜色映射逻辑

### 5.1 getCornerFaceColors（角块颜色映射）

```typescript
function getCornerFaceColors(
  corner: CornerCubie,
  position: CornerCubieId
): Partial<Record<Face, FaceColor>>
```

**步骤**:
1. 获取position对应的面顺序（`getCornerFaceOrder(position)`）
   - 按照 `U/D, F/B, R/L` 的优先级排序
2. 获取原始颜色的面顺序（`getCornerFaceOrder(corner.id)`）
3. 根据orientation计算颜色映射:
   ```typescript
   for (let i = 0; i < positionFaces.length; i++) {
     const sourceIndex = (i - corner.orientation + 3) % 3
     result[positionFaces[i]] = corner.colors[originalFaces[sourceIndex]]
   }
   ```

### 5.2 getEdgeFaceColors（边块颜色映射）

```typescript
function getEdgeFaceColors(
  edge: EdgeCubie,
  position: EdgeCubieId
): Partial<Record<Face, FaceColor>>
```

**步骤**:
1. 获取position对应的面（按字母顺序）
2. 获取原始颜色的面（按字母顺序）
3. 按照 `U/D, F/B, R/L` 的优先级排序两个面数组
4. 根据orientation计算颜色映射:
   - `orientation=0`: 直接对应
   - `orientation=1`: 交换对应

## 6. 坐标映射

### 6.1 角块坐标

```typescript
UFR: [1, 1, 1]   // Up-Front-Right
UFL: [-1, 1, 1]  // Up-Front-Left
UBL: [-1, 1, -1] // Up-Back-Left
UBR: [1, 1, -1]  // Up-Back-Right
DFR: [1, -1, 1]  // Down-Front-Right
DFL: [-1, -1, 1] // Down-Front-Left
DBL: [-1, -1, -1] // Down-Back-Left
DBR: [1, -1, -1] // Down-Back-Right
```

### 6.2 边块坐标

```typescript
UF: [0, 1, 1]   // Up-Front
UR: [1, 1, 0]   // Up-Right
UB: [0, 1, -1]  // Up-Back
UL: [-1, 1, 0]  // Up-Left
DF: [0, -1, 1]  // Down-Front
DR: [1, -1, 0]  // Down-Right
DB: [0, -1, -1] // Down-Back
DL: [-1, -1, 0] // Down-Left
FR: [1, 0, 1]   // Front-Right
FL: [-1, 0, 1]  // Front-Left
BR: [1, 0, -1]  // Back-Right
BL: [-1, 0, -1] // Back-Left
```

### 6.3 面坐标映射（从3D坐标到2D数组）

**角块映射**:
- U面: `row = z+1, col = x+1`
- D面: `row = 1-z, col = x+1`
- F面: `row = 1-y, col = x+1`
- B面: `row = 1-y, col = 1-x`
- R面: `row = 1-y, col = 1-z`
- L面: `row = 1-y, col = z+1`

**边块映射**:
- U面: `row = z+1, col = x+1`
- D面: `row = 1-z, col = x+1`
- F面: `row = 1-y, col = x+1`
- B面: `row = 1-y, col = 1-x`
- R面: `row = 1-y, col = 1-z`
- L面: `row = 1-y, col = z+1`

## 7. 已知问题和待修复项

### 7.1 R面旋转问题

**问题描述**:
1. R操作看起来是逆时针旋转而不是顺时针
2. U[2][2]和R[0][0]的颜色是反的
3. U[1][2]和R[0][1]的颜色也是反的

**当前实现**:
- 角块循环: `['UBR', 'UFR', 'DFR', 'DBR']`, `clockwise=true`
- 边块循环: `['BR', 'UR', 'FR', 'DR']`, `clockwise=true`

**可能原因**:
1. 循环顺序可能不正确
2. Orientation的计算方向可能反了
3. 颜色映射的计算可能有问题

### 7.2 需要验证的旋转

- [ ] R面旋转（顺时针和逆时针）
- [ ] L面旋转
- [ ] U面旋转
- [ ] D面旋转
- [ ] F面旋转
- [ ] B面旋转

## 8. 调试建议

### 8.1 验证循环顺序

对于R面旋转，从标准视角（前面看）：
- 顺时针旋转应该是: `UFR -> DFR -> DBR -> UBR -> UFR`
- 但当前实现是: `UBR -> UFR -> DFR -> DBR -> UBR`

### 8.2 验证Orientation计算

测试UFR角块在R面旋转后的状态：
- 初始: `id='UFR', position='UFR', orientation=0, colors={U, F, R}`
- R旋转后: `position='DFR', orientation=1`
- 期望: D面显示U的颜色，F面显示F的颜色，R面显示R的颜色
- 实际: 需要验证

### 8.3 验证颜色映射

检查 `getCornerFaceColors` 函数：
- 对于 `UFR` 角块在 `DFR` 位置，`orientation=1`:
  - `positionFaces = ['D', 'F', 'R']`
  - `originalFaces = ['U', 'F', 'R']`
  - `i=0 (D)`: `sourceIndex = (0-1+3)%3 = 2`, 所以 `D -> R` ❌ 应该是 `D -> U`
  - `i=1 (F)`: `sourceIndex = (1-1+3)%3 = 0`, 所以 `F -> U` ❌ 应该是 `F -> F`
  - `i=2 (R)`: `sourceIndex = (2-1+3)%3 = 1`, 所以 `R -> F` ❌ 应该是 `R -> R`

**问题**: Orientation的计算公式可能反了！

## 9. 修复建议

### 9.1 修复Orientation计算公式

当前公式: `sourceIndex = (i - corner.orientation + 3) % 3`

根据orientation的定义，应该是:
- `orientation=1`: `originalFaces[0] -> positionFaces[1]`
- 对于 `positionFaces[0]`，应该显示 `originalFaces[2]` 的颜色
- 所以: `sourceIndex = (i + corner.orientation) % 3` 或 `(i - corner.orientation + 3) % 3`

**需要验证**: 哪个公式是正确的？

### 9.2 修复R面旋转循环顺序

根据旧代码（`cubeLogic.ts`）:
- U的右列 → F的右列 → D的右列 → B的左列 → U的右列
- 这意味着: `UFR -> DFR -> DBR -> UBR -> UFR`

当前实现是: `['UBR', 'UFR', 'DFR', 'DBR']`，这可能不对。

**建议**: 恢复为 `['UFR', 'DFR', 'DBR', 'UBR']`，并检查orientation的计算。

---

**文档生成时间**: 2024年
**代码版本**: refactor/cubie-based-structure分支
**文件**: `src/utils/cubieBasedCubeLogic.ts`
