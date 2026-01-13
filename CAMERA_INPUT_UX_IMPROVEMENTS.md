# 摄像头录入功能用户体验改进计划

## 概述

当前摄像头录入功能已经可以正常工作，但在用户体验方面还有改进空间。本文档规划了三个主要的改进方向。

## 改进目标

### 1. 实时色块识别与边框显示

**当前问题：**
- 摄像头预览时没有视觉反馈，用户不知道系统识别了哪些区域
- 无法直观看到每个色块的颜色识别结果

**改进方案：**
- 在摄像头预览画面上绘制 3x3 网格线，将每个面划分为 9 个区域
- 实时识别每个色块的颜色，并在对应区域显示识别结果
- 在每个色块区域绘制边框，用颜色标识识别结果（或显示颜色名称）
- 可以显示识别置信度（用边框粗细或透明度表示）

**技术实现：**
- 使用 Canvas 2D API 在视频流上叠加绘制
- 将每个面划分为 9 个区域（3x3 网格）
- 对每个区域进行颜色识别
- 使用 `requestAnimationFrame` 实现实时更新
- 可以考虑使用 WebGL 或 Canvas 2D 进行绘制

**UI 设计：**
```
┌─────────────────────────────────┐
│  摄像头预览（带网格线）          │
│  ┌───┬───┬───┐                  │
│  │ W │ W │ W │  ← 每个格子显示    │
│  ├───┼───┼───┤    识别颜色        │
│  │ W │ W │ W │                  │
│  ├───┼───┼───┤                  │
│  │ W │ W │ W │                  │
│  └───┴───┴───┘                  │
│                                  │
│  [识别颜色] [确认] [跳过]        │
└─────────────────────────────────┘
```

**实现细节：**
- 网格线颜色：白色或半透明，便于在各种背景下可见
- 色块边框：根据识别颜色绘制，或使用统一的边框颜色
- 颜色显示：可以在每个格子内显示颜色名称缩写（W/Y/R/O/G/B）或颜色块
- 置信度显示：边框粗细或透明度表示置信度（可选）

---

### 2. 展开图式六面录入界面

**当前问题：**
- 一个面一个面录入流程繁琐
- 需要多次点击"下一个面"
- 无法同时看到所有面的录入进度

**改进方案：**
- 采用魔方展开图布局，六个面同时展示在一个页面上
- 每个面显示为 3x3 网格，中心块颜色固定（代表该面的标准颜色）
- 中心块作为激活按钮：点击中心块可激活该面进行摄像头录入
- 边缘 8 个色块可以自由选择颜色（手动调整）
- 支持点击任意面进行录入，不强制按顺序
- 显示每个面的完成状态（未开始/进行中/已完成）

**UI 设计（展开图布局）：**
```
┌─────────────────────────────────────────────────────────────┐
│  魔方六面录入（展开图）                                        │
│                                                              │
│          ┌─────────┐                                        │
│          │    U     │  ← 上 (White)                          │
│          │ W │ W │ W│                                        │
│          │ W │[W]│ W│  ← 中心块可点击激活摄像头录入          │
│          │ W │ W │ W│                                        │
│  ┌───────┼─────────┼───────┬─────────┐                      │
│  │   L   │   F     │   R   │   B     │                      │
│  │G│G│G  │R│R│R    │B│B│B  │O│O│O    │                      │
│  │G│[G]│G│R│[R]│R  │B│[B]│B│O│[O]│O│  ← 每个面的中心块可激活│
│  │G│G│G  │R│R│R    │B│B│B  │O│O│O    │                      │
│  └───────┼─────────┼───────┴─────────┘                      │
│          │    D     │                                        │
│          │ Y │ Y │ Y│  ← 下 (Yellow)                        │
│          │ Y │[Y]│ Y│                                        │
│          │ Y │ Y │ Y│                                        │
│          └─────────┘                                        │
│                                                              │
│  当前激活面: F (前)  [摄像头预览区域]                        │
│  进度: 2/6 已完成                                            │
│  [完成录入] [取消]                                           │
└─────────────────────────────────────────────────────────────┘
```

**布局说明：**
- **展开图排列**：采用标准的魔方展开图布局（十字形）
  - 中心：F 面（前，红色）
  - 上方：U 面（上，白色）
  - 下方：D 面（下，黄色）
  - 左侧：L 面（左，绿色）
  - 右侧：R 面（右，蓝色）
  - 后方：B 面（后，橙色）- 放在 F 面的右侧

- **中心块固定颜色**：
  - 每个面的中心块颜色固定，代表该面的标准颜色
  - U=白色, D=黄色, F=红色, B=橙色, L=绿色, R=蓝色
  - 中心块不可编辑，但可以作为激活按钮

- **边缘块可编辑**：
  - 每个面的边缘 8 个色块可以自由选择颜色
  - 支持手动点击调整或摄像头识别

**交互设计：**

1. **激活面进行摄像头录入**：
   - 点击任意面的中心块，激活该面
   - 激活后，摄像头预览区域显示该面的识别界面
   - 激活的面会有视觉高亮（边框或背景色变化）
   - 在摄像头预览上绘制 3x3 网格线，实时识别颜色

2. **手动调整颜色**：
   - 点击边缘 8 个色块可以调整颜色
   - 支持循环切换或弹出颜色菜单（见第 3 节）
   - 中心块不可编辑，但显示该面的标准颜色

3. **状态显示**：
   - 每个面显示完成状态（未开始/进行中/已完成）
   - 可以用图标或颜色标识（如 ✓ 或不同背景色）

**技术实现：**

**布局结构：**
```typescript
interface CubeNetLayout {
  // 展开图布局配置
  faces: {
    U: { position: 'top', center: 'white' }
    D: { position: 'bottom', center: 'yellow' }
    F: { position: 'center', center: 'red' }
    B: { position: 'right', center: 'orange' }
    L: { position: 'left', center: 'green' }
    R: { position: 'right', center: 'blue' }
  }
}
```

**组件结构：**
```typescript
interface FaceNetProps {
  face: Face
  colors: FaceColor[][]  // 3x3 颜色数组
  isActive: boolean  // 是否激活（用于摄像头录入）
  isComplete: boolean  // 是否完成
  onActivate: () => void  // 点击中心块激活
  onColorChange: (row: number, col: number, color: FaceColor) => void
}

// 中心块特殊处理
const CENTER_COLORS: Record<Face, FaceColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'green',
  R: 'blue',
}
```

**摄像头管理：**
- 共享一个摄像头实例
- 点击某个面的中心块时，激活该面
- 激活后，摄像头预览区域显示该面的识别界面（带网格线和实时识别）
- 其他面显示已识别的颜色网格（静态预览）

**CSS 布局：**
```css
.cube-net {
  display: grid;
  grid-template-areas:
    ".   U   .   ."
    "L   F   R   B"
    ".   D   .   .";
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 10px;
}

.face-net {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.face-cell {
  aspect-ratio: 1;
  border: 1px solid #ccc;
}

.face-cell.center {
  /* 中心块样式 */
  cursor: pointer;
  font-weight: bold;
  /* 激活状态高亮 */
}

.face-cell.center.active {
  border: 3px solid #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
}
```

**状态管理：**
```typescript
interface CubeNetState {
  activeFace: Face | null  // 当前激活的面
  faces: Record<Face, {
    colors: FaceColor[][]
    confidence: number[][]
    isComplete: boolean
  }>
  cameraStream: MediaStream | null
}
```

---

### 3. 手动调整颜色操作优化

**当前问题：**
- 需要从下拉菜单选择颜色，操作繁琐
- 无法快速切换颜色
- 没有颜色预览
- 中心块应该固定，不可编辑

**改进方案：**
- **中心块**：固定颜色，不可编辑，但可作为激活按钮
- **边缘块**：支持多种交互方式调整颜色

**交互方案：**
- **边缘块**：
  - **单击**：循环切换颜色（白 → 黄 → 红 → 橙 → 绿 → 蓝 → 白）
  - **长按**：弹出传送带颜色选择器
    - 长按时传送带自动滚动
    - 选择的颜色随滚动自动切换并实时预览
    - 松开手指时确定选择的颜色
  - 提供键盘快捷键支持（1-6 对应 6 种颜色）
- **中心块**：
  - 单击：激活该面进行摄像头录入
  - 不可编辑颜色（固定为该面的标准颜色）

**UI 设计：**

**正常状态：**
```
┌───┬───┬───┐
│ W │ W │ W │  ← 边缘块：单击循环切换，长按弹出传送带选择器
├───┼───┼───┤    中心块：单击激活摄像头录入（固定颜色）
│ W │[R]│ W │    键盘：1-6 快速选择边缘块颜色
├───┼───┼───┤
│ W │ W │ W │
└───┴───┴───┘
当前: 红色 (Red) [快捷键: 3]
中心块: 固定为红色（F面标准颜色）
```

**长按时的传送带选择器：**
```
┌─────────────────────────────────────────────┐
│  ... 蓝 白 [黄] 红 橙 绿 蓝 白 黄 ...      │  ← 传送带自动滚动
└─────────────────────────────────────────────┘
            ↑ 当前选中（高亮、放大）
            
说明：
- 传送带无限循环滚动
- 中心位置的颜色为当前选中（高亮、放大显示）
- 实时预览：被编辑的色块颜色随传送带滚动实时更新
- 松开手指时确定选择
```

**技术实现：**

**颜色循环切换：**
```typescript
const COLORS: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue']

function cycleColor(currentColor: FaceColor | null): FaceColor {
  if (!currentColor) return COLORS[0]
  const index = COLORS.indexOf(currentColor)
  return COLORS[(index + 1) % COLORS.length]
}

// 中心块颜色固定
const CENTER_COLORS: Record<Face, FaceColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'green',
  R: 'blue',
}

function isCenterCell(row: number, col: number): boolean {
  return row === 1 && col === 1
}
```

**传送带颜色选择器组件：**
```typescript
interface ColorCarouselPickerProps {
  onSelect: (color: FaceColor) => void
  currentColor?: FaceColor | null
  position: { x: number, y: number }  // 选择器位置（相对于点击的色块）
  isVisible: boolean  // 是否显示
  onClose: () => void  // 关闭选择器
}

// 传送带选择器状态
interface ColorCarouselState {
  isActive: boolean  // 是否正在长按
  scrollPosition: number  // 当前滚动位置
  selectedColor: FaceColor | null  // 当前选中的颜色
  animationId: number | null  // 动画ID
}
```

**长按检测：**
```typescript
function useLongPress(
  onLongPress: () => void,
  onClick: () => void,
  delay: number = 500  // 长按延迟时间（毫秒）
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const targetRef = useRef<HTMLElement>()

  const start = useCallback((event: MouseEvent | TouchEvent) => {
    timeoutRef.current = setTimeout(() => {
      onLongPress()
      setLongPressTriggered(true)
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback((event: MouseEvent | TouchEvent, shouldTriggerClick = true) => {
    timeoutRef.current && clearTimeout(timeoutRef.current)
    if (shouldTriggerClick && !longPressTriggered) {
      onClick()
    }
    setLongPressTriggered(false)
  }, [onClick, longPressTriggered])

  return {
    onMouseDown: (e: React.MouseEvent) => start(e.nativeEvent),
    onTouchStart: (e: React.TouchEvent) => start(e.nativeEvent),
    onMouseUp: (e: React.MouseEvent) => clear(e.nativeEvent),
    onMouseLeave: (e: React.MouseEvent) => clear(e.nativeEvent, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e.nativeEvent),
    onTouchCancel: (e: React.TouchEvent) => clear(e.nativeEvent, false),
  }
}
```

**传送带滚动动画：**
```typescript
function useColorCarouselAnimation(
  colors: FaceColor[],
  onColorChange: (color: FaceColor) => void
) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    const animate = () => {
      setScrollPosition(prev => {
        const newPosition = prev + 1  // 每次滚动1px
        // 根据滚动位置计算当前选中的颜色
        const itemWidth = 60  // 每个颜色项的宽度
        const centerOffset = 200  // 中心位置偏移
        const index = Math.floor((newPosition + centerOffset) / itemWidth) % colors.length
        const selectedColor = colors[index]
        onColorChange(selectedColor)
        return newPosition
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    if (isActive) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, colors, onColorChange])

  return scrollPosition
}
```

**键盘快捷键：**
```typescript
// 1-6 对应 6 种颜色
const KEYBOARD_MAP: Record<string, FaceColor> = {
  '1': 'white',
  '2': 'yellow',
  '3': 'red',
  '4': 'orange',
  '5': 'green',
  '6': 'blue',
}
```

**视觉反馈：**
- **边缘块点击**：显示动画效果（缩放或高亮）
- **边缘块长按**：
  - 显示轮盘/传送带选择器
  - 当前选中的颜色高亮显示（放大、边框、阴影）
  - 实时预览颜色变化（色块背景色实时更新）
  - 松开时显示确认动画（缩放或闪烁）
- **当前选中的颜色**：用边框或阴影突出显示
- **颜色名称和快捷键提示**：显示在色块上或工具提示中
- **中心块**：有特殊的激活状态样式（边框高亮、阴影等）
- **激活的面**：整体有视觉反馈（背景色或边框变化）

**传送带选择器样式：**
- 半透明背景，不遮挡其他内容
- 平滑的滚动动画（使用 CSS transform 实现横向滚动）
- 当前选中颜色项（中心位置）放大显示，其他颜色项缩小
- 无限循环滚动，视觉流畅
- 颜色渐变过渡，增强视觉体验
- 响应式设计，适配不同屏幕尺寸

---

## 实施优先级

### 阶段 1：核心界面重构（高优先级）
1. **展开图式六面录入界面**
   - 影响：从根本上简化录入流程，提升用户体验
   - 工作量：大（3-5 天）
   - 用户价值：非常高
   - 包含：展开图布局、中心块激活、状态管理

### 阶段 2：交互优化（高优先级）
2. **手动调整颜色操作优化**
   - 影响：直接改善颜色调整的易用性和趣味性
   - 工作量：较大（2-3 天）
   - 用户价值：高
   - 包含：循环切换、传送带选择器、长按检测、动画效果、键盘快捷键

### 阶段 3：视觉增强（中优先级）
3. **实时色块识别与边框显示**
   - 影响：提升摄像头录入的可用性和准确性
   - 工作量：较大（2-3 天）
   - 用户价值：高
   - 包含：网格线绘制、实时识别、置信度显示

## 技术考虑

### 性能优化
- 实时颜色识别可能消耗较多 CPU
- 考虑使用 Web Workers 进行颜色识别计算
- 可以降低识别频率（如每 100ms 识别一次）

### 响应式设计
- 六面布局需要适配不同屏幕尺寸
- 移动端可能需要折叠或滚动布局
- 考虑横屏和竖屏模式

### 浏览器兼容性
- Canvas API 和 WebRTC 的兼容性
- 某些浏览器可能限制同时访问多个摄像头
- 需要优雅降级方案

### 用户体验细节
- 提供清晰的视觉反馈
- 错误处理和提示
- 加载状态显示
- 撤销/重做功能（可选）

## 后续优化方向

1. **智能识别优化**
   - 自动检测魔方在画面中的位置
   - 自动校正透视变形
   - 提高颜色识别准确率

2. **批量操作**
   - 支持复制/粘贴整个面的颜色
   - 支持镜像/旋转操作
   - 支持导入/导出颜色配置

3. **辅助功能**
   - 颜色识别历史记录
   - 识别置信度统计
   - 自动验证魔方状态有效性

---

## 总结

这三个改进方向可以显著提升摄像头录入功能的用户体验：

1. **展开图式六面录入界面**：从根本上简化录入流程
   - 六个面同时展示，一目了然
   - 中心块作为激活按钮，操作直观
   - 中心块颜色固定，符合魔方物理特性
   - 边缘块可自由调整，灵活方便

2. **手动调整颜色操作优化**：提高颜色调整效率
   - 单击循环切换，快速调整
   - 长按传送带选择器，流畅选择（自动滚动，实时预览）
   - 键盘快捷键，高效操作
   - 中心块与边缘块区分处理

3. **实时色块识别与边框显示**：提升摄像头录入准确性
   - 网格线清晰标识识别区域
   - 实时显示识别结果
   - 置信度可视化反馈

**设计亮点：**
- **中心块固定**：符合魔方物理特性（中心块颜色固定）
- **中心块激活**：巧妙利用中心块作为激活按钮，节省界面空间
- **展开图布局**：直观展示魔方六面，符合用户认知
- **灵活交互**：支持摄像头录入和手动调整两种方式

建议按优先级分阶段实施，先完成核心界面重构，再优化交互细节，最后增强视觉反馈。

---

## 后续优化方案

基于当前使用体验，以下是进一步的优化方向：

### 1. 传送带菜单交互优化

**当前问题：**
- 需要长按才能打开菜单，操作不够便捷
- 菜单打开后自动滚动，用户无法精确控制
- 无法直接点击菜单上的颜色项选择

**优化方案：**

#### 1.1 单击也出菜单
- **当前**：只有长按边缘块才能打开传送带菜单
- **优化**：单击边缘块也可以打开传送带菜单
- **实现**：
  - 移除长按检测，改为单击直接打开
  - 或者：单击打开菜单，长按打开菜单并自动滚动（保留两种方式）

#### 1.2 菜单弹出后点击切换颜色
- **当前**：菜单打开后自动滚动，用户被动等待
- **优化**：菜单打开后，每次点击菜单区域，颜色向前切换一次
- **实现**：
  - 菜单打开后暂停自动滚动
  - 点击菜单区域（或特定按钮）时，手动切换到下一个颜色
  - 可以添加左右箭头按钮，或者点击菜单任意位置切换

#### 1.3 菜单上的颜色可以直接点选
- **当前**：只能通过滚动等待目标颜色出现
- **优化**：菜单上的每个颜色项都可以直接点击选择
- **实现**：
  - 为每个颜色项添加点击事件
  - 点击后立即应用该颜色并关闭菜单
  - 当前选中的颜色项高亮显示

#### 1.4 点击其他地方消除菜单
- **当前**：已实现（点击 overlay 背景关闭）
- **优化**：保持现有功能，确保体验一致

**UI 设计：**
```
┌─────────────────────────────────────────┐
│  [←]  白 黄 [红] 橙 绿 蓝  [→]          │  ← 点击左右箭头切换
│        ↑ 当前选中（高亮）                │    或点击任意颜色项直接选择
└─────────────────────────────────────────┘
```

**交互流程：**
1. 单击边缘块 → 菜单弹出（暂停状态）
2. 点击菜单区域/箭头 → 切换到下一个颜色
3. 点击颜色项 → 直接选择该颜色并关闭菜单
4. 点击背景 → 关闭菜单并确定当前选择

---

### 2. 中心块按钮功能优化

**当前问题：**
- 点击中心块打开相机，需要另一只手点击"识别颜色"按钮
- 单手操作不便（需要一只手举着魔方）

**优化方案：**

#### 2.1 中心块按钮双重功能
- **第一次点击**：激活该面，打开摄像头预览
- **后续点击**：识别当前面的颜色（替代"识别颜色"按钮）
- **切换面**：点击其他面的中心块，自动切换到新面

**交互流程：**
```
初始状态：未激活任何面
  ↓
点击 F 面中心块 → 激活 F 面，打开摄像头预览
  ↓
调整魔方位置，对准摄像头
  ↓
再次点击 F 面中心块 → 识别 F 面颜色
  ↓
点击 U 面中心块 → 切换到 U 面，摄像头预览继续
  ↓
再次点击 U 面中心块 → 识别 U 面颜色
  ...
```

**状态管理：**
```typescript
interface CenterButtonState {
  activeFace: Face | null  // 当前激活的面
  isCameraReady: boolean    // 摄像头是否已准备好
  lastActivatedFace: Face | null  // 上次激活的面
}

// 点击逻辑
function handleCenterClick(face: Face) {
  if (activeFace === null || activeFace !== face) {
    // 第一次点击或切换面：激活该面，打开摄像头
    setActiveFace(face)
    openCamera()
  } else {
    // 再次点击同一面：识别颜色
    recognizeColors(face)
  }
}
```

**视觉反馈：**
- 激活的面：中心块高亮显示（已有）
- 摄像头就绪：可以显示一个提示（如"点击中心块识别颜色"）
- 识别中：显示加载状态

**优势：**
- 单手操作，更符合实际使用场景
- 减少操作步骤，提高效率
- 操作逻辑更直观（点击中心块 = 操作该面）

---

### 3. 九宫格大小优化

**当前问题：**
- 九宫格占据画面太大（约 80%）
- 魔方需要离摄像头很近才能对齐
- 操作不便，容易遮挡

**优化方案：**

#### 3.1 缩小九宫格尺寸
- **当前**：九宫格宽度/高度约为视频容器的 80%
- **优化**：缩小到约 40%（当前的一半）
- **实现**：
  - 调整 `.capture-grid` 的 `width` 和 `height` 从 80% 改为 40%
  - 保持正方形比例（`aspect-ratio: 1`）
  - 确保网格线清晰可见

**UI 对比：**
```
当前：
┌─────────────────────┐
│                     │
│   ┌───────────┐     │  ← 80% 大小
│   │  ┌─┬─┬─┐  │     │
│   │  ├─┼─┼─┤  │     │
│   │  └─┴─┴─┘  │     │
│   └───────────┘     │
│                     │
└─────────────────────┘

优化后：
┌─────────────────────┐
│                     │
│                     │
│    ┌─────┐          │  ← 40% 大小
│    │┌─┬─┐│          │
│    │├─┼─┤│          │
│    │└─┴─┘│          │
│    └─────┘          │
│                     │
│                     │
└─────────────────────┘
```

**优势：**
- 魔方可以离摄像头更远，操作更方便
- 减少手部遮挡
- 更容易对齐和稳定

---

## 优化实施优先级

### 阶段 1：快速优化（高优先级）
1. **九宫格大小调整**
   - 影响：直接改善操作体验
   - 工作量：小（5-10分钟）
   - 用户价值：高

2. **中心块按钮双重功能**
   - 影响：简化操作流程，支持单手操作
   - 工作量：中等（1-2小时）
   - 用户价值：非常高

### 阶段 2：交互增强（中优先级）
3. **传送带菜单交互优化**
   - 影响：提升颜色选择精确度和易用性
   - 工作量：较大（2-3小时）
   - 用户价值：高
   - 包含：
     - 单击打开菜单
     - 点击切换颜色
     - 直接点击颜色项选择

---

## 技术实现要点

### 传送带菜单优化
- 移除长按检测，改为单击打开
- 添加手动切换逻辑（点击切换 vs 自动滚动）
- 为颜色项添加点击事件处理
- 优化菜单状态管理

### 中心块按钮优化
- 添加状态跟踪（是否已激活、是否已识别）
- 实现点击逻辑分支（激活 vs 识别）
- 更新视觉反馈和提示信息
- 移除独立的"识别颜色"按钮（或保留作为备选）

### 九宫格大小调整
- 修改 CSS 中的 `width` 和 `height` 百分比
- 确保网格线清晰可见
- 测试不同屏幕尺寸下的显示效果

---

## 总结

这些优化方案基于实际使用体验，旨在：
1. **提升操作便利性**：单手操作、减少步骤
2. **增强交互精确度**：精确控制颜色选择
3. **改善视觉体验**：合适的识别区域大小

建议按优先级逐步实施，先完成快速优化，再完善交互细节。
