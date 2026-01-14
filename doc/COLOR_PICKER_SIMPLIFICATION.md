# 颜色选择菜单简化方案

## 背景

当前传送带菜单虽然功能完整，但操作复杂度较高：
- 需要滚动查找颜色
- 需要点击切换或等待自动滚动
- 需要手动关闭菜单
- 学习成本较高

经过实际使用体验，发现传送带菜单并没有减少操作复杂度，反而增加了交互步骤。

## 新设计方案

### 核心思路
**简化操作，一目了然，点击即选**

### UI 设计

```
┌─────────────────────┐
│  [白]  [黄]  [红]   │  ← 第一行：白、黄、红
│  [橙]  [绿]  [蓝]   │  ← 第二行：橙、绿、蓝
└─────────────────────┘
      ↑ 点击即选择，菜单自动关闭
```

### 布局规格
- **布局方式**：CSS Grid，2行 × 3列
- **颜色块大小**：约 60px × 60px（可根据实际调整）
- **间距**：8-10px
- **圆角**：8px
- **菜单总尺寸**：约 200px × 140px（包含内边距）

### 交互逻辑

1. **打开菜单**：
   - 点击边缘色块 → 弹出颜色选择菜单
   - 菜单位置：在色块附近（右侧或左侧，根据空间自动调整）

2. **选择颜色**：
   - 直接点击颜色块 → 立即选择该颜色
   - 菜单自动关闭
   - 色块颜色立即更新

3. **初始高亮**：
   - 根据当前面确定初始高亮颜色
   - U面：白色高亮（边框加粗或背景色变化）
   - F面：红色高亮
   - D面：黄色高亮
   - L面：绿色高亮
   - R面：蓝色高亮
   - B面：橙色高亮

4. **关闭菜单**：
   - 点击颜色块后自动关闭
   - 无需关闭按钮

### 颜色映射

| 面 | 标准颜色 | 颜色值 | 说明 |
|---|---|---|---|
| U | 白色 | #FFFFFF | 上表面 |
| D | 黄色 | #FFEB3B | 下表面 |
| F | 红色 | #F44336 | 前表面 |
| B | 橙色 | #FF9800 | 后表面 |
| L | 绿色 | #4CAF50 | 左表面 |
| R | 蓝色 | #2196F3 | 右表面 |

### 视觉设计

**颜色块样式**：
- 背景色：对应颜色的标准值
- 边框：2px solid #ddd（默认），选中时 3px solid #007bff
- 圆角：8px
- 悬停效果：轻微放大（scale 1.05）和阴影
- 点击效果：轻微缩小（scale 0.95）

**初始高亮**：
- 根据当前面确定高亮颜色
- 高亮方式：边框加粗（3px）或背景色加深
- 其他颜色块保持正常样式

**菜单容器**：
- 背景：白色或半透明白色（rgba(255, 255, 255, 0.95)）
- 阴影：0 4px 20px rgba(0, 0, 0, 0.3)
- 圆角：8px
- 内边距：10px

### 技术实现要点

#### 1. 组件结构简化
```typescript
interface SimpleColorPickerProps {
  isVisible: boolean
  position: { x: number, y: number }
  currentColor: FaceColor
  currentFace: Face  // 新增：用于确定初始高亮
  onSelect: (color: FaceColor) => void
  onClose: () => void
}
```

#### 2. 布局实现
```css
.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  width: 200px;
  height: 140px;
}

.color-picker-item {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-picker-item:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-picker-item.initial-highlight {
  border: 3px solid #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
}
```

#### 3. 交互逻辑
```typescript
const handleColorClick = (color: FaceColor) => {
  onSelect(color)
  onClose()  // 自动关闭
}
```

#### 4. 初始高亮判断
```typescript
const getInitialColor = (face: Face): FaceColor => {
  const faceColorMap: Record<Face, FaceColor> = {
    U: 'white',
    D: 'yellow',
    F: 'red',
    B: 'orange',
    L: 'green',
    R: 'blue',
  }
  return faceColorMap[face]
}

const isInitialHighlight = (color: FaceColor, face: Face): boolean => {
  return color === getInitialColor(face)
}
```

### 优势对比

| 特性 | 传送带方案 | 简化网格方案 |
|---|---|---|
| 操作步骤 | 3-4步（打开→滚动/切换→选择→关闭） | 2步（打开→选择） |
| 学习成本 | 较高（需要理解滚动机制） | 低（一目了然） |
| 代码复杂度 | 高（动画、滚动、状态管理） | 低（简单布局和点击） |
| 性能 | 中等（需要动画帧） | 高（无动画） |
| 视觉清晰度 | 中等（需要滚动查看） | 高（所有颜色同时可见） |
| 移动端适配 | 一般（滚动操作） | 好（大块点击区域） |

### 实施步骤

1. **创建新的简化组件** `SimpleColorPicker.tsx`
2. **实现 2x3 网格布局**
3. **实现初始颜色高亮逻辑**
4. **更新 `CubeNetInput.tsx`** 使用新组件
5. **移除旧的传送带组件**（或保留作为备选）
6. **测试和优化**

### 注意事项

1. **菜单位置计算**：
   - 确保菜单不会超出屏幕边界
   - 优先显示在色块右侧，空间不足时显示在左侧

2. **响应式设计**：
   - 在小屏幕上可能需要调整颜色块大小
   - 确保触摸操作友好（点击区域足够大）

3. **无障碍性**：
   - 添加 `aria-label` 属性
   - 支持键盘导航（Tab 键切换，Enter 键选择）

4. **向后兼容**：
   - 保留旧组件代码，以备需要时恢复
   - 可以通过配置切换新旧方案

---

## 总结

简化后的颜色选择菜单：
- ✅ 操作更直观：所有颜色一目了然
- ✅ 交互更简单：点击即选，无需滚动
- ✅ 代码更简洁：移除复杂的动画和状态管理
- ✅ 性能更好：无动画开销
- ✅ 学习成本更低：符合用户直觉

建议优先实施此方案，可以显著提升用户体验。
