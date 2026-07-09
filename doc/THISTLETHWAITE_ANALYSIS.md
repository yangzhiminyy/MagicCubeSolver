# Thistlethwaite 当前实现说明

本文档描述当前项目中的自研 Thistlethwaite 求解器现状。早期版本中关于 `stateKey`、阶段目标错误和 2->3 超时的结论已经过期。

## 1. 当前结论

- UI 选择 `Thistlethwaite` 时会调用 `src/utils/thistlethwaite.ts` 的 `solveByThistlethwaite`。
- 当前路径不依赖反向打乱序列，也不会通过调度器兜底到 Kociemba。
- 算法采用四阶段子群收缩，并用抽象距离表和分阶段搜索完成随机打乱还原。
- 第一次求解较慢是正常现象：距离表按需构建并缓存在页面内存中，后续同页求解会复用这些表。

## 2. UI 调用链

```text
用户选择 Thistlethwaite 并点击求解
  -> solveCube(cubieBasedState, 'thistlethwaite', movesToState)
  -> cubieBasedStateToCanonicalCubestring(...)
  -> cubieFromCubestring(...)
  -> thistlethwaiteSolve(cubie, 8, undefined, THISTLETHWAITE_UI_TUNING)
  -> solutionRestoresState(...) 校验输出步骤确实还原
```

这里的 cubestring 规范化步骤用于统一 Kociemba、IDA*、Thistlethwaite 的状态契约，避免 UI 坐标和求解器坐标不一致。

## 3. 四阶段模型

| 阶段 | 目标 | 移动集 | 当前实现 |
|------|------|--------|----------|
| G0 -> G1 | 棱块朝向正确 | 全部 18 个基础转动 | 2048 状态 EO 表，必要时使用同阶段 IDA* |
| G1 -> G2 | 角块朝向正确且 E-slice 棱进入切片 | `U/D` 任意，`R/L/F/B` 半转 | 角朝向 + E-slice 抽象距离表 |
| G2 -> G3 | 进入半转群可解子集 | `U/D/R/L/F/B` 的半转约束集 | 角块陪集 + 棱四元组抽象表 |
| G3 -> G4 | 完全还原 | 全部半转 | 半转群可达状态表 |

阶段目标对应 Thistlethwaite 的子群约束，不是“每阶段都把一部分块直接归位”。这也是旧实现容易搜索爆炸的主要区别。

## 4. 表与缓存

当前实现会懒加载构建以下内存表：

- EO 表：2048 个边朝向状态。
- G1 -> G2 表：`3^7 * C(12, 4) = 1,082,565` 个抽象状态。
- G2 -> G3 表：`70 * 420 = 29,400` 个抽象状态。
- G3 -> G4 表：半转群内可达排列状态。

这些表只在当前浏览器页面生命周期内缓存。刷新页面后第一次求解仍需要重新构建，所以“第一次慢、后面快”是预期行为。

## 5. 失败与兜底边界

需要区分两类“回退”：

- 调度器层面：`case 'thistlethwaite'` 不会改用反向解或 Kociemba。求解失败会直接抛错。
- 阶段内部：某些查表路径不可用时，会在同一 Thistlethwaite 阶段内改用受限移动集 IDA*。这仍然是当前四阶段算法的一部分。

因此，如果控制台看到阶段内部的 `回退到 ... IDA*`，并不表示 UI 走了反向打乱或 Kociemba 兜底。

## 6. 当前局限

- 输出解是分阶段解，不保证全局最短。
- 首次构建表会带来明显等待和内存占用。
- 非法状态、异常颜色映射或不满足 cubie 约束的输入仍可能失败。
- 表仍在主线程中构建，后续可迁移到 Web Worker 以改善首次求解体验。

## 7. 验证入口

当前相关测试主要在：

- `src/utils/thistlethwaite.real.test.ts`
- `src/utils/solverValidation.test.ts`
- `src/utils/solverFromCubestring.test.ts`

测试会用 `applyMovesToCubestring(start, solution) === SOLVED_CUBESTRING` 验证解法，而不是只检查“返回了步骤”。这可以同时覆盖 cubestring 契约、转动语义和求解器输出。
