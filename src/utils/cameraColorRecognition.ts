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
 * 优化后的范围，更精确地识别颜色
 */
const COLOR_RANGES: Record<FaceColor, { h: [number, number], s: [number, number], v: [number, number] }> = {
  // 白色：非常严格的条件，避免误判（低饱和度且高亮度）
  white: { h: [0, 360], s: [0, 15], v: [85, 100] },
  // 黄色：放宽范围以适应不同光照条件
  yellow: { h: [30, 80], s: [20, 100], v: [30, 100] },
  // 红色：放宽范围，包括更广的色相和更低的饱和度要求
  red: { h: [340, 20], s: [20, 100], v: [15, 100] },
  // 橙色：放宽范围
  orange: { h: [10, 45], s: [20, 100], v: [15, 100] },
  // 绿色：放宽范围
  green: { h: [60, 170], s: [15, 100], v: [10, 100] },
  // 蓝色：放宽范围（蓝色识别正常，但可以进一步优化）
  blue: { h: [190, 270], s: [15, 100], v: [10, 100] },
  // 黑色：非常低的亮度
  black: { h: [0, 360], s: [0, 100], v: [0, 18] },
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
    // 跨越 0/360 的情况（如红色：350-10）
    hMatch = hsv.h >= range.h[0] || hsv.h <= range.h[1]
  }

  const sMatch = hsv.s >= range.s[0] && hsv.s <= range.s[1]
  const vMatch = hsv.v >= range.v[0] && hsv.v <= range.v[1]

  return hMatch && sMatch && vMatch
}

/**
 * 根据 HSV 值识别颜色
 */
export function recognizeColor(r: number, g: number, b: number): { color: FaceColor, confidence: number } {
  const hsv = rgbToHsv(r, g, b)
  
  // 调试日志（开发时使用，可以通过 localStorage 控制）
  const DEBUG = localStorage.getItem('DEBUG_COLOR_RECOGNITION') === 'true'
  if (DEBUG) {
    console.log(`[颜色识别] RGB: (${r}, ${g}, ${b}) -> HSV: (${hsv.h}°, ${hsv.s}%, ${hsv.v}%)`)
  }

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

  // 优先检查非白色/黑色的颜色（避免白色和黑色范围太宽导致误判）
  const priorityColors: FaceColor[] = ['yellow', 'red', 'orange', 'green', 'blue']
  
  // 先检查有明确色相的颜色
  for (const color of priorityColors) {
    const range = COLOR_RANGES[color]
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

      // 分数 = 1 - 归一化距离，色相权重更高
      const hRange = range.h[0] <= range.h[1] ? (range.h[1] - range.h[0]) : (360 - range.h[0] + range.h[1])
      const hScore = Math.max(0, 1 - (hDist / (hRange / 2)))
      const sRange = range.s[1] - range.s[0]
      const sScore = sRange > 0 ? Math.max(0, 1 - (sDist / (sRange / 2))) : 1
      const vRange = range.v[1] - range.v[0]
      const vScore = vRange > 0 ? Math.max(0, 1 - (vDist / (vRange / 2))) : 1
      
      // 加权平均，色相权重 60%，饱和度 25%，亮度 15%
      scores[color] = hScore * 0.6 + sScore * 0.25 + vScore * 0.15
      
      if (DEBUG) {
        console.log(`[颜色识别] ${color} 匹配: hScore=${hScore.toFixed(2)}, sScore=${sScore.toFixed(2)}, vScore=${vScore.toFixed(2)}, total=${scores[color].toFixed(2)}`)
      }
    }
  }

  // 如果没有任何有颜色匹配，再检查白色和黑色
  const hasColorMatch = priorityColors.some(color => scores[color] > 0)
  
  if (!hasColorMatch) {
    // 检查白色：非常严格的条件（低饱和度且高亮度）
    if (hsv.s < 15 && hsv.v > 85) {
      const sScore = 1 - (hsv.s / 15) // 饱和度越低越好
      const vScore = (hsv.v - 85) / 15 // 亮度越高越好（85-100）
      scores.white = (sScore + vScore) / 2
      
      if (DEBUG) {
        console.log(`[颜色识别] white 匹配: sScore=${sScore.toFixed(2)}, vScore=${vScore.toFixed(2)}, total=${scores.white.toFixed(2)}`)
      }
    }
    
    // 检查黑色：非常低的亮度
    if (hsv.v < 18) {
      scores.black = 1 - (hsv.v / 18) // 亮度越低越好
      
      if (DEBUG) {
        console.log(`[颜色识别] black 匹配: score=${scores.black.toFixed(2)}`)
      }
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

  // 如果仍然没有匹配（分数为0），根据亮度和饱和度判断
  if (maxScore === 0) {
    // 如果饱和度很低且亮度很高，可能是白色（但条件更严格）
    if (hsv.s < 15 && hsv.v > 85) {
      bestColor = 'white'
      maxScore = 0.2
    } else if (hsv.v < 18) {
      bestColor = 'black'
      maxScore = 0.2
    } else {
      // 如果有一定饱和度，尝试根据色相判断（放宽条件）
      if (hsv.h >= 190 && hsv.h <= 270 && hsv.s > 15) {
        bestColor = 'blue'
        maxScore = 0.2
      } else if (hsv.h >= 60 && hsv.h <= 170 && hsv.s > 15) {
        bestColor = 'green'
        maxScore = 0.2
      } else if ((hsv.h >= 340 || hsv.h <= 20) && hsv.s > 15) {
        bestColor = 'red'
        maxScore = 0.2
      } else if (hsv.h >= 10 && hsv.h <= 45 && hsv.s > 15) {
        bestColor = 'orange'
        maxScore = 0.2
      } else if (hsv.h >= 30 && hsv.h <= 80 && hsv.s > 15) {
        bestColor = 'yellow'
        maxScore = 0.2
      } else {
        // 如果饱和度很低，可能是白色
        if (hsv.s < 20 && hsv.v > 70) {
          bestColor = 'white'
          maxScore = 0.15
        } else {
          // 默认白色（可能是光照问题导致颜色识别失败）
          bestColor = 'white'
          maxScore = 0.1
        }
      }
    }
  }

  if (DEBUG) {
    console.log(`[颜色识别] 最终结果: ${bestColor}, 置信度: ${maxScore.toFixed(2)}`)
    console.log(`[颜色识别] 所有分数:`, scores)
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
  offsetY: number = 0,
  mirror: boolean = false  // 是否镜像（用于左右翻转）
): { colors: FaceColor[][], confidence: number[][] } {
  const colors: FaceColor[][] = []
  const confidence: number[][] = []
  
  const cellWidth = faceWidth / 3
  const cellHeight = faceHeight / 3
  
  for (let row = 0; row < 3; row++) {
    colors[row] = []
    confidence[row] = []
    for (let col = 0; col < 3; col++) {
      // 如果镜像，需要翻转列坐标
      const actualCol = mirror ? (2 - col) : col
      const x = offsetX + actualCol * cellWidth
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
