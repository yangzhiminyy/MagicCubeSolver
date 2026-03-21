/**
 * CameraInputModal 组件
 * 摄像头录入魔方状态的模态框（展开图式）
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Face, FaceColor } from '../utils/cubeTypes'
import { CubeInputState, createEmptyInputState, inputStateToCubeState, isInputStateComplete, isFaceComplete } from '../utils/cubeInputConverter'
import { requestCamera, stopCamera, recognizeFaceColors } from '../utils/cameraColorRecognition'
import CubeNetInput from './CubeNetInput'
import OperationInstructions from './OperationInstructions'
import './CameraInputModal.css'

interface CameraInputModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (cubeState: ReturnType<typeof inputStateToCubeState>) => void
}

export default function CameraInputModal({ isOpen, onClose, onComplete }: CameraInputModalProps) {
  const { t } = useTranslation()
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
          alert(t('camera.cameraDenied'))
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
    // 如果点击的是已激活的面，执行识别颜色
    if (activeFace === face && stream) {
      handleCapture()
    } else {
      // 第一次点击或切换面：激活该面，打开摄像头
      setActiveFace(face)
    }
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
    setIsCapturing(true)
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
      alert(t('camera.completeAllFaces'))
    }
  }

  if (!isOpen) return null

  const allComplete = isInputStateComplete(inputState)
  const completedCount = Object.values(inputState.faces).filter(f => f.isComplete).length

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <div className="camera-modal-header">
          <h2>{t('camera.modalTitle')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="camera-modal-content">
          <div className="camera-net-layout">
            {/* 左侧：展开图 */}
            <div className="cube-net-section">
              <OperationInstructions />
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
                  <h3>{t('camera.currentFace', { face: t(`faces.${activeFace}`) })}</h3>
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
                    <div className="camera-hint">
                      {t('camera.hint')}
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleCapture}
                      disabled={isCapturing}
                    >
                      {isCapturing ? t('camera.recognizing') : t('camera.captureColor')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="camera-placeholder">
                  <p>{t('camera.placeholder')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="camera-modal-footer">
          <div className="progress-info">
            {t('camera.progress', { done: completedCount })}
          </div>
          <div className="footer-buttons">
            <button className="btn btn-secondary" onClick={onClose}>
              {t('camera.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={!allComplete}
            >
              {t('camera.finish')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
