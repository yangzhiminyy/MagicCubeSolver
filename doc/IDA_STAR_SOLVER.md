# IDA* 求解器：当前实现逻辑说明

本文档整理 **`src/utils/cubeSolver.ts`** 中 `solveByIDAStar` 的完整流程，便于排查「报错、白屏、无解、过慢」等问题。实现为 **async** 深度优先式 IDA*（内部定期 yield），在浏览器主线程执行。

---

## 1. 入口与参数

| 项目 | 说明 |
|------|------|
| **函数** | `solveByIDAStar(cubieBasedState, maxDepth?, maxNodes?, yieldEvery?)`（**异步**，返回 `Promise<Move[]>`） |
| **默认 `maxDepth`** | `20`（与上帝数上界一致；由 `solveCube` 调用时固定传入 `20`） |
| **默认 `maxNodes`** | `IDA_STAR_MAX_NODES`（约 1200 万，**每轮**迭代加深的搜索结点上界；见 `cubeSolver.ts`） |
| **`yieldEvery`** | `IDA_STAR_YIELD_EVERY_NODES`（默认约 2500）：每处理这么多结点 `await` 一次，把控制权交回浏览器，**减轻页面卡死**；设为 `0` 可关闭（不推荐） |
| **调试日志** | 默认关闭；在浏览器控制台设置 `localStorage.setItem('DEBUG_IDA_STAR', 'true')` 并刷新后，求解时输出 `[IDA*]` 日志（详见 **§12.1**） |
| **总时长上限** | 默认 **5 分钟**（`IDA_STAR_DEFAULT_MAX_WALL_MS`）；超时自动放弃并 `console.warn`。`localStorage.setItem('IDA_STAR_MAX_WALL_MS', '0')` 表示不限制（可能极久无结果） |
| **输入** | `CubieBasedCubeState`（角块、边块、中心块） |
| **输出** | `Move[]`：还原步骤；未找到则 `[]` |
| **依赖** | `createSolvedCubieBasedCube`、`applyMove`、`cubieBasedStateToFaceColors` |

---

## 2. 整体流程（高层）

```
solveByIDAStar
  ├─ 若当前面颜色已与还原态一致 → 返回 []
  ├─ 定义 allMoves（18 种单步：R/R'/R2 × 6 面）
  ├─ 定义 heuristic(state)
  ├─ 定义 isSolved(state)
  ├─ 定义 search(state, path, g, threshold)  // 核心 DFS + 阈值剪枝
  └─ 外层 while：threshold 从 h(初始) 开始迭代加深，直到找到解或退出条件
```

---

## 3. 初始快速退出

- 将当前状态与还原态都转为 **面颜色** `CubeState`（`cubieBasedStateToFaceColors`）。
- `JSON.stringify` 全量比较；若相等 → **已还原**，返回 `[]`。

---

## 4. 移动集合 `allMoves`

共 **18** 种基本转动（与标准魔方记号一致）：

- 每个面：`R, R', R2`（L、U、D、F、B 同理）。

搜索时按固定顺序依次尝试（无随机、无排序）。

---

## 5. 启发式 `heuristic(state)`

### 5.1 统计内容

对 **8 个角块**、**12 个边块**（按 `id` 与 `createSolvedCubieBasedCube()` 中解状态逐项对比）：

- **位置错误**：`coordinate` 与解状态中该 `id` 的坐标不一致 → 计为错误。
- **位置正确**：再比较 **6 向颜色** `CubieColors`（upper/down/front/back/left/right）是否与解状态该 `id` 完全一致；任一不一致 → 计为错误（含「朝向错误」）。

### 5.2 聚合公式（已实现加强版）

```text
hWrong = max( ceil(cornerWrong / 4), ceil(edgeWrong / 4) )
hMan   = max( ceil(sumCornerManhattan / 4), ceil(sumEdgeManhattan / 4) )
h      = max( hWrong, hMan )
```

其中 **Manhattan** 为各角块/边块当前坐标到解状态中该 `id` 的「家」坐标的 \(|dx|+|dy|+|dz|\) 之和；与错块计数取 **max**，在常见实现中用于增强信息量（实现见 `idaStarHelpers.ts` 的 `manhattanSums`）。

### 5.3 实现细节

- **优化后**：启发式复用外层闭包中的 **`solvedState`**，不再在每次 `heuristic` 内新建完整解状态。

---

## 6. 目标判定 `isSolved(state)`

- **不**使用 `h === 0` 作为唯一目标条件（避免仅位置对、朝向错时误判）。
- 使用：当前状态经 `cubieBasedStateToFaceColors` 后与 **外层闭包中的 `solvedCubeState`** 做 `JSON.stringify` 全等比较。

---

## 6.1 置换表（去重）

每轮迭代加深开始时 **`visited.clear()`**。在 `search` 内对当前局面生成 **54 字符状态键**（与 Kociemba 面序一致，见 `idaStarHelpers.cubeStateToKeyString`），若该键已存在且 **已记录深度 ≤ 当前 `g`**，则不再扩展（避免不同路径重复展开同一局面）。

---

## 7. 递归搜索 `search(state, path, g, threshold)`

### 7.1 参数含义

| 参数 | 含义 |
|------|------|
| `state` | 当前魔方状态 |
| `path` | 从根到当前的路径（`Move[]`） |
| `g` | 已走步数 |
| `threshold` | 本轮 IDA* 的 **f 值上界**（`f = g + h`） |

### 7.2 执行顺序（必须按此顺序理解剪枝）

1. **深度限制**  
   - 若 `g >= maxDepth` → 返回 `{ found: false, nextThreshold: Infinity }`  
   - 目的：避免无限路径（如 commutator 回到近似初始态）导致栈过深或长时间搜索。

2. **计算 `h`、`f`**  
   - `f = g + h`。

3. **f 剪枝**  
   - 若 `f > threshold` → 返回 `{ found: false, nextThreshold: f }`（供父层取最小 `f` 作为下一轮 threshold）。

4. **目标检测**  
   - 若 `isSolved(state)` → 返回 `{ found: true, path }`。

5. **扩展子结点**  
   - 对每个 `move ∈ allMoves`：  
     - **同面剪枝**：若 `path` 非空且上一步与当前步 **同一面**（`lastFace === currentFace`）→ `continue`（禁止 `R`/`R'`/`R2` 任意连续同面，避免 `R+R2`、`R2+R2` 等冗余）。  
     - **对面规范序**：若上一步与当前步为对面（如 R→L、U→D、F→B）→ `continue`（与交换顺序等价，只保留一种顺序）。  
     - `newState = applyMove(state, move)`；路径用 **`path.push(move)` / `pop()`** 进入子递归，避免每层复制数组。  
     - `search(newState, path, g+1, threshold)`  
     - 若子调用 `found` → 向上返回（成功时返回 `path.slice()` 快照）。  
     - 否则 `minThreshold = min(minThreshold, result.nextThreshold)`。  
   - **结点预算**：若累计搜索结点数超过 `maxNodes`，返回 `nextThreshold: Infinity`，外层结束并可能返回 `[]`。

6. **本层无成功子结点**  
   - 返回 `{ found: false, nextThreshold: minThreshold }`。  
   - 若所有 `move` 均被 `continue` 跳过，**从未更新** `minThreshold` → `minThreshold` 仍为 `Infinity`。

---

## 8. 外层迭代加深（`while`）

```text
threshold ← heuristic(初始状态)
while (threshold <= maxDepth) {
  result ← search(初始, [], 0, threshold)
  if result.found → 返回 result.path
  nextThreshold ← result.nextThreshold
  if nextThreshold === Infinity 或 nextThreshold > maxDepth → break
  threshold ← (nextThreshold > threshold) ? nextThreshold : (threshold + 1)
}
return []
```

### 8.1 `nextThreshold` 的含义

- 子树被剪时，子结点返回 `nextThreshold = f`（第一个超过当前 `threshold` 的 `f`）。
- 父层取所有子结点中最小的 `nextThreshold`，作为下一轮 IDA* 的**更大阈值**。

### 8.2 额外保护

- `nextThreshold === Infinity`：例如深度耗尽或无可行分支 → `break`，返回 `[]`。
- `nextThreshold > maxDepth`：与 `maxDepth` 对齐的退出条件（避免无意义迭代）。
- `threshold = nextThreshold > threshold ? nextThreshold : threshold + 1`：防止 `nextThreshold` 与当前 `threshold` 相等时 **while 死循环**。

---

## 9. 与 `solveCube` 的衔接

```ts
case 'ida-star':
  return solveByIDAStar(cubieBasedState, 20)
```

- **无** `movesToState` 参数（与反向移动法不同）。
- 在 `App` 中通过 `await solveCube(...)` 调用。IDA* 在搜索中每隔 `yieldEvery` 个结点执行 `setTimeout(0)` 让出主线程，**页面可继续重绘与响应简单交互**；若仍觉慢，可调小 `yieldEvery`（更顺滑但更慢）或调大（更快但更易卡顿）。若内部抛错，由外层 `catch` 处理。

---

## 10. 已知特性与局限（与「报错」可能相关）

| 类别 | 说明 |
|------|------|
| **时间复杂度** | 状态空间极大；弱启发式下节点数爆炸，**任意非平凡打乱**都可能极慢。 |
| **主线程阻塞** | 已用 **异步 + 定期 yield** 缓解；极端大搜索仍可能感到慢，可考虑 Worker 或降低 `IDA_STAR_MAX_NODES`。 |
| **最优性** | 理论上在可采纳启发式 + 足够 `maxDepth` 下可寻最优解；实际受 `maxDepth`、时间、剪枝限制。 |
| **剪枝不完整** | 仅同面连续非 `2` 的剪枝；**无** 全局重复状态检测（依赖 `g >= maxDepth` 限制深度）。 |
| **`nextThreshold` 为 `Infinity`** | 整层无法扩展有效子结点时，外层提前结束 → 返回 `[]`，用户可能看到「求解失败」类提示。 |
| **字符串比较开销** | `isSolved` 与初始判等使用 `JSON.stringify` 全图，高频调用时 CPU 占用高。 |

---

## 11. 与「错误」相关的代码路径（排查方向）

1. **`solveCube` 抛错**  
   - 仅当 `catch` 中 `throw` 或子模块抛错；`solveByIDAStar` 本身**不** `throw`，只返回 `[]`。

2. **`App` 中 `solutionMoves.length === 0`**  
   - 会弹出「求解失败」类 `alert`（文案可能仍指向 Kociemba/转换问题，与 IDA* 实际原因无关）。

3. **栈溢出 / 死循环**  
   - 已通过 `g >= maxDepth` 与 `threshold` 递增保护缓解；若仍出现异常，需结合具体报错栈与复现步数。

---

## 12. 相关文件

| 文件 | 作用 |
|------|------|
| `src/utils/cubeSolver.ts` | `solveByIDAStar`、`solveCube` 分发 |
| `src/utils/idaStarHelpers.ts` | 状态键、逐格判等、Manhattan 和 |
| `src/utils/cubieBasedCubeLogic.ts` | `applyMove`、状态变换 |
| `src/utils/cubeTypes.ts` | `CubieBasedCubeState`、`Move` 等类型 |

---

## 12.1 调试日志（长时间无结果时排查）

用于 IDA* 求解**长时间无结果**、卡死感或需要排查参数时，可开启控制台诊断日志（前缀 **`[IDA*]`**），便于复制发给开发者。

### 开启步骤（推荐）

1. 打开页面后按 **F12**（或右键 →「检查」）打开**开发者工具**，切到 **Console（控制台）** 标签。
2. 在控制台**粘贴下面一行**并回车执行：

   ```js
   localStorage.setItem('DEBUG_IDA_STAR', 'true')
   ```

3. **刷新页面**（F5 或 Ctrl+R），确保配置生效。
4. 在应用中选择 **IDA*** 算法，点击**求解**，观察控制台输出。

> 存储键名与代码中一致：`DEBUG_IDA_STAR`（见 `cubeSolver.ts` 的 `DEBUG_IDA_STAR_STORAGE_KEY`）。

### 关闭日志

在控制台执行：

```js
localStorage.removeItem('DEBUG_IDA_STAR')
```

然后刷新页面（或下次打开站点即恢复为不输出日志）。

### 日志内容说明

开启后，求解过程中可能出现类似条目（实际以控制台为准）：

- **开始求解**：`maxDepth`、`maxNodes`、`yieldEvery`、初始启发式 `initialH` 等  
- **迭代加深轮次开始 / 结束**：当前轮 `threshold`、本轮探索结点数 `nodesThisRound`、`nextThreshold`、是否 `found`、耗时 `roundMs`  
- **进度**（约每 `IDA_STAR_DEBUG_PROGRESS_NODES` 个结点一条，默认 10 万）：`g`、`h`、`f`、`elapsedMs`  
- **已达 maxNodes**：本轮因结点上限中止  
- **求解成功** / **求解结束（无解或中断）** / **未找到解，退出迭代加深**

### 其它开启方式（开发用）

在代码中调用 `solveByIDAStar` 时，将第 5 个参数设为 `true` 也可强制打开日志（无需 localStorage），例如：

`await solveByIDAStar(state, 20, maxNodes, yieldEvery, true)`  

需自行在 `solveCube` 或调用处传入，一般仍推荐用 localStorage 开关。

### 日志含义举例（为何 `f` 与 `threshold` 不同）

IDA* 每一轮有一个 **阈值 `threshold`**，只扩展满足 **`f = g + h ≤ threshold`** 的结点；若 **`f > threshold`**，该结点**不再向下扩展**（剪枝），但**仍会计入已访问结点数**，因此进度里可能出现：

- `threshold: 8`，`g: 6`，`h: 3`，`f: 9` → **`f > threshold`**，本条状态会被剪枝，**属于正常现象**，不代表程序卡死在这一条上；搜索仍在遍历其它 `f ≤ 8` 的分支。

当前启发式 **上界很小（约 ≤3）**，对随机打乱的真实最优步数（常达十几步）区分力弱，**单轮搜索树可能极大**（数百万结点仍可能未搜完一轮）。因此：

- **实际使用复杂打乱时，请优先使用 Kociemba**；IDA* 更适合教学或极浅层测试。
- 若长时间无结果，属预期；已默认 **总时长上限 5 分钟**，超时将停止并提示（见 `IDA_STAR_MAX_WALL_MS`）。

### 总时长上限（避免「永远算不完」）

- 默认：`IDA_STAR_DEFAULT_MAX_WALL_MS`（5 分钟），从求解开始计时，超时则返回 `[]` 并在控制台输出 **`[IDA*] 已达总时长上限`**（非仅调试模式）。
- **取消限制**（不推荐，可能数小时仍无结果）：

  ```js
  localStorage.setItem('IDA_STAR_MAX_WALL_MS', '0')
  ```

- **改为 10 分钟**：`localStorage.setItem('IDA_STAR_MAX_WALL_MS', '600000')`，然后刷新页面。

---

## 12.2 性能分析：为何很慢？是否有死循环或无限递归？

### 是否有死循环 / 无限递归？

**没有**「逻辑上的死循环」或「无限递归」，原因如下：

| 机制 | 作用 |
|------|------|
| **`g >= maxDepth`** | 递归深度不超过 `maxDepth`（默认 20），每条路径长度有上界。 |
| **`f > threshold`** | IDA* 本轮中 `g + h` 超过当前阈值即返回，不再向更深展开。 |
| **外层 `while`** | `threshold` 每轮递增（或增至 `nextThreshold`），并在 `> maxDepth` 或 `nextThreshold === ∞` 时退出。 |
| **`maxNodes` / `maxWallMs`** | 结点总数或墙钟时间到则全局中止。 |

递归是 **深度优先 + 回溯**（`push`/`pop` 路径）：每条分支最终会 **返回** 到父结点，栈深度最多约为当前搜索深度（且受 `threshold` 与 `maxDepth` 限制），**不会在单条路径上无限加深**。

用户感觉「跑了很久」是因为：**合法分支数量极大**，在弱剪枝下需要访问**海量结点**，不是卡在同一个递归里转圈。

### 为什么仍然非常慢？

1. **魔方状态空间极大**（约 \(4.3 \times 10^{19}\) 量级），无强剪枝时本质接近 **组合爆炸**。  
2. **当前启发式 `h` 很粗**：`max(⌈角错/4⌉, ⌈边错/4⌉)` 上界约 **3**，对「离解还有十几步」的多数状态区分度差，`f = g + h` **剪枝效果弱**，仍会展开巨大子树。  
3. **IDA* 的特性**：`threshold` 从较小值逐步加大时，**每一轮都要重新做一次深度优先搜索**（前一轮的工作无法直接复用为下一轮的完整缓存），轮次一多，**累计工作量极大**。  
4. **无置换表（transposition table）**：同一魔方状态往往可通过**不同移动序列**到达，实现里 **不记忆已访问状态**，会 **重复搜索** 相同或等价局面。  
5. **结点开销**：每个结点要算启发式、`isSolved` 时还有 `JSON.stringify` 等，**常数因子偏大**。

综上：**慢 = 问题本身难 + 启发式弱 + IDA* 重复搜索 + 无状态去重**，而不是实现写成了死循环。

### 实用建议

- 需要 **日常可用** 的求解：**用 Kociemba（两阶段）** 等专用算法。  
- 若研究 **最优步数** 或 IDA*：需 **更强的可采纳启发式**（如模式数据库 PDB），单靠当前 `h` 难以在合理时间内处理随机打乱。

---

## 13. 修订记录

- 文档创建：整理当前仓库中 IDA* 实现逻辑，便于后续修复与优化（不替代单元测试与性能分析）。

---

## 14. 外部评审对照（Opus 等）

以下对照 **外部代码审查** 与当前实现（以仓库内 `cubeSolver.ts` 为准），避免旧结论与现代码混淆。

| 评审项 | 结论 |
|--------|------|
| **(1) 启发式只比位置、不比朝向** | **旧版问题**；当前实现已比较 **位置 + 6 向颜色**，`isSolved` 用整图面颜色。 |
| **(2) 每次 `heuristic` 内 `createSolvedCubieBasedCube()`** | **曾成立**；优化后应复用外层闭包中的解状态（见 `solveByIDAStar` 内 `solvedState`）。 |
| **(3) `Math.ceil(diff/2)` 上界为 10、太弱** | **公式已改**；现为 `max(⌈角错/4⌉, ⌈边错/4⌉)`，**h 上界约 3**，可采纳性仍成立，但**剪枝仍弱**（定性仍对）。 |
| **(4) 移动剪枝：R+R2、R2+R2、对面可交换** | **部分成立**；需加强同面连续（禁止同面两步）、对面规范序（如 R 后不接 L 等）。 |
| **(5) `[...path, move]` 复制路径** | **成立**；可用单条 `path` 上 `push/pop` 减少分配。 |
| **(6) 无超时** | **成立**；可用最大节点数或 `AbortController`/时间片，避免主线程长时间卡死。 |

**小结**：评审中「致命」项 **(1)** 与旧启发式公式 **(3)** 在改版后**已不适用**；性能、剪枝、路径与超时 **(2)(4)(5)(6)** 仍可作为优化清单。实现变更时建议同步更新本表。

---

## 15. 已实现优化（版本说明）

若后续提交包含「优化版 IDA*」，一般会在代码注释中说明，并可能包含：

- 启发式内复用 `solvedState`，避免每次 `createSolvedCubieBasedCube()` 全量分配。
- **同面**：禁止连续两步作用于同一面（任意 `R/R'/R2` 组合），避免 `R+R2`、双 `R2` 等冗余。
- **对面**：对 `(L,R)`、`(U,D)`、`(F,B)` 采用规范序（如 R 后不接 L、U 后不接 D、F 后不接 B），减少与交换顺序等价的分支。
- 路径用 `push/pop` 代替展开路径。
- 可选 **最大搜索节点数**：达到上限则返回 `[]`，避免无限阻塞。
- **异步 yield**：`solveByIDAStar` 为 `async`，搜索中每隔 `yieldEvery` 结点 `await` 一次，减少整页卡死。
- **调试日志**：通过 `localStorage` 开关 `DEBUG_IDA_STAR` 输出 `[IDA*]` 诊断信息（见 **§12.1**）。

---

## 16. 与外部参考仓库的对比（Jai0212 / IDA*）

开源项目 [**Rubiks-Cube-Solver-Using-IDA-Star**](https://github.com/Jai0212/Rubiks-Cube-Solver-Using-IDA-Star)（C++、OpenGL）在 README 中描述为使用 **IDA\*** + **DFS**、**Manhattan 距离** 作启发式，并写明通过剪枝 **避免对同一魔方状态重复迭代**。与本仓库 **MagicCubeSolver** 中 IDA* 的差异可概括为下表（基于对方 README 与文件结构的公开信息，非逐行代码审计）。

| 维度 | [Jai0212 仓库](https://github.com/Jai0212/Rubiks-Cube-Solver-Using-IDA-Star) | 本仓库 `solveByIDAStar` |
|------|----------------|------------------------|
| **运行环境** | C++ 本地程序，无浏览器单线程与 GC 压力 | TypeScript，跑在浏览器主线程（另有 yield / 时长上限） |
| **启发式** | README 称 **Manhattan 距离**（对 3×3 魔方通常指各块到「家」的网格距离之和类指标，信息量比「错几块」大得多） | **粗计数**：`max(⌈角错/4⌉, ⌈边错/4⌉)`，`h` 上界约 **3**，对深层搜索 **剪枝能力弱** |
| **重复状态** | README 明确：**避免再次遍历同一魔方状态**（等价于 **置换表 / 已访问状态缓存** 一类优化） | **无** 全局状态去重；不同路径到达同一局面会 **重复展开** |
| **IDA* 框架** | IDA* 外层加阈值 + 内层 DFS，与本项目 **结构同类** | 同为迭代加深 + 深度优先 + `f = g + h` 与阈值剪枝 |
| **移动剪枝** | 对方未在摘录中逐条列出，通常还会做同面/规范序等 | 同面连续禁止、对面规范序等（见上文） |

### 为何对方 README 会写「极快」，而我们容易很慢？

1. **启发式信息量**：Manhattan 类启发式在魔方上通常比「错块数/4」**紧得多**，IDA* 每一轮 `threshold` 下展开的结点数可 **少几个数量级**。  
2. **去重**：跳过已见状态能砍掉大量冗余分支；我们没有则 **同一局面可被反复搜**。  
3. **语言与常数**：C++ 原生循环与内存布局通常比 JS 单次结点开销更低；我们另有 `async`/日志/`JSON` 等额外成本。  

因此：**算法名字都叫 IDA\*，并不等于性能同阶**；**启发式 + 是否去重 + 实现语言** 往往比「是否 IDA*」更决定体感速度。

### 若希望本仓库 IDA* 接近「可用速度」的方向（供规划）

- 引入 **更强的可采纳启发式**（至少 Manhattan 级，更进一步可用 **模式数据库 PDB** 等，工作量较大）。  
- 增加 **置换表**（或哈希已访问状态），避免重复扩展同一局面。  
- 或：**产品路径上继续以 Kociemba 为主**，IDA* 保留为教学/浅层实验。

**综合对比（含 Columbia 课程 PDF、Jai0212、本仓库）与可优化点清单**：见 [`doc/RUBIK_SOLVER_COMPARISON.md`](./RUBIK_SOLVER_COMPARISON.md)。

---
