import { describe, expect, it } from 'vitest'
import type { Move } from './cubeTypes'
import {
  SOLVED_CUBESTRING,
  applyMovesToCubestring,
} from './cubestringCodec'
import { solveThistlethwaiteFromCubestring } from './solverFromCubestring'

const REAL_TUNING = {
  bfsMaxNodes: 1_000_000,
  phase01TimeoutMs: 20_000,
  phase01MaxNodes: 1_000_000,
  phase01RetryTimeoutMs: 0,
  phase01RetryMaxNodes: 0,
  phase12TimeoutMs: 30_000,
  phase12MaxNodes: 1_500_000,
  phase12RetryTimeoutMs: 0,
  phase12RetryMaxNodes: 0,
  stage23TimeoutMs: 30_000,
  stage34TimeoutFirstMs: 30_000,
  stage34TimeoutRetryMs: 0,
} as const

async function expectThistlethwaiteRestores(scramble: Move[]): Promise<void> {
  const start = applyMovesToCubestring(SOLVED_CUBESTRING, scramble)
  const solution = await solveThistlethwaiteFromCubestring(start, 8, REAL_TUNING)
  expect(solution.length).toBeGreaterThan(0)
  expect(applyMovesToCubestring(start, solution)).toBe(SOLVED_CUBESTRING)
}

describe('real Thistlethwaite search', () => {
  it('restores five moves without dispatcher fallback', async () => {
    await expectThistlethwaiteRestores(['R', "U'", 'F2', 'D', 'L2'])
  }, 45_000)

  it('restores app-style 25 moves without dispatcher fallback', async () => {
    await expectThistlethwaiteRestores([
      'R', "U'", 'L', 'F', "B'", 'D',
      "R'", 'U', 'F', "L'", 'B', "D'",
      'R', 'F', "U'", 'L', "B'", 'D',
      "F'", 'R', "L'", 'U', "D'", 'B', "R'",
    ])
  }, 120_000)
})
