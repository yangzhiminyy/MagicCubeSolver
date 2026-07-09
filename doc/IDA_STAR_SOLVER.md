# IDA* 求解器当前实现说明

本文档描述当前 `src/utils/cubeSolver.ts` 与 `src/utils/thistlethwaite.ts` 中 IDA* 相关路径。早期文档中“随机打乱主要依赖弱启发式完整空间搜索”的结论已经过期。

## 1. 当前结论

- `solveByIDAStar` 仍是完整空间 IDA*，用于浅层状态和单元测试中的精确搜索。
- UI 选择 `IDA*` 时，调度器会先尝试浅层完整空间 IDA*，随后对随机打乱切换到 `solveByPhasedIDAStar`。
- `solveByPhasedIDAStar` 使用 Thistlethwaite 同一套 G0->G1->G2->G3->G4 阶段目标和距离表启发。
- 随机打乱路径不依赖 `movesToState` 的反向历史，也不会兜底到 Kociemba。

## 2. UI 调用链

```text
用户选择 IDA* 并点击求解
  -> solveCube(cubieBasedState, 'ida-star', movesToState)
  -> cubieBasedStateToCanonicalCubestring(...)
  -> cubieFromCubestring(...)
  -> 若已解：返回 []
  -> 若无历史或历史长度 <= IDA_STAR_UI_EXACT_DEPTH_LIMIT：尝试 solveByIDAStar(...)
  -> 否则/失败后：solveByPhasedIDAStar(...)
  -> solutionRestoresState(...) 校验输出步骤确实还原
```

这里保留浅层完整空间 IDA*，是为了让 IDA* 在 1 步、2 步、5 步等测试中仍具备“真正搜索完整状态空间”的教学意义。

## 3. 两种 IDA*

### 完整空间 IDA*

入口：`solveByIDAStar`

特点：

- 使用 `f = g + h` 的迭代加深 DFS。
- 启发式以错块数和 Manhattan 类辅助为主，信息量有限。
- 有节点数、墙钟时间和 yield 参数，避免浏览器长时间无响应。
- 适合浅层状态，不适合作为随机 3x3 的唯一求解器。

### 分阶段 IDA*

入口：`solveByPhasedIDAStar`

特点：

- 仍使用 IDA* 的阈值迭代加深框架。
- 目标被拆成四个子问题：G0->G1、G1->G2、G2->G3、G3->G4。
- 每个阶段使用对应抽象距离表作为启发式，搜索空间远小于完整 3x3 状态空间。
- 输出解不保证全局最短，但可以在 UI 随机打乱上作为自研求解路径使用。

## 4. 为什么现在能解随机打乱

旧路径的问题是“弱启发式 + 完整空间搜索”：即使 IDA* 实现正确，随机 3x3 的搜索树也会迅速爆炸。

当前路径把随机状态拆到多个群论阶段，并用距离表给每个阶段提供更强的下界。这样每一轮 IDA* 的有效搜索空间都显著变小，所以能在预算内找到分阶段解。

## 5. 第一次慢的原因

分阶段 IDA* 会复用 `thistlethwaite.ts` 中的抽象表。表是懒构建的：

- 第一次进入相关阶段时构建。
- 构建后保存在模块级变量中。
- 同一个页面生命周期内再次求解会复用缓存。
- 刷新页面后缓存丢失，需要重新构建。

这也是第一次求解慢、后续求解快的主要原因。

## 6. 调试日志

浏览器控制台执行：

```js
localStorage.setItem('DEBUG_IDA_STAR', 'true')
```

然后刷新页面并再次求解，可以看到 `[IDA*]` 阶段、阈值、节点数等日志。关闭：

```js
localStorage.removeItem('DEBUG_IDA_STAR')
```

再刷新页面即可。

## 7. 当前局限

- 分阶段 IDA* 不是全局最优解搜索。
- 首次构建距离表仍在主线程，会带来等待感。
- 完整空间 IDA* 仍只适合浅层状态。
- 非法 cubie 状态或错误 cubestring 映射仍会导致求解失败。

## 8. 验证入口

当前相关测试主要在：

- `src/utils/solverValidation.test.ts`
- `src/utils/solverFromCubestring.test.ts`

随机打乱测试会验证 IDA* 调度器在没有历史兜底的情况下返回可还原步骤，并用 `applyMovesToCubestring` 验证最终回到 `SOLVED_CUBESTRING`。
