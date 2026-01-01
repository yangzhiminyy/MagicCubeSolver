import { useRef, useMemo } from 'react'
import { Mesh } from 'three'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
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
  coordinateLabels: {
    front: string | null
    back: string | null
    top: string | null
    bottom: string | null
    right: string | null
    left: string | null
  }
  showCoordinates: {
    U: boolean
    D: boolean
    F: boolean
    B: boolean
    L: boolean
    R: boolean
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

export default function Cubie({ position, colors, coordinateLabels, showCoordinates, size }: CubieProps) {
  const meshRef = useRef<Mesh>(null)
  const halfSize = size / 2

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
      {/* 在每个面上显示坐标标签 */}
      {coordinateLabels.front && showCoordinates.F && (
        <Html position={[0, 0, halfSize + 0.01]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 4px',
            fontSize: '10px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {coordinateLabels.front}
          </div>
        </Html>
      )}
      {coordinateLabels.back && showCoordinates.B && (
        <Html position={[0, 0, -halfSize - 0.01]} center rotation={[0, Math.PI, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 4px',
            fontSize: '10px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {coordinateLabels.back}
          </div>
        </Html>
      )}
      {coordinateLabels.top && showCoordinates.U && (
        <Html position={[0, halfSize + 0.01, 0]} center rotation={[-Math.PI / 2, 0, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 4px',
            fontSize: '10px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {coordinateLabels.top}
          </div>
        </Html>
      )}
      {coordinateLabels.bottom && showCoordinates.D && (
        <Html position={[0, -halfSize - 0.01, 0]} center rotation={[Math.PI / 2, 0, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 4px',
            fontSize: '10px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {coordinateLabels.bottom}
          </div>
        </Html>
      )}
      {coordinateLabels.right && showCoordinates.R && (
        <Html position={[halfSize + 0.01, 0, 0]} center rotation={[0, -Math.PI / 2, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 4px',
            fontSize: '10px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {coordinateLabels.right}
          </div>
        </Html>
      )}
      {coordinateLabels.left && showCoordinates.L && (
        <Html position={[-halfSize - 0.01, 0, 0]} center rotation={[0, Math.PI / 2, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 4px',
            fontSize: '10px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {coordinateLabels.left}
          </div>
        </Html>
      )}
    </mesh>
  )
}
