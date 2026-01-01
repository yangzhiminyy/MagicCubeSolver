import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CubeState } from '../utils/cubeTypes'
import Cubie from './Cubie'

interface RubiksCubeProps {
  cubeState: CubeState
}

export default function RubiksCube({ cubeState }: RubiksCubeProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      // 可以在这里添加旋转动画
    }
  })

  const cubies = []
  const size = 1
  const spacing = 1.02 // 小块之间的间距

  // 生成27个小块（3x3x3）
  // 坐标系：x向右，y向上，z向前
  // 面索引：U/D: row从上到下(0-2), col从左到右(0-2)
  //        F/B: row从上到下(0-2), col从左到右(0-2) (B面是镜像的)
  //        R/L: row从上到下(0-2), col从后到前(0-2) (L面是镜像的)
  
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // 确定这个小块应该在哪些面上显示颜色
        // 将3D坐标转换为面的行列索引
        const positions = {
          // F面：z=1，row=1-y(0-2)，col=x+1(0-2)
          front: z === 1 ? cubeState.F[1 - y][x + 1] : null,
          // B面：z=-1，row=1-y(0-2)，col=1-x(镜像，0-2)
          back: z === -1 ? cubeState.B[1 - y][1 - x] : null,
          // U面：y=1，row=z+1(0-2)，col=x+1(0-2)
          // 当z=1时（F面），row=2（U面的第三行，靠近F面）
          // 当z=-1时（B面），row=0（U面的第一行，靠近B面）
          top: y === 1 ? cubeState.U[z + 1][x + 1] : null,
          // D面：y=-1，row=1-z(0-2)，col=x+1(0-2)
          // 当z=1时（F面），row=0（D面的第一行，靠近F面）
          // 当z=-1时（B面），row=2（D面的第三行，靠近B面）
          bottom: y === -1 ? cubeState.D[1 - z][x + 1] : null,
          // R面：x=1，row=1-y(0-2)，col=1-z(0-2)
          right: x === 1 ? cubeState.R[1 - y][1 - z] : null,
          // L面：x=-1，row=1-y(0-2)，col=z+1(0-2)
          left: x === -1 ? cubeState.L[1 - y][z + 1] : null,
        }

        cubies.push(
          <Cubie
            key={`${x}-${y}-${z}`}
            position={[x * spacing, y * spacing, z * spacing]}
            colors={positions}
            size={size}
          />
        )
      }
    }
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {cubies}
    </group>
  )
}
