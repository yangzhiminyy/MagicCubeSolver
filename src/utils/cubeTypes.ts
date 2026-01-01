export type FaceColor = 'white' | 'yellow' | 'red' | 'orange' | 'green' | 'blue'

export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R'

export type Move = 
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2'
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'

export interface CubeState {
  // 每个面是一个3x3的数组，存储颜色
  U: FaceColor[][]
  D: FaceColor[][]
  F: FaceColor[][]
  B: FaceColor[][]
  L: FaceColor[][]
  R: FaceColor[][]
}

export const FACE_COLORS: Record<Face, FaceColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'green',
  R: 'blue',
}
