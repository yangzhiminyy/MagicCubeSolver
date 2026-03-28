import type { Move } from './cubeTypes'
import { cubieFromCubestring } from './cubestringCodec'
import {
  solveByIDAStar,
  IDA_STAR_MAX_NODES,
  IDA_STAR_YIELD_EVERY_NODES,
} from './cubeSolver'
import {
  solveByThistlethwaite,
  type ThistlethwaiteSearchTuning,
} from './thistlethwaite'

export type { ThistlethwaiteSearchTuning }

export type SolveIDAStarFromStringOptions = {
  maxDepth?: number
  maxNodes?: number
  yieldEvery?: number
  maxWallMs?: number
}

/**
 * 以 Kociemba cubestring 为输入调用 IDA*（内部转为 cubie）。
 */
export async function solveIDAStarFromCubestring(
  cubestring: string,
  options?: SolveIDAStarFromStringOptions
): Promise<Move[]> {
  const cubie = cubieFromCubestring(cubestring)
  return solveByIDAStar(
    cubie,
    options?.maxDepth ?? 20,
    options?.maxNodes ?? IDA_STAR_MAX_NODES,
    options?.yieldEvery ?? IDA_STAR_YIELD_EVERY_NODES,
    false,
    options?.maxWallMs
  )
}

/**
 * 以 Kociemba cubestring 为输入调用自研四阶段 Thistlethwaite（内部转为 cubie）。
 */
export async function solveThistlethwaiteFromCubestring(
  cubestring: string,
  maxDepthPerStage: number = 8,
  searchTuning?: ThistlethwaiteSearchTuning
): Promise<Move[]> {
  return solveByThistlethwaite(
    cubieFromCubestring(cubestring),
    maxDepthPerStage,
    undefined,
    searchTuning
  )
}
