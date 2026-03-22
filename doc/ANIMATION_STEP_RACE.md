# 求解步骤与动画竞态：原因与修复

本文说明「求解后快速点击下一步时魔方状态与界面不一致」的问题：**根因并非 `setCubieBasedState` 的更新顺序错乱**，而是 **步骤索引 `currentStep` 在转动未真正开始时就被推进**，与 `applyMove` 的提交次数脱钩。

## 现象

- 求解完成后，快速连点「下一步」时，魔方可能无法与解法一致，出现「跳步」或最终未还原。
- README 中曾将原因归为「React 异步状态导致 `applyMove` 顺序错乱」；实际代码中更主要的问题是 **步骤计数与是否成功开启动画不同步**。

## 根因分析

### 1. `currentStep` 与 `tryBeginMove` 不同步（主因）

`App.tsx` 中逻辑等价于：

```text
handleStepForward:
  move = solution[currentStep]
  handleMove(move)           // 若正在转动动画，内部直接 return，不启动新动画
  setCurrentStep(prev + 1)   // 无论上一行是否成功，都会执行
```

`handleMove`（现重构为 `tryBeginMove`）在 `animationState?.isAnimating === true` 时会 **静默忽略**本次操作。但 `setCurrentStep` **仍会执行**，导致：

- 魔方逻辑上只应用了前几步（每次动画结束才 `applyMove` 一次）；
- `currentStep` 却已被多点几次，指向更后面的步；
- 下一次成功开启动画时，会执行 `solution[currentStep]`，相当于 **跳过中间若干步**，状态与解法序列错位。

这与「React 批处理导致多个 `applyMove` 乱序」是不同层面的问题：此处是 **业务逻辑上多推进了索引**，而不是同一轮更新里多个 `prev => applyMove` 的顺序问题。

### 2. UI 的 `isAnimating` 未覆盖「魔方转动动画」（放大问题）

控制面板里「上一步 / 下一步」等按钮原先仅用 `isAnimating` 禁用：

- `isAnimating` 主要在 **异步求解**（`handleSolve`）期间为 `true`；
- **单步转动动画** 只设置 `animationState`，**不会**把 `isAnimating` 设为 `true`。

因此在转动进行中，按钮仍可点击（或键盘连点），更容易触发上述「忽略转动但仍加步」的行为。

### 3. 次要说明：两套动画驱动

当前存在：

- `App.tsx` 中基于 `requestAnimationFrame` 的 `progress` 更新；
- `RubiksCube.tsx` 中 `useFrame` 根据 `delta` 叠加进度并驱动网格。

两者需保持与「单次动画 → 结束时一次 `applyMove`」的约定一致。若将来再出现边界问题，可统一为单一驱动源并加动画世代 id（见下文「可选加固」）。

## 修复方案（已实现）

1. **先尝试开启动画，成功后再改 `currentStep`**  
   将「能否转动」封装为 `tryBeginMove(move): boolean`，仅当返回 `true` 时执行 `setCurrentStep`。

2. **控制面板在转动期间禁用操作**  
   增加 `isCubeAnimating`（即 `!!animationState?.isAnimating`），与 `isAnimating` 合并为 `busy`，用于禁用打乱、求解、手动转动、上下步等与状态相关的按钮。

这样从交互上避免在转动未完成时重复点击，与逻辑上的「步进与转动绑定」一致。

3. **`handleScramble` / `handleSolve` 与转动动画互斥（逻辑层）**  
   面板虽已用 `busy` 禁用按钮，但若在转动中仍执行打乱或求解，会立刻改写 `cubieBasedState`，而 `animationState` 仍在、动画结束仍会 `applyMove`，造成状态叠加错误。因此在两者入口同样判断 `animationState?.isAnimating`，与 `isAnimating`（求解中）一并短路返回。

## 可选加固（未强制）

- **动画世代 token**：每次 `tryBeginMove` 递增 `ref`，完成回调只处理与当前 token 匹配的完成事件，防止极端情况下旧 RAF 与新区块交错（当前结构下优先级低于步进修复）。
- **单一动画时钟**：只保留 `useFrame` 或只保留 `App` 内 RAF 更新 `progress`，避免双通道进度语义重复。

## 相关文件

- `src/App.tsx`：`tryBeginMove`、`handleStepForward` / `handleStepBackward`、`handleScramble` / `handleSolve` 的转动互斥判断、传给面板的 `isCubeAnimating`
- `src/components/ControlPanel.tsx`：`busy = isAnimating || isCubeAnimating` 与各按钮 `disabled`
