import { describe, expect, it } from 'vitest'
import { Cube, solve as kociembaSolve } from 'kociemba-wasm'
import type { Move } from './cubeTypes'
import {
  SOLVED_CUBESTRING,
  applyMovesToCubestring,
  cubieFromCubestring,
  cubieBasedStateToCanonicalCubestring,
} from './cubestringCodec'
import {
  solveByIDAStar,
  solveByReverseMoves,
  solveCube as solveCubeByDispatcher,
} from './cubeSolver'
import { kociembaStringToMoves, solveCube as solveCubeByKociemba } from './cubeConverter'
import { applyMove as applyCubieMove, createSolvedCubieBasedCube } from './cubieBasedCubeLogic'

const BASIC_MOVES = ['F', 'B', 'L', 'R', 'U', 'D'] as const
const APP_SCRAMBLE_MOVES: Move[] = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"]

function kociembaCubeAfter(move: (typeof BASIC_MOVES)[number]): string {
  const cube = new Cube()
  cube.reset()
  cube.action(move)
  return cube.toString()
}

function applyCubieMovesToCubestring(moves: readonly Move[]): string {
  let state = createSolvedCubieBasedCube()
  for (const move of moves) {
    state = applyCubieMove(state, move)
  }
  return cubieBasedStateToCanonicalCubestring(state)
}

function normalizeForDeepEqual<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function deterministicAppScramble(seed: number, length = 25): Move[] {
  let x = seed >>> 0
  const moves: Move[] = []
  for (let i = 0; i < length; i++) {
    x = (1664525 * x + 1013904223) >>> 0
    moves.push(APP_SCRAMBLE_MOVES[x % APP_SCRAMBLE_MOVES.length])
  }
  return moves
}

async function expectCubieSolverRestores(
  scramble: readonly Move[],
  solver: (start: ReturnType<typeof createSolvedCubieBasedCube>) => Promise<Move[]>
): Promise<void> {
  let start = createSolvedCubieBasedCube()
  for (const move of scramble) {
    start = applyCubieMove(start, move)
  }

  const solution = await solver(start)
  for (const move of solution) {
    start = applyCubieMove(start, move)
  }

  expect(cubieBasedStateToCanonicalCubestring(start)).toBe(SOLVED_CUBESTRING)
}

describe('solver validation diagnostics', () => {
  it.each(BASIC_MOVES)(
    'facelet applyMove(%s) matches kociemba-wasm Cube.action(%s)',
    (move) => {
      expect(applyMovesToCubestring(SOLVED_CUBESTRING, [move])).toBe(
        kociembaCubeAfter(move)
      )
    }
  )

  it.each(BASIC_MOVES)('kociemba-wasm solves one %s turn under local move semantics', async (move) => {
    const start = applyMovesToCubestring(SOLVED_CUBESTRING, [move])
    const solution = kociembaStringToMoves(await kociembaSolve(start))
    expect(applyMovesToCubestring(start, solution)).toBe(SOLVED_CUBESTRING)
  })

  it('IDA* solves a one-turn cubestring state under local move semantics', async () => {
    const start = applyMovesToCubestring(SOLVED_CUBESTRING, ['R'])
    const solution = await solveByIDAStar(cubieFromCubestring(start), 4, 100_000, 0, false, 10_000)
    expect(solution.length).toBeGreaterThan(0)
    expect(applyMovesToCubestring(start, solution as Move[])).toBe(SOLVED_CUBESTRING)
  })

  it.each(BASIC_MOVES)('cubie applyMove(%s) matches facelet/Kociemba move semantics', (move) => {
    expect(applyCubieMovesToCubestring([move])).toBe(
      applyMovesToCubestring(SOLVED_CUBESTRING, [move])
    )
  })

  it('cubie applyMove matches facelet semantics for a mixed scramble', () => {
    const scramble: Move[] = ['R', "U'", 'F2', 'D', 'L2', 'B']
    expect(applyCubieMovesToCubestring(scramble)).toBe(
      applyMovesToCubestring(SOLVED_CUBESTRING, scramble)
    )
  })

  it.each(BASIC_MOVES)(
    'cubieFromCubestring(scramble) then applyMove(%s) matches facelet semantics',
    (move) => {
      const scramble: Move[] = ['R', "U'", 'F2', 'D', 'L2']
      const start = applyMovesToCubestring(SOLVED_CUBESTRING, scramble)
      const cubie = applyCubieMove(cubieFromCubestring(start), move)

      expect(cubieBasedStateToCanonicalCubestring(cubie)).toBe(
        applyMovesToCubestring(start, [move])
      )
    }
  )

  it('cubieFromCubestring state returns to exact solved cubie colors after known inverse', () => {
    const scramble: Move[] = ['R', "U'", 'F2', 'D', 'L2']
    const inverse: Move[] = ['L2', "D'", 'F2', 'U', "R'"]
    let cubie = cubieFromCubestring(applyMovesToCubestring(SOLVED_CUBESTRING, scramble))
    for (const move of inverse) {
      cubie = applyCubieMove(cubie, move)
    }

    expect(normalizeForDeepEqual(cubie)).toEqual(createSolvedCubieBasedCube())
  })

  it('cubeConverter Kociemba solution restores a cubie-applied scramble', async () => {
    await expectCubieSolverRestores(['R', 'U', 'F'], (start) => solveCubeByKociemba(start))
  })

  it('cubeSolver dispatcher Kociemba solution restores a cubie-applied scramble', async () => {
    await expectCubieSolverRestores(['R', 'U', 'F'], (start) =>
      solveCubeByDispatcher(start, 'kociemba')
    )
  })

  it(
    'cubeSolver dispatcher Kociemba restores an app-style 25-turn scramble',
    async () => {
      const scramble: Move[] = [
        'R', "U'", 'L', 'F', "B'", 'D',
        "R'", 'U', 'F', "L'", 'B', "D'",
        'R', 'F', "U'", 'L', "B'", 'D',
        "F'", 'R', "L'", 'U', "D'", 'B', "R'",
      ]

      await expectCubieSolverRestores(scramble, (start) =>
        solveCubeByDispatcher(start, 'kociemba')
      )
    },
    20_000
  )

  it(
    'cubeSolver dispatcher Thistlethwaite restores an app-style 25-turn scramble without reverse fallback',
    async () => {
      const scramble: Move[] = [
        'R', "U'", 'L', 'F', "B'", 'D',
        "R'", 'U', 'F', "L'", 'B', "D'",
        'R', 'F', "U'", 'L', "B'", 'D',
        "F'", 'R', "L'", 'U', "D'", 'B', "R'",
      ]

      let start = createSolvedCubieBasedCube()
      for (const move of scramble) {
        start = applyCubieMove(start, move)
      }

      const solution = await solveCubeByDispatcher(start, 'thistlethwaite', scramble)
      expect(solution).not.toEqual(solveByReverseMoves(scramble))

      let restored = start
      for (const move of solution) {
        restored = applyCubieMove(restored, move)
      }
      expect(cubieBasedStateToCanonicalCubestring(restored)).toBe(SOLVED_CUBESTRING)
    },
    20_000
  )

  it(
    'cubeSolver dispatcher Thistlethwaite restores deterministic UI random scrambles',
    async () => {
      for (const seed of [1, 7, 42]) {
        const scramble = deterministicAppScramble(seed)
        await expectCubieSolverRestores(scramble, (start) =>
          solveCubeByDispatcher(start, 'thistlethwaite', scramble)
        )
      }
    },
    60_000
  )

  it(
    'cubeSolver dispatcher IDA* restores a known app-style 25-turn scramble without history fallback',
    async () => {
      const scramble: Move[] = [
        'R', "U'", 'L', 'F', "B'", 'D',
        "R'", 'U', 'F', "L'", 'B', "D'",
        'R', 'F', "U'", 'L', "B'", 'D',
        "F'", 'R', "L'", 'U', "D'", 'B', "R'",
      ]

      let start = createSolvedCubieBasedCube()
      for (const move of scramble) {
        start = applyCubieMove(start, move)
      }

      const solution = await solveCubeByDispatcher(start, 'ida-star', scramble)
      expect(solution).not.toEqual(solveByReverseMoves(scramble))

      let restored = start
      for (const move of solution) {
        restored = applyCubieMove(restored, move)
      }
      expect(cubieBasedStateToCanonicalCubestring(restored)).toBe(SOLVED_CUBESTRING)
    },
    120_000
  )

  it(
    'cubeSolver dispatcher IDA* restores deterministic UI random scrambles without history fallback',
    async () => {
      for (const seed of [1, 7, 42]) {
        const scramble = deterministicAppScramble(seed)
        let start = createSolvedCubieBasedCube()
        for (const move of scramble) {
          start = applyCubieMove(start, move)
        }

        const solution = await solveCubeByDispatcher(start, 'ida-star', scramble)
        expect(solution).not.toEqual(solveByReverseMoves(scramble))

        let restored = start
        for (const move of solution) {
          restored = applyCubieMove(restored, move)
        }
        expect(cubieBasedStateToCanonicalCubestring(restored)).toBe(SOLVED_CUBESTRING)
      }
    },
    120_000
  )

  it('IDA* restores a two-turn cubestring state under local move semantics', async () => {
    const scramble: Move[] = ['R', 'U']
    const start = applyMovesToCubestring(SOLVED_CUBESTRING, scramble)
    const solution = await solveByIDAStar(cubieFromCubestring(start), 6, 500_000, 0, false, 10_000)
    expect(solution.length).toBeGreaterThan(0)
    expect(applyMovesToCubestring(start, solution as Move[])).toBe(SOLVED_CUBESTRING)
  })

  it('IDA* accepts solutions exactly at maxDepth', async () => {
    const scramble: Move[] = ['R', 'U']
    const start = applyMovesToCubestring(SOLVED_CUBESTRING, scramble)
    const solution = await solveByIDAStar(cubieFromCubestring(start), 2, 100_000, 0, false, 10_000)
    expect(solution.length).toBe(2)
    expect(applyMovesToCubestring(start, solution as Move[])).toBe(SOLVED_CUBESTRING)
  })

  it(
    'IDA* restores a five-turn cubestring state under local move semantics',
    async () => {
      const scramble: Move[] = ['R', "U'", 'F2', 'D', 'L2']
      const start = applyMovesToCubestring(SOLVED_CUBESTRING, scramble)
      const solution = await solveByIDAStar(cubieFromCubestring(start), 12, 4_000_000, 0, false, 30_000)
      expect(solution.length).toBeGreaterThan(0)
      expect(applyMovesToCubestring(start, solution as Move[])).toBe(SOLVED_CUBESTRING)
    },
    35_000
  )
})
