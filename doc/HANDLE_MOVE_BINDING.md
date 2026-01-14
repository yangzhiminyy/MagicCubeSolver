# handleMove 绑定流程说明

## 1. 函数定义

在 `App.tsx` 中定义了 `handleMove` 函数：

```typescript
const handleMove = (move: Move) => {
  if (isAnimating || animationState?.isAnimating) return
  
  // 获取动画信息
  const { axis, angle, affectedCubies, rotationCenter } = getAnimationInfo(move)
  
  // 启动动画
  setAnimationState({
    isAnimating: true,
    move,
    progress: 0,
    axis,
    angle,
    affectedCubies,
    rotationCenter,
  })
}
```

## 2. 绑定到 ControlPanel

在 `App.tsx` 的 JSX 中，`handleMove` 通过 props 传递给 `ControlPanel` 组件：

```typescript
<ControlPanel
  onScramble={handleScramble}
  onSolve={handleSolve}
  onMove={handleMove}  // ← 这里绑定
  onStepForward={handleStepForward}
  onStepBackward={handleStepBackward}
  // ... 其他props
/>
```

## 3. ControlPanel 中的使用

在 `ControlPanel.tsx` 中，每个 move 按钮的 `onClick` 事件调用 `onMove`：

```typescript
<div className="move-buttons">
  {moves.map((move) => (
    <button
      key={move}
      className="btn btn-move"
      onClick={() => onMove(move)}  // ← 这里调用
      disabled={isAnimating}
    >
      {move}
    </button>
  ))}
</div>
```

## 4. 执行流程

### 4.1 用户点击按钮
- 用户点击 `ControlPanel` 中的 move 按钮（如 "R"）
- 触发 `onClick={() => onMove(move)}`
- 调用 `handleMove('R')`

### 4.2 handleMove 执行
- `handleMove` 检查是否正在动画中
- 获取动画信息（轴、角度、受影响的cubies等）
- 设置 `animationState`，启动动画

### 4.3 动画循环
在 `useEffect` 中监听 `animationState` 的变化：

```typescript
useEffect(() => {
  if (animationState && animationState.isAnimating) {
    // 动画循环
    const animate = () => {
      // ... 更新动画进度
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // 动画完成，更新状态
        if (animationState.move) {
          setCubieBasedState(prev => applyMove(prev, animationState.move!))
          setMoveHistory(prev => [...prev, animationState.move!])
        }
        setAnimationState(null)
      }
    }
    
    requestAnimationFrame(animate)
  }
}, [animationState?.isAnimating])
```

### 4.4 实际 Move 操作
- 动画完成后，在 `useEffect` 中调用 `applyMove` 更新状态
- 同时更新 `moveHistory`

## 5. 其他调用场景

### 5.1 步骤前进（handleStepForward）
```typescript
const handleStepForward = () => {
  if (currentStep < solution.length) {
    const move = solution[currentStep]
    handleMove(move)  // ← 调用 handleMove
    setCurrentStep(prev => prev + 1)
  }
}
```

### 5.2 步骤后退（handleStepBackward）
```typescript
const handleStepBackward = () => {
  if (currentStep > 0) {
    const move = solution[currentStep - 1]
    const reversedMove = reverseMove(move)
    handleMove(reversedMove)  // ← 调用 handleMove
    setCurrentStep(prev => prev - 1)
  }
}
```

## 6. 总结

**绑定流程**：
1. `App.tsx` 定义 `handleMove` 函数
2. 通过 props 传递给 `ControlPanel`（`onMove={handleMove}`）
3. `ControlPanel` 中的按钮点击时调用 `onMove(move)`

**执行流程**：
1. 用户点击按钮 → `onMove(move)` → `handleMove(move)`
2. `handleMove` 设置 `animationState`，启动动画
3. `useEffect` 监听动画，更新动画进度
4. 动画完成后，在 `useEffect` 中调用 `applyMove` 更新实际状态

**注意**：
- `handleMove` 本身不直接执行 move 操作
- 它只是启动动画，实际的 move 操作在动画完成后执行
- 这样可以实现平滑的动画效果

---

**文档生成时间**：2024年
**相关文件**：
- `src/App.tsx`
- `src/components/ControlPanel.tsx`
