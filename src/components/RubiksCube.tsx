import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CubeState } from '../utils/cubeTypes'
import { AnimationState } from '../utils/cubeAnimation'
import Cubie from './Cubie'

interface RubiksCubeProps {
  cubeState: CubeState
  animationState: AnimationState | null
  showCoordinates: {
    U: boolean
    D: boolean
    F: boolean
    B: boolean
    L: boolean
    R: boolean
  }
}

export default function RubiksCube({ cubeState, animationState, showCoordinates }: RubiksCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const cubieRefs = useRef<Map<string, THREE.Group>>(new Map())
  
  // 动画速度（每秒旋转的弧度）
  const ANIMATION_SPEED = Math.PI * 2 // 每秒旋转一圈（360度）
  
  useFrame((_state, delta) => {
    if (animationState && animationState.isAnimating && animationState.axis && animationState.affectedCubies && animationState.rotationCenter) {
      // 更新动画进度
      const progressDelta = (ANIMATION_SPEED * delta) / Math.abs(animationState.angle)
      const newProgress = Math.min(animationState.progress + progressDelta, 1)
      
      // 计算当前旋转角度
      const currentAngle = animationState.angle * newProgress
      
      const spacing = 1.02
      const rotationCenter = animationState.rotationCenter
      
      // 旋转受影响的 cubies（围绕旋转中心旋转）
      animationState.affectedCubies.forEach(({ x, y, z }) => {
        const key = `${x}-${y}-${z}`
        const cubieGroup = cubieRefs.current.get(key)
        if (cubieGroup && animationState.axis) {
          // 计算 cubie 的原始位置
          const originalPos: [number, number, number] = [x * spacing, y * spacing, z * spacing]
          
          // 计算相对于旋转中心的位置
          const relativePos: [number, number, number] = [
            originalPos[0] - rotationCenter[0] * spacing,
            originalPos[1] - rotationCenter[1] * spacing,
            originalPos[2] - rotationCenter[2] * spacing
          ]
          
          // 创建旋转矩阵
          const rotationMatrix = new THREE.Matrix4()
          if (animationState.axis[0] !== 0) {
            rotationMatrix.makeRotationX(currentAngle)
          } else if (animationState.axis[1] !== 0) {
            rotationMatrix.makeRotationY(currentAngle)
          } else if (animationState.axis[2] !== 0) {
            rotationMatrix.makeRotationZ(currentAngle)
          }
          
          // 应用旋转
          const rotatedPos = new THREE.Vector3(...relativePos).applyMatrix4(rotationMatrix)
          
          // 计算最终位置（旋转后加回旋转中心）
          const finalPos: [number, number, number] = [
            rotatedPos.x + rotationCenter[0] * spacing,
            rotatedPos.y + rotationCenter[1] * spacing,
            rotatedPos.z + rotationCenter[2] * spacing
          ]
          
          // 更新位置
          cubieGroup.position.set(...finalPos)
          
          // 应用旋转（让 cubie 本身也旋转，保持方向正确）
          cubieGroup.rotation.set(0, 0, 0)
          if (animationState.axis[0] !== 0) {
            cubieGroup.rotateX(currentAngle)
          } else if (animationState.axis[1] !== 0) {
            cubieGroup.rotateY(currentAngle)
          } else if (animationState.axis[2] !== 0) {
            cubieGroup.rotateZ(currentAngle)
          }
        }
      })
    } else {
      // 动画未进行时，确保所有 cubies 位置正确（重置位置）
      // 这会在动画完成后或没有动画时执行
      if (!animationState?.isAnimating) {
        const spacing = 1.02
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
              const key = `${x}-${y}-${z}`
              const cubieGroup = cubieRefs.current.get(key)
              if (cubieGroup) {
                // 重置位置和旋转
                cubieGroup.position.set(x * spacing, y * spacing, z * spacing)
                cubieGroup.rotation.set(0, 0, 0)
              }
            }
          }
        }
      }
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
        
        // ========== F面（前面，z=1，红色）==========
        // row = 1-y: y=1时row=0（第一行，靠近U面），y=-1时row=2（第三行，靠近D面）
        // col = x+1: x=-1时col=0（左列，靠近L面），x=1时col=2（右列，靠近R面）
        // 示例：F[0][0]对应(x=-1, y=1, z=1) - U面和L面的交界
        //      F[2][2]对应(x=1, y=-1, z=1) - D面和R面的交界
        const front = z === 1 ? cubeState.F[1 - y][x + 1] : null
        
        // ========== B面（后面，z=-1，橙色，镜像）==========
        // row = 1-y: y=1时row=0（第一行，靠近U面），y=-1时row=2（第三行，靠近D面）
        // col = 1-x（镜像）: x=-1时col=2（右列，靠近L面），x=1时col=0（左列，靠近R面）
        // 示例：B[0][0]对应(x=1, y=1, z=-1) - U面和R面的交界
        //      B[0][2]对应(x=-1, y=1, z=-1) - U面和L面的交界
        const back = z === -1 ? cubeState.B[1 - y][1 - x] : null
        
        // ========== U面（上面，y=1，白色）==========
        // row = z+1: z=1时row=2（第三行，靠近F面），z=-1时row=0（第一行，靠近B面）
        // col = x+1: x=-1时col=0（左列，靠近L面），x=1时col=2（右列，靠近R面）
        // 示例：U[0][0]对应(x=-1, y=1, z=-1) - B面和L面的交界
        //      U[0][2]对应(x=1, y=1, z=-1) - B面和R面的交界
        //      U[2][0]对应(x=-1, y=1, z=1) - F面和L面的交界
        //      U[2][2]对应(x=1, y=1, z=1) - F面和R面的交界
        const top = y === 1 ? cubeState.U[z + 1][x + 1] : null
        
        // ========== D面（下面，y=-1，黄色）==========
        // row = 1-z: z=1时row=0（第一行，靠近F面），z=-1时row=2（第三行，靠近B面）
        // col = x+1: x=-1时col=0（左列，靠近L面），x=1时col=2（右列，靠近R面）
        // 示例：D[0][0]对应(x=-1, y=-1, z=1) - F面和L面的交界
        //      D[0][2]对应(x=1, y=-1, z=1) - F面和R面的交界
        //      D[2][0]对应(x=-1, y=-1, z=-1) - B面和L面的交界
        //      D[2][2]对应(x=1, y=-1, z=-1) - B面和R面的交界
        const bottom = y === -1 ? cubeState.D[1 - z][x + 1] : null
        
        // ========== R面（右面，x=1，蓝色）==========
        // row = 1-y: y=1时row=0（第一行，靠近U面），y=-1时row=2（第三行，靠近D面）
        // col = 1-z: z=1时col=0（左列，靠近F面），z=-1时col=2（右列，靠近B面）
        // 示例：R[0][0]对应(x=1, y=1, z=1) - U面和F面的交界
        //      R[0][2]对应(x=1, y=1, z=-1) - U面和B面的交界
        //      R[2][0]对应(x=1, y=-1, z=1) - D面和F面的交界
        //      R[2][2]对应(x=1, y=-1, z=-1) - D面和B面的交界
        const right = x === 1 ? cubeState.R[1 - y][1 - z] : null
        
        // ========== L面（左面，x=-1，绿色）==========
        // row = 1-y: y=1时row=0（第一行，靠近U面），y=-1时row=2（第三行，靠近D面）
        // col = z+1: z=1时col=2（右列，靠近F面），z=-1时col=0（左列，靠近B面）
        // 示例：L[0][0]对应(x=-1, y=1, z=-1) - U面和B面的交界
        //      L[0][2]对应(x=-1, y=1, z=1) - U面和F面的交界
        //      L[2][0]对应(x=-1, y=-1, z=-1) - D面和B面的交界
        //      L[2][2]对应(x=-1, y=-1, z=1) - D面和F面的交界
        const left = x === -1 ? cubeState.L[1 - y][z + 1] : null
        
        const positions = {
          front,
          back,
          top,
          bottom,
          right,
          left,
        }
        
        // 计算每个面的坐标标记
        const coordinateLabels = {
          front: z === 1 ? `F[${1 - y}][${x + 1}]` : null,
          back: z === -1 ? `B[${1 - y}][${1 - x}]` : null,
          top: y === 1 ? `U[${z + 1}][${x + 1}]` : null,
          bottom: y === -1 ? `D[${1 - z}][${x + 1}]` : null,
          right: x === 1 ? `R[${1 - y}][${1 - z}]` : null,
          left: x === -1 ? `L[${1 - y}][${z + 1}]` : null,
        }

        const cubieKey = `${x}-${y}-${z}`
        // 计算初始位置（动画期间可能会改变）
        const initialPos: [number, number, number] = [x * spacing, y * spacing, z * spacing]
        
        cubies.push(
          <group
            key={cubieKey}
            ref={(ref) => {
              if (ref) {
                cubieRefs.current.set(cubieKey, ref)
                // 设置初始位置
                ref.position.set(...initialPos)
              } else {
                cubieRefs.current.delete(cubieKey)
              }
            }}
          >
            <Cubie
              position={[0, 0, 0]} // 相对于 group 的位置为 0，实际位置由 group 控制
              colors={positions}
              coordinateLabels={coordinateLabels}
              showCoordinates={showCoordinates}
              size={size}
            />
          </group>
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
