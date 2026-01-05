/**
 * CameraInputModal 组件
 * 摄像头录入魔方状态的模态框
 */

import { useState, useRef, useEffect } from 'react'
import { Face, FaceColor } from '../utils/cubeTypes'
import { CubeInputState, createEmptyInputState, inputStateToCubeState, isInputStateComplete } from '../utils/cubeInputConverter'
import { requestCamera, stopCamera, recognizeFaceColors } from '../utils/cameraColorRecognition'
import FaceInput from './FaceInput'
import './CameraInputModal.css'

interface CameraInputModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (cubeState: ReturnType<typeof inputStateToCubeState>) => void
}

const FACE_ORDER: Face[] = ['U', 'D', 'F', 'B', 'L', 'R']
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
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const currentFace = FACE_ORDER[currentFaceIndex]

  // 初始化摄像头
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

  // 清理摄像头
  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera(stream)
      }
    }
  }, [stream])

  const handleCapture = () => {
    if (!videoRef.current) return

    const video = videoRef.current

    // 计算识别区域（假设魔方在画面中心，占据一定比例）
    const faceWidth = Math.min(video.videoWidth, video.videoHeight) * 0.6
    const faceHeight = faceWidth
    const offsetX = (video.videoWidth - faceWidth) / 2
    const offsetY = (video.videoHeight - faceHeight) / 2

    // 识别颜色
    const { colors, confidence } = recognizeFaceColors(video, faceWidth, faceHeight, offsetX, offsetY)

    // 更新输入状态
    setInputState(prev => ({
      faces: {
        ...prev.faces,
        [currentFace]: {
          ...prev.faces[currentFace],
          colors,
          confidence,
          isComplete: true,
        },
      },
    }))

    setIsCapturing(false)
  }

  const handleColorChange = (row: number, col: number, color: FaceColor) => {
    setInputState(prev => {
      const newColors = prev.faces[currentFace].colors.map((r, rIdx) =>
        rIdx === row
          ? r.map((c, cIdx) => (cIdx === col ? color : c))
          : r
      )
      return {
        faces: {
          ...prev.faces,
          [currentFace]: {
            ...prev.faces[currentFace],
            colors: newColors,
          },
        },
      }
    })
  }

  const handleFaceComplete = () => {
    setInputState(prev => ({
      faces: {
        ...prev.faces,
        [currentFace]: {
          ...prev.faces[currentFace],
          isComplete: true,
        },
      },
    }))
  }

  const handleNextFace = () => {
    if (currentFaceIndex < FACE_ORDER.length - 1) {
      setCurrentFaceIndex(currentFaceIndex + 1)
    }
  }

  const handlePrevFace = () => {
    if (currentFaceIndex > 0) {
      setCurrentFaceIndex(currentFaceIndex - 1)
    }
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

  const progress = (currentFaceIndex + 1) / FACE_ORDER.length * 100
  const allComplete = isInputStateComplete(inputState)

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <div className="camera-modal-header">
          <h2>摄像头录入魔方状态</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="camera-modal-content">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            <span className="progress-text">{currentFaceIndex + 1} / {FACE_ORDER.length}</span>
          </div>

          <div className="camera-section">
            <h3>当前录入: {FACE_LABELS[currentFace]}</h3>
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {isCapturing && (
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
              )}
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
          </div>

          <div className="face-input-section">
            <FaceInput
              faceState={inputState.faces[currentFace]}
              onColorChange={handleColorChange}
              onComplete={handleFaceComplete}
            />
          </div>

          <div className="navigation">
            <button
              className="btn btn-secondary"
              onClick={handlePrevFace}
              disabled={currentFaceIndex === 0}
            >
              上一个面
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNextFace}
              disabled={currentFaceIndex === FACE_ORDER.length - 1}
            >
              下一个面
            </button>
          </div>
        </div>

        <div className="camera-modal-footer">
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
  )
}
