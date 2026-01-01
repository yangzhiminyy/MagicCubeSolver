import { useRef, useMemo } from 'react'
import { Mesh } from 'three'
import * as THREE from 'three'
import { FaceColor } from '../utils/cubeTypes'

interface CubieProps {
  position: [number, number, number]
  colors: {
    front: FaceColor | null
    back: FaceColor | null
    top: FaceColor | null
    bottom: FaceColor | null
    right: FaceColor | null
    left: FaceColor | null
  }
  size: number
}

const COLOR_MAP: Record<FaceColor, string> = {
  white: '#ffffff',
  yellow: '#ffd700',
  red: '#dc143c',
  orange: '#ff8c00',
  green: '#228b22',
  blue: '#4169e1',
}

export default function Cubie({ position, colors, size }: CubieProps) {
  const meshRef = useRef<Mesh>(null)

  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ 
      color: colors.right ? COLOR_MAP[colors.right] : '#333333',
      emissive: colors.right ? COLOR_MAP[colors.right] : '#000000',
      emissiveIntensity: 0.1,
    }), // 右面
    new THREE.MeshStandardMaterial({ 
      color: colors.left ? COLOR_MAP[colors.left] : '#333333',
      emissive: colors.left ? COLOR_MAP[colors.left] : '#000000',
      emissiveIntensity: 0.1,
    }), // 左面
    new THREE.MeshStandardMaterial({ 
      color: colors.top ? COLOR_MAP[colors.top] : '#333333',
      emissive: colors.top ? COLOR_MAP[colors.top] : '#000000',
      emissiveIntensity: 0.1,
    }), // 上面
    new THREE.MeshStandardMaterial({ 
      color: colors.bottom ? COLOR_MAP[colors.bottom] : '#333333',
      emissive: colors.bottom ? COLOR_MAP[colors.bottom] : '#000000',
      emissiveIntensity: 0.1,
    }), // 下面
    new THREE.MeshStandardMaterial({ 
      color: colors.front ? COLOR_MAP[colors.front] : '#333333',
      emissive: colors.front ? COLOR_MAP[colors.front] : '#000000',
      emissiveIntensity: 0.1,
    }), // 前面
    new THREE.MeshStandardMaterial({ 
      color: colors.back ? COLOR_MAP[colors.back] : '#333333',
      emissive: colors.back ? COLOR_MAP[colors.back] : '#000000',
      emissiveIntensity: 0.1,
    }), // 后面
  ], [colors])

  return (
    <mesh ref={meshRef} position={position} material={materials}>
      <boxGeometry args={[size, size, size]} />
    </mesh>
  )
}
