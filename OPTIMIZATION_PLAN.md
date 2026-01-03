# 魔方求解器优化方案

本文档记录了未来优化方案的设计思路，不涉及立即的代码修改。所有方案将在设计成熟后再实施。

## 目录

1. [初始状态录入系统](#1-初始状态录入系统)
2. [基础数据结构重构](#2-基础数据结构重构)
3. [Cubie 纹理标记系统](#3-cubie-纹理标记系统)

---

## 1. 初始状态录入系统

### 1.1 需求分析

**当前问题：**
- 用户只能通过手动点击按钮来操作魔方
- 无法快速录入一个已打乱的实体魔方状态
- 如果魔方状态复杂，手动操作非常耗时

**目标：**
- 支持通过摄像头快速识别实体魔方的颜色
- 允许用户手动调整识别错误的颜色
- 提供直观的UI来确认和编辑每个面的颜色

### 1.2 技术方案

#### 1.2.1 摄像头颜色识别

**技术选型：**
- **WebRTC API**：获取摄像头视频流
- **Canvas API**：捕获视频帧并提取像素颜色
- **颜色识别算法**：
  - 方案A：HSV颜色空间分类（简单快速）
  - 方案B：机器学习模型（TensorFlow.js，更准确但更复杂）
  - 方案C：混合方案（先用HSV快速识别，再用ML模型验证）

**实现步骤：**
1. 在UI中添加"摄像头录入"按钮
2. 打开摄像头预览，显示魔方的6个面
3. 用户将魔方的每个面对准摄像头
4. 系统自动识别每个面的9个色块颜色
5. 显示识别结果，允许用户手动调整

#### 1.2.2 手动调整界面

**UI设计：**
- 显示3x3网格，每个格子显示当前识别的颜色
- 点击格子可以弹出颜色选择器
- 支持拖拽调整颜色
- 实时预览魔方状态

**数据结构：**
```typescript
interface FaceInputState {
  face: 'U' | 'D' | 'F' | 'B' | 'L' | 'R'
  colors: FaceColor[][]  // 3x3 颜色数组
  confidence: number[][]  // 识别置信度（0-1）
  isComplete: boolean
}
```

### 1.3 实现优先级

- **Phase 1**：基础摄像头捕获和颜色提取
- **Phase 2**：HSV颜色分类算法
- **Phase 3**：手动调整UI
- **Phase 4**：机器学习模型（可选，如果HSV效果不佳）

### 1.4 潜在挑战

1. **光照条件**：不同光照下颜色识别可能不准确
2. **摄像头质量**：低质量摄像头可能影响识别
3. **魔方质量**：贴纸颜色、反光等可能影响识别
4. **用户操作**：需要用户正确对准每个面

### 1.5 备选方案

如果摄像头识别效果不佳，可以考虑：
- 提供颜色选择器，让用户手动点击输入
- 支持导入图片文件进行识别
- 提供预设的常见打乱状态

---

## 2. 基础数据结构重构

### 2.1 当前架构问题分析

**当前数据结构：**
```typescript
interface CubeState {
  U: FaceColor[][]  // 3x3 颜色数组
  D: FaceColor[][]
  F: FaceColor[][]
  B: FaceColor[][]
  L: FaceColor[][]
  R: FaceColor[][]
}
```

**存在的问题：**
1. **旋转逻辑复杂**：需要手动处理每个面的颜色转移，容易出错
2. **坐标映射混乱**：不同面的坐标系统不一致（row=z+1, col=x+1等）
3. **难以验证正确性**：颜色数组无法直接反映cubie的位置和方向
4. **维护困难**：每次修改旋转逻辑都需要仔细检查所有面的映射关系

### 2.2 新架构设计

#### 2.2.1 Cubie 类型定义

**核心思想：**
- 魔方由26个cubie组成（3x3x3 - 1个中心块）
- 每个cubie有唯一标识和位置
- 旋转时改变cubie的位置和方向，而不是直接操作颜色

**Cubie 类型：**

```typescript
// Corner Cubie（8个）
type CornerCubieId = 
  | 'UFR' | 'UFL' | 'UBL' | 'UBR'  // 上层角块
  | 'DFR' | 'DFL' | 'DBL' | 'DBR'  // 下层角块

// Edge Cubie（12个）
type EdgeCubieId =
  | 'UF' | 'UR' | 'UB' | 'UL'      // 上层边块
  | 'DF' | 'DR' | 'DB' | 'DL'      // 下层边块
  | 'FR' | 'FL' | 'BR' | 'BL'      // 中层边块

// Face Cubie（6个中心块）
type FaceCubieId = 'U' | 'D' | 'F' | 'B' | 'L' | 'R'

type CubieId = CornerCubieId | EdgeCubieId | FaceCubieId
```

**Cubie 数据结构：**

```typescript
// 角块：有3个面，每个面有颜色和方向
interface CornerCubie {
  id: CornerCubieId
  position: CornerCubieId  // 当前位置
  orientation: [number, number, number]  // 方向（0, 1, 2），表示绕哪个轴旋转
  colors: {
    U?: FaceColor  // 如果这个角块在U面，U面的颜色
    D?: FaceColor
    F?: FaceColor
    B?: FaceColor
    L?: FaceColor
    R?: FaceColor
  }
}

// 边块：有2个面
interface EdgeCubie {
  id: EdgeCubieId
  position: EdgeCubieId
  orientation: 0 | 1  // 方向（0=正确，1=翻转）
  colors: {
    U?: FaceColor
    D?: FaceColor
    F?: FaceColor
    B?: FaceColor
    L?: FaceColor
    R?: FaceColor
  }
}

// 面块：只有1个面（中心块）
interface FaceCubie {
  id: FaceCubieId
  position: FaceCubieId  // 中心块位置固定
  color: FaceColor
}
```

#### 2.2.2 新的 CubeState 结构

```typescript
interface CubeState {
  corners: Map<CornerCubieId, CornerCubie>
  edges: Map<EdgeCubieId, EdgeCubie>
  faces: Map<FaceCubieId, FaceCubie>
}

// 或者使用数组，通过id索引
interface CubeState {
  corners: Record<CornerCubieId, CornerCubie>
  edges: Record<EdgeCubieId, EdgeCubie>
  faces: Record<FaceCubieId, FaceCubie>
}
```

#### 2.2.3 旋转逻辑简化

**新旋转逻辑：**
```typescript
function rotateR(state: CubeState): CubeState {
  const newState = cloneState(state)
  
  // 1. 更新角块位置
  // UFR -> DFR -> DBR -> UBR -> UFR
  const cornerCycle = ['UFR', 'DFR', 'DBR', 'UBR'] as const
  cycleCorners(newState, cornerCycle)
  
  // 2. 更新边块位置
  // UR -> FR -> DR -> BR -> UR
  const edgeCycle = ['UR', 'FR', 'DR', 'BR'] as const
  cycleEdges(newState, edgeCycle)
  
  // 3. 更新方向（角块和边块的方向变化）
  updateOrientations(newState, 'R')
  
  return newState
}
```

**优势：**
- 逻辑清晰：只需要定义哪些cubie需要移动
- 不易出错：位置和方向的变化是显式的
- 易于验证：可以检查每个cubie的位置是否正确

#### 2.2.4 颜色计算

**从 Cubie 状态计算面颜色：**

```typescript
function getFaceColors(state: CubeState): FaceColor[][] {
  const face: FaceColor[][] = Array(3).fill(null).map(() => Array(3).fill(null))
  
  // 遍历所有cubie，根据其位置和方向计算应该显示的颜色
  for (const corner of Object.values(state.corners)) {
    const pos = getCornerPosition(corner.position)  // 例如 UFR -> (x=1, y=1, z=1)
    const colors = getCornerColors(corner, corner.orientation)
    // 根据位置和方向，将颜色映射到对应的面
    mapCornerToFaces(face, pos, colors)
  }
  
  // 类似处理边块和面块...
  
  return face
}
```

### 2.3 迁移策略

**渐进式迁移：**
1. **Phase 1**：实现新的数据结构，但保留旧的接口
2. **Phase 2**：实现新旧数据结构的转换函数
3. **Phase 3**：逐步迁移旋转逻辑到新结构
4. **Phase 4**：更新渲染逻辑使用新结构
5. **Phase 5**：移除旧的数据结构

**兼容性：**
- 在迁移期间，保持新旧两套系统并行运行
- 提供转换函数：`oldStateToNewState()` 和 `newStateToOldState()`
- 逐步替换，确保每个阶段都能正常工作

### 2.4 数据结构对比

| 特性 | 当前结构 | 新结构 |
|------|---------|--------|
| 数据表示 | 6个面的颜色数组 | 26个cubie的位置和方向 |
| 旋转逻辑 | 手动转移颜色 | 移动cubie位置 |
| 坐标系统 | 复杂的映射关系 | 基于cubie ID |
| 验证难度 | 高（需要检查所有面） | 低（检查cubie位置即可） |
| 代码复杂度 | 高（每个旋转函数都很长） | 低（统一的移动逻辑） |
| 性能 | 快（直接操作数组） | 稍慢（需要计算颜色） |

### 2.5 潜在挑战

1. **性能考虑**：每次渲染都需要从cubie状态计算面颜色
   - **解决方案**：缓存计算结果，只在状态改变时重新计算
   
2. **学习曲线**：新结构需要理解cubie的概念
   - **解决方案**：提供详细的文档和示例

3. **迁移成本**：需要重写大量代码
   - **解决方案**：渐进式迁移，保持兼容性

---

## 3. Cubie 纹理标记系统

### 3.1 需求分析

**目标：**
- 在cubie的每个面上显示纹理标记（U、F、R等）
- 帮助用户理解每个cubie的初始位置
- 在旋转过程中也能看到cubie的原始位置

### 3.2 技术方案

#### 3.2.1 纹理设计

**标记方式：**
- **方案A**：文字标记（U、F、R等字母）
- **方案B**：数字标记（1-26，每个cubie唯一编号）
- **方案C**：颜色标记（在原有颜色基础上添加边框或角标）
- **方案D**：图标标记（使用小图标表示方向）

**推荐方案：**
- 使用文字标记（U、F、R等），清晰直观
- 可选：添加数字编号作为辅助

#### 3.2.2 实现方式

**Three.js 纹理：**
```typescript
// 为每个cubie面创建Canvas纹理
function createFaceTexture(faceLabel: string, color: FaceColor): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  
  // 绘制背景颜色
  ctx.fillStyle = colorToHex(color)
  ctx.fillRect(0, 0, 256, 256)
  
  // 绘制文字标记
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 120px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(faceLabel, 128, 128)
  
  // 转换为纹理
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
```

**数据结构扩展：**
```typescript
interface CubieWithTexture {
  // ... 原有的cubie数据
  textures: {
    U?: THREE.Texture
    D?: THREE.Texture
    F?: THREE.Texture
    B?: THREE.Texture
    L?: THREE.Texture
    R?: THREE.Texture
  }
}
```

#### 3.2.3 UI 控制

**功能：**
- 切换显示/隐藏纹理标记
- 选择标记类型（文字/数字/图标）
- 调整标记大小和透明度
- 选择显示哪些面的标记（只显示U面，或显示所有面）

**UI设计：**
```typescript
interface TextureDisplaySettings {
  enabled: boolean
  type: 'letter' | 'number' | 'icon' | 'none'
  size: 'small' | 'medium' | 'large'
  opacity: number  // 0-1
  showFaces: {
    U: boolean
    D: boolean
    F: boolean
    B: boolean
    L: boolean
    R: boolean
  }
}
```

### 3.3 实现步骤

1. **Phase 1**：实现基础纹理生成（文字标记）
2. **Phase 2**：集成到Cubie组件
3. **Phase 3**：添加UI控制面板
4. **Phase 4**：优化纹理质量和性能
5. **Phase 5**：添加其他标记类型（数字、图标）

### 3.4 性能考虑

**优化策略：**
1. **纹理缓存**：预生成所有可能的纹理，避免重复创建
2. **LOD（细节层次）**：根据相机距离调整纹理分辨率
3. **按需加载**：只在需要显示时才创建纹理
4. **纹理合并**：如果可能，将多个面的纹理合并到一个纹理图集中

### 3.5 用户体验

**优势：**
- 帮助理解魔方的结构
- 在打乱状态下也能看到原始位置
- 有助于学习魔方还原

**潜在问题：**
- 可能影响视觉效果（标记可能遮挡颜色）
- 对于不熟悉魔方的人来说可能过于复杂

**解决方案：**
- 默认关闭，用户可以选择开启
- 提供多种显示模式（全部显示/只显示特定面/完全不显示）

---

## 4. 实施优先级建议

### 高优先级
1. **基础数据结构重构**（方案2）
   - 这是核心架构改进，会影响所有其他功能
   - 完成后会大大简化后续开发

### 中优先级
2. **Cubie 纹理标记系统**（方案3）
   - 提升用户体验
   - 相对独立，可以在重构后进行

### 低优先级
3. **初始状态录入系统**（方案1）
   - 功能增强，但不是核心功能
   - 可以等核心架构稳定后再实现

---

## 5. 技术债务和风险

### 5.1 技术债务
- 当前的数据结构需要完全重构
- 旋转逻辑需要重写
- 渲染逻辑需要适配新结构

### 5.2 风险
- **重构风险**：大规模重构可能引入新bug
- **性能风险**：新结构可能影响性能
- **兼容性风险**：可能影响现有功能

### 5.3 缓解措施
- 渐进式迁移，保持向后兼容
- 充分的单元测试
- 保留旧代码作为参考
- 在开发分支进行，充分测试后再合并

---

## 6. 后续讨论

### 需要进一步讨论的问题

1. **数据结构重构**：
   - 是否完全移除旧结构，还是保留作为兼容层？
   - 如何优化从cubie状态到面颜色的计算性能？

2. **纹理标记**：
   - 标记的视觉设计（字体、大小、位置）
   - 是否需要支持自定义标记？

3. **摄像头录入**：
   - 颜色识别的准确率要求
   - 是否需要支持不同品牌的魔方（颜色可能略有差异）

---

## 7. 参考资料

### 相关概念
- **Rubik's Cube Notation**: 标准魔方标记系统
- **Cubie-based Representation**: 基于cubie的魔方表示方法
- **WebRTC**: 浏览器摄像头API
- **Three.js Textures**: Three.js纹理系统

### 类似项目
- [cubing.js](https://github.com/cubing/cubing.js) - 使用cubie-based结构的魔方库
- [Rubik's Cube Solver (Python)](https://github.com/hkociemba/RubiksCube-TwophaseSolver) - 参考数据结构设计

---

**文档版本**: 1.0  
**最后更新**: 2024-12-23  
**状态**: 方案设计阶段，未开始实施
