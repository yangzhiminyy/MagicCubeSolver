import { describe, it, expect } from 'vitest'
import type { Move } from './cubeTypes'
import { createSolvedCube } from './cubeLogic'
import { cubeStateToCubestring } from './cubeConverter'
import {
  SOLVED_CUBESTRING,
  cubestringToCubeState,
  parseCubestring,
  applyMovesToCubestring,
} from './cubestringCodec'

describe('cubestringCodec（层级 0：编解码与面模型转动）', () => {
  it('已解串常量与 createSolvedCube 序列化一致', () => {
    expect(cubeStateToCubestring(createSolvedCube())).toBe(SOLVED_CUBESTRING)
  })

  it('parse(serialize(solved)) 往返为同一串', () => {
    const state = createSolvedCube()
    const s = cubeStateToCubestring(state)
    expect(cubeStateToCubestring(cubestringToCubeState(s))).toBe(s)
  })

  it('parseCubestring 与 cubestringToCubeState 等价', () => {
    expect(JSON.stringify(parseCubestring(SOLVED_CUBESTRING))).toBe(
      JSON.stringify(cubestringToCubeState(SOLVED_CUBESTRING))
    )
  })

  it('trim 后解析 54 位', () => {
    const spaced = `  ${SOLVED_CUBESTRING}  `
    expect(cubeStateToCubestring(cubestringToCubeState(spaced))).toBe(SOLVED_CUBESTRING)
  })

  const basicMoves: Move[] = ['R', 'L', 'U', 'D', 'F', 'B']

  it.each(basicMoves)('已解态 %s 再 %s\' 仍为已解串', (m) => {
    const inv = `${m}'` as Move
    const out = applyMovesToCubestring(SOLVED_CUBESTRING, [m, inv])
    expect(out).toBe(SOLVED_CUBESTRING)
  })

  it.each(basicMoves)('已解态 %s2 两次等价于还原（四次四分之一转）', (m) => {
    const double = `${m}2` as Move
    const out = applyMovesToCubestring(SOLVED_CUBESTRING, [double, double])
    expect(out).toBe(SOLVED_CUBESTRING)
  })

  it('单步 R 再 R\' 回到已解', () => {
    const mid = applyMovesToCubestring(SOLVED_CUBESTRING, ['R'])
    expect(applyMovesToCubestring(mid, ["R'"])).toBe(SOLVED_CUBESTRING)
  })
})
