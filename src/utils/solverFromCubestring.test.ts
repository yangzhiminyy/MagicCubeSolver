import { describe, it, expect } from 'vitest'
import type { Move } from './cubeTypes'
import { createSolvedCubieBasedCube, applyMove } from './cubieBasedCubeLogic'
import { cubieBasedStateToFaceColors } from './cubieBasedCubeLogic'
import {
  SOLVED_CUBESTRING,
  applyMovesToCubestring,
  cubieFromCubestring,
} from './cubestringCodec'
import { cubeStatesEqual } from './idaStarHelpers'
import {
  solveIDAStarFromCubestring,
  solveThistlethwaiteFromCubestring,
  type ThistlethwaiteSearchTuning,
} from './solverFromCubestring'

/** 单元测试用：阶段 3→4 BFS 结点较多，放宽默认 120k/60s 以免返回不完整解 */
const THISTLE_TEST_TUNING: ThistlethwaiteSearchTuning = {
  bfsMaxNodes: 900_000,
  stage23TimeoutMs: 90_000,
  stage34TimeoutFirstMs: 180_000,
  stage34TimeoutRetryMs: 300_000,
}

/** 测试用：略小的结点预算与 wall time，浅层打乱仍应可解 */
const IDA_TEST_OPTS = {
  maxDepth: 24,
  maxNodes: 4_000_000,
  maxWallMs: 120_000,
} as const

describe('solverFromCubestring', () => {
  it('cubieFromCubestring 与面模型单步扰动一致', () => {
    let cubie = createSolvedCubieBasedCube()
    cubie = applyMove(cubie, 'R')
    const fromCubeString = cubieFromCubestring(
      applyMovesToCubestring(SOLVED_CUBESTRING, ['R'])
    )
    expect(
      cubeStatesEqual(
        cubieBasedStateToFaceColors(cubie),
        cubieBasedStateToFaceColors(fromCubeString)
      )
    ).toBe(true)
  })

  /**
   * 层级 1～3：调用真实 IDA* / Thistlethwaite，耗时与阶段 3→4 BFS 预算相关。
   * 默认跳过；需要验收时再去掉 `.skip` 并运行 `npm run test:run`（见 `doc/SOLVER_REFACTOR_AND_TEST_PLAN.md` §8）。
   */
  describe.skip.each([
    {
      label: '1 步',
      moves: ['R'] as Move[],
    },
    {
      label: '2 步',
      moves: ['R', 'U'] as Move[],
    },
    {
      label: '5 步',
      moves: ['R', "U'", 'F2', 'D', 'L2'] as Move[],
    },
  ])('打乱 $label → 解法验收（层级 1～3）', ({ moves }) => {
    const start = (): string => applyMovesToCubestring(SOLVED_CUBESTRING, moves)

    it(
      'IDA*（FromCubestring）执行解后回到已解串',
      async () => {
        const s = start()
        const solution = await solveIDAStarFromCubestring(s, { ...IDA_TEST_OPTS })
        expect(applyMovesToCubestring(s, solution)).toBe(SOLVED_CUBESTRING)
      },
      180_000
    )

    it(
      'Thistlethwaite（FromCubestring）执行解后回到已解串',
      async () => {
        const s = start()
        const solution = await solveThistlethwaiteFromCubestring(s, 8, THISTLE_TEST_TUNING)
        expect(applyMovesToCubestring(s, solution)).toBe(SOLVED_CUBESTRING)
      },
      300_000
    )
  })
})
