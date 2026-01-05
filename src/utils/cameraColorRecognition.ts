/**
 * 摄像头颜色识别工具
 * 使用 WebRTC API 获取摄像头视频流，通过 Canvas API 提取颜色，使用 HSV 颜色空间分类
 */

import { FaceColor } from './cubeTypes'

/**
 * HSV 颜色值
 */
interface HSV {
  h: number  // 色相 (0-360)
  s: number  // 饱和度 (0-100)
  v: number  // 明度 (0-100)
}

/**
 * RGB 转 HSV
 */
function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6
    } else if (max === g) {
      h = (b - r) / diff + 2
    } else {
      h = (r - g) / diff + 4
    }
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const s = max === 0 ? 0 : Math.round((diff / max) * 100)
  const v = Math.round(max * 100)

  return { h, s, v }
}

/**
 * 标准魔方颜色的 HSV 范围定义
 */
const COLOR_RANGES: Record<FaceColor, { h: [number, number], s: [number, number], v: [number, number] }> = {
  white: { h: [0, 360], s: [0, 30], v: [70, 100] },   // 低饱和度，高亮度
  yellow: { h: [40, 70], s: [50, 100], v: [50, 100] }, // 黄色范围
  red: { h: [0, 20], s: [50, 100], v: [30, 100] },     // 红色范围（包括 330-360）
  orange: { h: [15, 40], s: [50, 100], v: [30, 100] }, // 橙色范围
  green: { h: [70, 150], s: [40, 100], v: [20, 100] }, // 绿色范围
  blue: { h: [180, 250], s: [40, 100], v: [20, 100] }, // 蓝色范围
  black: { h: [0, 360], s: [0, 100], v: [0, 30] },     // 低亮度
}

/**
 * 检查 HSV 值是否在指定范围内
 */
function isInRange(hsv: HSV, range: { h: [number, number], s: [number, number], v: [number, number] }): boolean {
  // 处理色相的循环特性（0 和 360 相邻）
  let hMatch = false
  if (range.h[0] <= range.h[1]) {
    hMatch = hsv.h >= range.h[0] && hsv.h <= range.h[1]
  } else {
    // 跨越 0/360 的情况（如红色：0-20 或 330-360）
    hMatch = hsv.h >= range.h[0] || hsv.h <= range.h[1]
  }

  return hMatch &&
    hsv.s >= range.s[0] && hsv.s <= range.s[1] &&
    hsv.v >= range.v[0] && hsv.v <= range.v[1]
}

/**
 * 根据 HSV 值识别颜色
 */
export function recognizeColor(r: number, g: number, b: number): { color: FaceColor, confidence: number } {
  const hsv = rgbToHsv(r, g, b)

  // 计算每个颜色的匹配度
  const scores: Record<FaceColor, number> = {
    white: 0,
    yellow: 0,
    red: 0,
    orange: 0,
    green: 0,
    blue: 0,
    black: 0,
  }

  // 计算每个颜色的匹配分数
  for (const [color, range] of Object.entries(COLOR_RANGES)) {
    if (isInRange(hsv, range)) {
      // 计算在范围内的距离（越接近中心分数越高）
      const hCenter = range.h[0] <= range.h[1] 
        ? (range.h[0] + range.h[1]) / 2
        : ((range.h[0] + range.h[1] + 360) % 360) / 2
      const hDist = Math.min(
        Math.abs(hsv.h - hCenter),
        Math.abs(hsv.h - hCenter + 360),
        Math.abs(hsv.h - hCenter - 360)
      )
      const sCenter = (range.s[0] + range.s[1]) / 2
      const sDist = Math.abs(hsv.s - sCenter)
      const vCenter = (range.v[0] + range.v[1]) / 2
      const vDist = Math.abs(hsv.v - vCenter)

      // 分数 = 1 - 归一化距离
      const hScore = 1 - (hDist / 180)
      const sScore = 1 - (sDist / 100)
      const vScore = 1 - (vDist / 100)
      scores[color as FaceColor] = (hScore + sScore + vScore) / 3
    }
  }

  // 找到分数最高的颜色
  let maxScore = 0
  let bestColor: FaceColor = 'white'
  for (const [color, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      bestColor = color as FaceColor
    }
  }

  // 如果没有匹配的颜色，根据亮度判断是白色还是黑色
  if (maxScore === 0) {
    if (hsv.v > 50) {
      bestColor = 'white'
      maxScore = 0.5
    } else {
      bestColor = 'black'
      maxScore = 0.5
    }
  }

  return { color: bestColor, confidence: Math.min(maxScore, 1) }
}

/**
 * 从视频帧中提取指定区域的平均颜色
 */
export function extractColorFromRegion(
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number
): { r: number, g: number, b: number } {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!
  
  ctx.drawImage(video, 0, 0)
  
  // 计算采样区域（取中心区域，避免边缘干扰）
  const sampleWidth = Math.max(1, Math.floor(width * 0.6))
  const sampleHeight = Math.max(1, Math.floor(height * 0.6))
  const sampleX = x + Math.floor((width - sampleWidth) / 2)
  const sampleY = y + Math.floor((height - sampleHeight) / 2)
  
  // 采样像素
  const imageData = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight)
  const data = imageData.data
  
  // 计算平均颜色
  let r = 0, g = 0, b = 0
  const pixelCount = sampleWidth * sampleHeight
  
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  
  return {
    r: Math.round(r / pixelCount),
    g: Math.round(g / pixelCount),
    b: Math.round(b / pixelCount),
  }
}

/**
 * 从视频中识别魔方面的颜色（3x3网格）
 */
export function recognizeFaceColors(
  video: HTMLVideoElement,
  faceWidth: number,
  faceHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): { colors: FaceColor[][], confidence: number[][] } {
  const colors: FaceColor[][] = []
  const confidence: number[][] = []
  
  const cellWidth = faceWidth / 3
  const cellHeight = faceHeight / 3
  
  for (let row = 0; row < 3; row++) {
    colors[row] = []
    confidence[row] = []
    for (let col = 0; col < 3; col++) {
      const x = offsetX + col * cellWidth
      const y = offsetY + row * cellHeight
      
      const rgb = extractColorFromRegion(video, x, y, cellWidth, cellHeight)
      const result = recognizeColor(rgb.r, rgb.g, rgb.b)
      
      colors[row][col] = result.color
      confidence[row][col] = result.confidence
    }
  }
  
  return { colors, confidence }
}

/**
 * 请求摄像头权限并返回视频流
 */
export async function requestCamera(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment', // 使用后置摄像头（如果可用）
      },
    })
    return stream
  } catch (error) {
    throw new Error(`无法访问摄像头: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 停止摄像头流
 */
export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop())
}
