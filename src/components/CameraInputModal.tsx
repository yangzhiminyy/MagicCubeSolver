/**
 * CameraInputModal 组件
 * 摄像头录入魔方状态的模态框（展开图式）
 */

import { useState, useRef, useEffect } from 'react'
import { Face, FaceColor } from '../utils/cubeTypes'
import { CubeInputState, createEmptyInputState, inputStateToCubeState, isInputStateComplete, isFaceComplete } from '../utils/cubeInputConverter'
import { requestCamera, stopCamera, recognizeFaceColors } from '../utils/cameraColorRecognition'
import CubeNetInput from './CubeNetInput'
import './CameraInputModal.css'

interface CameraInputModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (cubeState: ReturnType<typeof inputStateToCubeState>) => void
}

const FACE_LABELS: Record<Face, string> = {
  U: '上 (U)',
  D: '下 (D)',
  F: '前 (F)',
  B: '后 (B)',
  L: '左 (L)',
  R: '右 (R)',
}

export default function CameraInputModal({ isOpen, onClose, onComplete }: CameraInputModalProps) {
  const [inputState, setInputState] = useState<CubeInputState>(createEmptyInputState())
  const [activeFace, setActiveFace] = useState<Face | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 初始化摄像头（当模态框打开时）
  useEffect(() => {
    if (isOpen && !stream) {
      requestCamera()
        .then(s => {
          setStream(s)
          if (videoRef.current) {
            videoRef.current.srcObject = s
          }
        })
        .catch(error => {
          console.error('无法访问摄像头:', error)
          alert('无法访问摄像头，请检查权限设置')
        })
    }

    return () => {
      if (stream) {
        stopCamera(stream)
        setStream(null)
      }
    }
  }, [isOpen, stream])

  // 当激活面改变时，确保视频流正确显示
  useEffect(() => {
    if (activeFace && stream && videoRef.current) {
      if (!videoRef.current.srcObject) {
        videoRef.current.srcObject = stream
      }
    }
  }, [activeFace, stream])

  // 清理摄像头
  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera(stream)
      }
    }
  }, [stream])

  const handleFaceActivate = (face: Face) => {
    setActiveFace(face)
  }

  const handleCapture = () => {
    if (!videoRef.current || !activeFace) return

    const video = videoRef.current

    // 计算识别区域（假设魔方在画面中心，占据一定比例）
    const faceWidth = Math.min(video.videoWidth, video.videoHeight) * 0.6
    const faceHeight = faceWidth
    const offsetX = (video.videoWidth - faceWidth) / 2
    const offsetY = (video.videoHeight - faceHeight) / 2

    // 识别颜色（由于视频显示时镜像了，识别时需要镜像x坐标）
    const { colors, confidence } = recognizeFaceColors(video, faceWidth, faceHeight, offsetX, offsetY, true)

    // 更新输入状态
    setInputState(prev => ({
      faces: {
        ...prev.faces,
        [activeFace]: {
          ...prev.faces[activeFace],
          colors,
          confidence,
          isComplete: true,
        },
      },
    }))

    setIsCapturing(false)
  }

  const handleColorChange = (face: Face, row: number, col: number, color: FaceColor) => {
    // 中心块不允许修改
    if (row === 1 && col === 1) return

    setInputState(prev => {
      const newColors = prev.faces[face].colors.map((r, rIdx) =>
        rIdx === row
          ? r.map((c, cIdx) => (cIdx === col ? color : c))
          : r
      )
      
      const updatedFace = {
        ...prev.faces[face],
        colors: newColors,
      }
      
      // 检查该面是否完成（所有边缘块都不是black）
      const faceComplete = isFaceComplete(updatedFace)
      
      return {
        faces: {
          ...prev.faces,
          [face]: {
            ...updatedFace,
            isComplete: faceComplete,
          },
        },
      }
    })
  }

  const handleFinish = () => {
    if (isInputStateComplete(inputState)) {
      const cubeState = inputStateToCubeState(inputState)
      onComplete(cubeState)
      onClose()
    } else {
      alert('请完成所有面的录入')
    }
  }

  if (!isOpen) return null

  const allComplete = isInputStateComplete(inputState)
  const completedCount = Object.values(inputState.faces).filter(f => f.isComplete).length

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <div className="camera-modal-header">
          <h2>摄像头录入魔方状态</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="camera-modal-content">
          <div className="camera-net-layout">
            {/* 左侧：展开图 */}
            <div className="cube-net-section">
              <CubeNetInput
                inputState={inputState}
                activeFace={activeFace}
                onFaceActivate={handleFaceActivate}
                onColorChange={handleColorChange}
              />
            </div>

            {/* 右侧：摄像头预览 */}
            <div className="camera-section">
              {activeFace ? (
                <>
                  <h3>当前录入: {FACE_LABELS[activeFace]}</h3>
                  <div className="video-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-video"
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="capture-overlay">
                      <div className="capture-grid">
                        {Array(3).fill(0).map((_, row) => (
                          <div key={row} className="capture-row">
                            {Array(3).fill(0).map((_, col) => (
                              <div key={col} className="capture-cell"></div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="camera-controls">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setIsCapturing(true)
                        setTimeout(handleCapture, 100) // 短暂延迟以确保画面稳定
                      }}
                      disabled={isCapturing}
                    >
                      {isCapturing ? '识别中...' : '识别颜色'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="camera-placeholder">
                  <p>👆 点击任意面的中心块开始录入</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="camera-modal-footer">
          <div className="progress-info">
            进度: {completedCount} / 6 已完成
          </div>
          <div className="footer-buttons">
            <button className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={!allComplete}
            >
              完成录入
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
