# 魔方求解实现对比与优化方向（综合）

本文对比三类公开资料与 **本仓库 MagicCubeSolver** 的实现差异，并归纳**可落地的优化方向**（不要求一次全部实现）。

---

## 1. 资料来源

| 来源 | 类型 | 链接 |
|------|------|------|
| **Columbia 课程报告 / 演讲稿** | Haskell、IDA\*、模式库（PDB）、Kociemba 两阶段简介 | [rubik-presentation.pdf](https://www.cs.columbia.edu/~sedwards/classes/2024/4995-fall/reports/rubik-presentation.pdf)（COMS 4995，*Parallel Functional Programming*） |
| **Jai0212** | C++、OpenGL、IDA\* + DFS、Manhattan、避免重复状态 | [Rubiks-Cube-Solver-Using-IDA-Star](https://github.com/Jai0212/Rubiks-Cube-Solver-Using-IDA-Star) |
| **本仓库** | TypeScript / 浏览器、`solveByIDAStar`（见 `cubeSolver.ts`）、Kociemba（`kociemba-wasm`） | `src/utils/cubeSolver.ts` |

---

## 2. Columbia PDF 要点摘要

以下内容来自该 PDF 的公开文本摘录，用于与我们对照，**非对原作者代码的逐行审计**。

### 2.1 表示与移动

- 魔方用 **`Cube`** 类型，六面 `[[Color]]`（字符），`applyMove` / `applyMoves` 组合移动。
- 强调面旋转与邻面带更新（`replaceRow`、`replaceCol` 等）。

### 2.2 IDA\* 与模式库（PDB）

- **IDA\***：`f = depth + h`，阈值迭代加深；与教科书定义一致。
- **Pattern Database（PDB）**：对**部分块子集**从**已解状态 BFS** 预计算到目标的**最优距离**，搜索时用查表得到**可采纳**启发式；未见状态可用回退值（文中举例如 8）。
- 状态用 **`Word8` 向量** 紧凑编码，`PDB = Map 状态 -> 距离`，可 **save/load** 二进制文件。

### 2.3 实验与并行

- **2×2**：使用「7 步内全覆盖」类 PDB 文件，对 3000 个 30 步打乱等做批处理；提到 **PDB 加载时间** 在总时间中占比大（Amdahl 瓶颈）。
- **并行**：多颗魔方并行求解有加速；**单颗魔方**并行 IDA\* 时，共享 **visited** 有竞争；且 **IDA\* 每轮阈值提高后要重新 DFS**，并行实现复杂。

### 2.4 状态空间与启发式困境（文中观点）

- **3×3 可解状态**约 \(4.3 \times 10^{19}\) 量级；**完整 PDB** 不可行。
- **简单启发式**（错位数、一般 Manhattan）对 3×3 **仍可能严重低估**，难以单独支撑高效搜索。

### 2.5 Kociemba 两阶段（文中概述）

- **阶段 1**：进入 **G1**（朝向正确的一类子群），可用一次 IDA\* + 专用启发式/表。
- **阶段 2**：在 **G1 移动集**内完成排列，再一次 IDA\* + 多 MB 级表。
- 文中强调：需要**两套启发式/表**与高效状态维护——这与「仅用简单计数 `h`」的 IDA\* 不是同一难度。

---

## 3. Jai0212 仓库要点（简）

- **C++**，IDA\* + DFS；启发式为 **Manhattan**；README 写明 **避免对同一状态重复迭代**（去重/缓存类优化）。
- 详见本仓库 **`doc/IDA_STAR_SOLVER.md` §16**。

---

## 4. 本仓库 MagicCubeSolver（当前 IDA\*）

| 项目 | 现状 |
|------|------|
| **启发式** | `h = max(⌈角错/4⌉, ⌈边错/4⌉)`，上界约 **3**，信息量极低 |
| **去重** | **无** 置换表 / 全局 visited |
| **运行环境** | 浏览器 TS，有 yield、结点上限、墙钟上限 |
| **主求解路径** | **Kociemba（wasm）** 为实用默认；IDA\* 偏实验 |

---

## 5. 三方对照表

| 维度 | Columbia（Haskell + PDB 思路） | Jai0212（C++） | 本仓库 IDA\* |
|------|----------------------------------|----------------|----------------|
| **核心加速手段** | PDB 查表 + 紧凑状态键；两阶段思路对接 Kociemba | Manhattan + **重复状态剪枝** | 弱计数 `h` + 移动剪枝 |
| **3×3 可行性** | 明确：全 PDB 不可行，需子集 PDB 或两阶段 | Manhattan + 去重，通常仍远强于纯计数 | 随机打乱下**极易超时/结点爆** |
| **实现代价** | 高（生成 PDB、编码、存盘） | 中–高 | 低（但性能差） |
| **与本仓库 Kociemba** | 同属「强表驱动 / 群论分解」路线 | — | **产品级求解应走 Kociemba** |

---

## 6. 综合结论：为什么「都叫 IDA\*」速度差很多？

1. **启发式质量**决定 IDA\* 每轮展开结点数量级；PDB / 两阶段表 >> Manhattan >> 当前 `⌈错/4⌉`。  
2. **状态去重**避免重复子树；Columbia 并行段也强调 visited 的重要性。  
3. **Columbia** 与 **Kociemba** 说明：3×3 的实用解法是 **分解子问题 + 多表**，不是单次弱启发式 IDA\* 扫全空间。  
4. **运行时**：C++/Haskell 原生循环与紧凑内存 vs 浏览器 JS 对象与 GC。

---

## 7. 本仓库可优化点（按投入 / 收益大致排序）

### 7.1 低投入（仍保持「教学用 IDA\*」定位）

- **置换表 / 哈希已访问状态**：✅ 已实现——每轮 IDA 内 `Map` + 54 字符面键（`idaStarHelpers.ts` / `cubeSolver.ts`）。  
- **更强但仍可采纳的粗启发式**：✅ 已实现——**错块/4** 与 **Manhattan 和/4** 取 `max`（`manhattanSums`）。  
- **减少热路径开销**：✅ 已实现——`isSolved` 与初始判等使用 **`cubeStatesEqual`** 逐格比较，避免 `JSON.stringify`。

### 7.2 中投入（向「可用 IDA\*」靠拢）

- **子集 PDB（一角一棱或棱子集）**：预计算 BFS 距离表，运行时取 max（可采纳合并）。需离线生成脚本 + 存储（可参考 Columbia 文中 PDB 文件思路）。  
- **Web Worker**：将 IDA\* 移出主线程，避免与 UI 争抢（与并行单魔方不同，主要是隔离长任务）。

### 7.3 高投入（产品级 3×3）

- **直接依赖或移植 Kociemba 两阶段**（本仓库已通过 **kociemba-wasm** 实现）；IDA\* 保留为对比教学或浅层打乱演示。  
- 完整 PDB + IDA\* 对 3×3 的工程规模与 Columbia PDF 描述一致：**表体积与生成成本**都很大，一般不作为浏览器内轻量功能的首选。

---

## 8. 建议的产品策略

| 场景 | 建议 |
|------|------|
| **用户要「能解开」** | 默认 **Kociemba**（已集成）。 |
| **用户要「IDA\* 学习」** | 保留当前 IDA\*，文档标明局限；可选加强 Manhattan / 去重。 |
| **用户要「IDA\* 也快」** | 需 PDB 或两阶段级设计，**工作量接近独立子项目**，与简单参数调优不同。 |

---

## 9. 修订记录

- 初稿：基于 Columbia 2024 PDF 与 Jai0212 README、本仓库 `cubeSolver.ts` / `IDA_STAR_SOLVER.md` 整理。
