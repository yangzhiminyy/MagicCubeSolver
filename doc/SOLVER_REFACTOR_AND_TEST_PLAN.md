# 求解层重构与测试设计方案

本文档约定：**以 cubestring（Kociemba 54 字符）作为「展示 / 存储 / 交换」的统一契约**，在测试与可选 CLI 中与 3D 完全解耦；**IDA\* / 自研 Thistlethwaite** 逐步对齐该契约，并按 **1 步 → 2 步 → 5 步 → 长序列 / 全打乱** 递增验证，全部可走单元测试。

---

## 1. 目标与原则

| 目标 | 说明 |
|------|------|
| **可验证** | 任意算法输出 `Move[]` 后，能在无 UI 环境下判定「是否把魔方还原到已解 cubestring」 |
| **解耦** | 前端只负责「状态 ↔ 字符串」；求解器输入优先为 **cubestring** 或经单一模块转换后的内部状态 |
| **渐进式** | 不一次性大改；先基础设施与测试，再改求解器入口，最后收紧前端依赖 |
| **单一事实来源** | cubestring 的 **面序、贴纸序、颜色字母** 只在一处定义（见第 3 节），与 `doc/CUBESTRING_ISSUES.md` 中的已知问题对齐并持续修复 |

**原则：** 转动语义（`R` / `R'` / `R2`）与 **cubestring 编解码** 必须先通过小测试，再谈「算法对不对」；否则会出现「求解器对、串错」的假阴性。

---

## 2. 现状摘要（与本文档相关的部分）

- **Kociemba：** `cubeConverter` 中 `cubieBasedState` → `cubeStateToCubestring` → `kociemba-wasm`；输入路径已偏「串化」。
- **IDA\*：** `solveByIDAStar(cubieBasedState)`，内部 cubie 模型。
- **自研 Thistlethwaite：** `thistlethwaiteSolve(cubieState, …)`（`cubeSolver.ts` 中 `case 'thistlethwaite'`）。
- **命名冲突（已处理）：** `cubeSolver.ts` 中原 `solveByThistlethwaite(cubestring)` 已更名为 **`solveByCubeSolverKociemba`**（仍走 `cube-solver` 的 Kociemba）；UI「自研 Thistlethwaite」仍对应 `thistlethwaite.ts` 的 `solveByThistlethwaite(cubie)`。

---

## 3. 目标架构（分层）

```
┌─────────────────────────────────────────────────────────────┐
│  UI / 3D（RubiksCube）                                        │
│  仅：展示、交互 → 产出 CubieBasedCubeState 或间接产出 cubestring │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  契约层：CubestringCodec（单一模块）                          │
│  - cubestring ↔ CubeState（面模型，与 Kociemba 一致）          │
│  - 可选：cubestring ↔ CubieBasedCubeState（经 CubeState）      │
│  - 校验：长度 54、字符集、中心块、（后续）合法置换约束         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  仿真层：applyMovesOnCubestring（测试与验收核心）              │
│  cubestring + Move[] → cubestring（内部用 CubeState + 已有转动）│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  求解层（统一入口形态，见第 4 节）                             │
│  solveIDAStarFromString / solveThistlethwaiteFromString        │
│  （内部再转 cubie，保持现有实现）                              │
└─────────────────────────────────────────────────────────────┘
```

**要点：** 「能否还原」的判定在 **仿真层** 完成：  
`solvedString === applyMovesOnCubestring(startString, solution)`（或先标准化空白与大小写）。

---

## 4. 对外 API 设计（建议）

### 4.1 契约层

| 函数（建议名） | 职责 |
|----------------|------|
| `parseCubestring(s: string): CubeState` | 54 字符 → 面状态；非法时抛错或 `Result` 类型 |
| `serializeCubeState(state: CubeState): string` | 与现有 `cubeStateToCubestring` 对齐或在其上封装 |
| `cubieFromCubestring(s: string): CubieBasedCubeState` | `parseCubestring` → 已有「面 → cubie」转换（若已有则复用） |

**约束：** `serializeCubeState(parseCubestring(s)) === s`（在规范字符串上）应作为回归测试。

### 4.2 仿真层（测试核心）

| 函数 | 职责 |
|------|------|
| `applyMoveToCubeState(state: CubeState, m: Move): CubeState` | 可复用 `cubeLogic.applyMove` |
| `applyMovesToCubestring(start: string, moves: Move[]): string` | 组合上述 + 序列化 |

**性质测试（单元测试）：**

- 对任意合法 `start`（从已解串经已知步得到）、任意 `m ∈ {R,U,…}`：`applyMovesToCubestring(applyMovesToCubestring(start, [m]), [inverse(m)]) === start`。
- **恒等：** `R R'`、`L L'`、`U U'`、`F F'`、`D D'`、`B B'` 在已解串上执行后仍为已解串。

### 4.3 求解层（渐进迁移）

**阶段 A（当前）：**  
`solveByIDAStar(cubie)`、`thistlethwaiteSolve(cubie)` 不变。

**阶段 B（推荐对外形态）：**

```ts
// 伪代码：名称可调整
async function solveIDAStarFromCubestring(s: string, options?: …): Promise<Move[]>
async function solveThistlethwaiteFromCubestring(s: string, options?: …): Promise<Move[]>
```

**内部实现：** `const cubie = cubieFromCubestring(s); return await solveByIDAStar(cubie, …)`，避免两套逻辑。

**验收函数（给测试用）：**

```ts
function assertSolutionRestoresSolved(start: string, moves: Move[]): void {
  const solved = SOLVED_CUBESTRING // 常量
  const after = applyMovesToCubestring(start, moves)
  expect(normalize(after)).toBe(normalize(solved))
}
```

---

## 5. 测试策略：由浅入深（可直接写成单元测试）

### 5.1 层级 0：编解码与转动（不调用任何求解器）

- 已解串常量与 `parse` / `serialize` 往返一致。
- 单步 `R`、`R'`、`U`、… 在已解串上的结果与 **独立参考** 对比（可选：`cubing` 库或手写最小表）。
- 文档 `CUBESTRING_ISSUES.md` 中「单步 R 被 Kociemba 判无效」类问题：应在 **Codec 修正后** 用「从已解应用一步 R 得到的串」作为**金样本**，并标记为必须通过。

### 5.2 层级 1：一步还原

- 从已解串应用 **一步** `m` 得 `start`；求解器应返回 **一步** `inverse(m)`（或等价最短，策略可约定为「允许长度 1」）。
- **IDA\* / Thistlethwaite** 各跑一遍（或 `test.each`）。

### 5.3 层级 2：两步

- `start = apply(apply(solved, m1), m2)`；断言执行解后回到已解串（**不强求**与 `m2' m1'` 完全一致，除非约定最优唯一）。

### 5.4 层级 3：五步

- 随机或固定 5 步序列生成 `start`；断言 `applyMovesToCubestring(start, solution)` 为已解串。

### 5.5 层级 4：长序列 / 伪随机打乱

- 20～30 步随机；仅断言 **还原到已解**（性能超时单独设 `test.timeout` 或标记 `slow`）。

### 5.6 层级 5：与 Kociemba 交叉验证（可选）

- 同一 `start`，Kociemba 与 IDA\*（或 Thistlethwaite）各自给出一串解；**不要求步数相同**，但两者执行后都应得到已解串。用于发现「仅某一种算法路径有 bug」的情况。

---

## 6. 工程落地步骤（建议顺序）

1. **引入测试运行器** — 已完成：`vitest`，`npm run test` / `test:run`。
2. **`cubestringCodec.ts`** — `parseCubestring`、`applyMovesToCubestring`、`cubieFromCubestring`、`cubieBasedStateToCanonicalCubestring`、`serializeCubeState` 再导出。
3. **修复 / 对齐 CUBESTRING** — 仍见 `CUBESTRING_ISSUES.md`；层级 0 测试覆盖编解码与转动恒等。
4. **`solverFromCubestring.ts`** — `solveIDAStarFromCubestring`、`solveThistlethwaiteFromCubestring`（可选 `ThistlethwaiteSearchTuning`）。
5. **重命名混淆 API** — 已完成：`solveByCubeSolverKociemba`（`cube-solver` + cubestring）。
6. **`solveCube`** — `ida-star` / `thistlethwaite` 分支经 `cubieBasedStateToCanonicalCubestring` → `cubieFromCubestring` 再求解，与契约层一致。

---

## 7. 风险与依赖

| 风险 | 缓解 |
|------|------|
| Codec 未与 Kociemba 完全一致 | 层级 0 金样本 + 与 `kociemba-wasm` 输入串互测 |
| 自研算法超时 | 测试中降低深度/结点上限；长用例标记 `slow` 或仅 CI 夜间跑 |
| 异步求解 | Vitest 中 `await` 即可；与现有 `async` 求解器一致 |

---

## 8. 验收标准（里程碑）

- [x] **层级 0（部分）**：已引入 Vitest（`npm run test` / `npm run test:run`），并实现 `src/utils/cubestringCodec.ts`（`cubestringToCubeState`、`applyMovesToCubestring`、`SOLVED_CUBESTRING`）与 `src/utils/cubestringCodec.test.ts`（编解码往返、基本转动恒等）。
- [ ] 层级 1～3：`solverFromCubestring.test.ts` 内 **`describe.skip` 默认关闭**耗时用例；去掉 `.skip` 后本地跑 `npm run test:run`；CI 可选。
- [ ] 层级 4～5 至少本地可跑通，CI 可选。
- [x] `CUBESTRING_ISSUES.md`「下一步」已指向 `cubestringCodec` 与 `cubestringCodec.test.ts`。
- [x] README：**算法验证以 cubestring + 单元测试为准**（见 *Algorithm verification* 小节）。

---

## 9. 文档维护

- 本文档与 `CUBESTRING_ISSUES.md` 同步更新：Codec 变更时更新「单一事实来源」小节与测试层级说明。
