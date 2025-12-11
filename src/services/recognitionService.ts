import * as tf from '@tensorflow/tfjs'
import * as ort from 'onnxruntime-web'
import type {
  BoundingBox,
  BodyMetrics,
  RecognitionResult
} from '@/views/WeightRecords/components/types'

// --- 模块级变量，用于存储加载的模型和状态 ---
let layoutModel: tf.GraphModel | null = null
let ocrSession: ort.InferenceSession | null = null
let isInitialized = false

// OCR字符集 - 必须与你训练OCR模型时使用的字符集完全一致！
const OCR_CHARSET =
  '0123456789.%BMI对比上次测量体重公斤脂肪率水分骨骼肌蛋白质肉内脏指数皮下去身年龄型基础代谢活动建议控制偏胖高低标准肥大卡隐形微稍瘦强壮过力发达'

const OCR_MODEL_INPUT_HEIGHT = 64 // 必须与训练脚本中的 IMAGE_HEIGHT 一致
const OCR_MODEL_INPUT_WIDTH = 256 // 必须与训练脚本中的 IMAGE_WIDTH 一致
const FRONTEND_CONFIDENCE_THRESHOLD = 0.5 // 前端显示的置信度阈值，低于此值的框将被过滤掉

// --- 1. 初始化函数 (只执行一次) ---
export async function initializeModels() {
  if (isInitialized) {
    console.log('模型已初始化。')
    return
  }

  try {
    console.log('正在初始化模型...')

    await tf.setBackend('webgl')

    // 2. 配置 ONNX Runtime Web (可选但推荐)， 这里的属性是同步设置的，不是异步等待
    ort.env.wasm.wasmPaths = '/models/ocr_model/' // 建议指定 ONNX wasm 文件的路径
    ort.env.wasm.proxy = true // 明确启用代理，以在单独的 worker 中运行，防止在进行复杂计算时UI线程被阻塞。

    const [loadedLayoutModel, loadedOcrSession] = await Promise.all([
      tf.loadGraphModel('/models/layout_model/model.json'),
      ort.InferenceSession.create('/models/ocr_model/crnn_model_final.onnx', {
        executionProviders: ['wasm']
      })
    ])

    layoutModel = loadedLayoutModel
    ocrSession = loadedOcrSession
    isInitialized = true
    console.log('所有模型加载并初始化成功！')
  } catch (error) {
    console.error('模型初始化失败:', error)
    // 抛出错误，让调用方（UI组件）可以捕获并处理
    throw new Error('模型初始化失败，请检查网络或模型文件。')
  }
}
export interface DebugImageResult {
  debugImageUrl: string
}

// --- 2. 主识别函数 ---
export const runRecognition = async (
  imageUrl: string,
  enableDebug = false // 添加一个可选的调试开关
): Promise<RecognitionResult> => {
  if (!isInitialized || !layoutModel || !ocrSession) {
    throw new Error('模型尚未初始化，请先调用 initializeModels()。')
  }

  // 辅助函数：将图片URL转换为HTMLImageElement
  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve(img)
      }
      img.onerror = err => {
        console.error('图片加载失败:', err)
        reject(new Error('图片加载失败'))
      }
      img.src = src
    })
  }

  const imageElement = await loadImageElement(imageUrl)

  // 完整的识别流程
  const boxes = await runLayoutDetection(imageElement)
  if (boxes.length === 0) {
    throw new Error('布局检测未能识别出任何文本区域。')
  }
  // --- 【可视化调试的关键步骤】 ---
  let debugImageUrl: string | undefined = undefined
  if (enableDebug) {
    // 创建一张带有检测框的新图片
    debugImageUrl = drawBoxesOnImage(imageElement, boxes)
    console.log('调试图片已生成。请在UI中显示它。')
  }
  const recognizedBoxes = await runOcrOnBoxes(imageElement, boxes)
  const result = pairAndParseResults(recognizedBoxes)
  return { ...result, debugImageUrl }
}

// --- 3. 内部辅助函数 (不导出) ---

/**
 * 运行布局检测模型
 * @param imageElement HTML Image元素
 * @returns 检测到的边界框数组
 */
async function runLayoutDetection(
  imageElement: HTMLImageElement
): Promise<BoundingBox[]> {
  const modelInputSize = 640
  const originalWidth = imageElement.width
  const originalHeight = imageElement.height

  // 1. 在前端完美复刻YOLOv8的“信箱填充”预处理 (这部分是正确的，保持不变)
  const tensor = tf.tidy(() => {
    const imgTensor = tf.browser.fromPixels(imageElement)
    const r = Math.min(
      modelInputSize / originalWidth,
      modelInputSize / originalHeight
    )
    const newUnpadHeight = Math.round(originalHeight * r)
    const newUnpadWidth = Math.round(originalWidth * r)
    const resizedTensor = tf.image.resizeBilinear(imgTensor, [
      newUnpadHeight,
      newUnpadWidth
    ])
    const padTop = Math.round((modelInputSize - newUnpadHeight) / 2)
    const padBottom = modelInputSize - newUnpadHeight - padTop
    const padLeft = Math.round((modelInputSize - newUnpadWidth) / 2)
    const padRight = modelInputSize - newUnpadWidth - padLeft
    const paddings: [[number, number], [number, number], [number, number]] = [
      [padTop, padBottom],
      [padLeft, padRight],
      [0, 0]
    ]
    const paddedTensor = tf.cast(resizedTensor, 'float32').pad(paddings, 114.0)
    return paddedTensor.div(255.0).expandDims(0)
  })
  if (!layoutModel) {
    throw new Error('布局检测模型未初始化，请先调用 initializeModels()。')
  }
  // 2. 模型推理 (保持不变)
  const predictions = (await layoutModel.executeAsync(tensor)) as tf.Tensor[]
  const outputTensor = predictions[0]
  const boxesData = (await outputTensor.array()) as number[][][]
  const detectedRawBoxes = boxesData[0] || []

  const detectedBoxes: BoundingBox[] = []

  // --- 3. 【核心修复】: 使用为 [x1, y1, x2, y2] 格式量身定制的、正确的反向逻辑 ---
  const r_post = Math.min(
    modelInputSize / originalWidth,
    modelInputSize / originalHeight
  )
  const padX_post = (modelInputSize - Math.round(originalWidth * r_post)) / 2
  const padY_post = (modelInputSize - Math.round(originalHeight * r_post)) / 2

  for (const boxData of detectedRawBoxes) {
    // a. 按正确的 [x1, y1, x2, y2, conf, id] 格式解析
    const [x1_640, y1_640, x2_640, y2_640, confidence, classId] = boxData
    console.log('原始框:', x1_640, y1_640, x2_640, y2_640, confidence, classId)
    if (confidence < FRONTEND_CONFIDENCE_THRESHOLD) {
      continue
    }

    // b. 从 "640空间" 坐标中减去“黑边”的偏移量
    const x1_unpad = x1_640 - padX_post
    const y1_unpad = y1_640 - padY_post
    const x2_unpad = x2_640 - padX_post
    const y2_unpad = y2_640 - padY_post

    // c. 将坐标从“缩放空间”还原回“原始图片空间”
    const x1 = x1_unpad / r_post
    const y1 = y1_unpad / r_post
    const x2 = x2_unpad / r_post
    const y2 = y2_unpad / r_post

    detectedBoxes.push({
      label: 'text_block',
      box: [x1, y1, x2, y2]
    })
  }

  console.log(
    `经过前端置信度过滤后，保留了 ${detectedBoxes.length.toString()} 个高质量的框`
  )

  tf.dispose([tensor, ...predictions])
  return detectedBoxes
}

/**
 * 在检测到的边界框上运行OCR
 * @param imageElement 原始图片
 * @param boxes 边界框数组
 * @returns 包含识别文本的边界框数组
 */
const runOcrOnBoxes = async (
  imageElement: HTMLImageElement,
  boxes: BoundingBox[]
): Promise<BoundingBox[]> => {
  const canvas = document.createElement('canvas')

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法创建2D渲染上下文。')
  }
  const ocrPromises = boxes.map(async item => {
    const [x1, y1, x2, y2] = item.box
    const width = x2 - x1
    const height = y2 - y1

    // 使用canvas裁剪出小图
    canvas.width = width
    canvas.height = height
    ctx.drawImage(imageElement, x1, y1, width, height, 0, 0, width, height)

    // OCR预处理
    const ocrInputHeight = OCR_MODEL_INPUT_HEIGHT
    const OCR_MODEL_FIXED_WIDTH = OCR_MODEL_INPUT_WIDTH
    // 将Canvas内容转换为Tensor
    const imgTensor = tf.browser.fromPixels(canvas)

    // 手动实现RGB到灰度的转换
    const grayscaleTensor = tf.tidy(() => {
      // 1. 定义RGB权重
      const rgbWeights = tf.tensor1d([0.299, 0.587, 0.114])
      // 2. 使用 mul (带广播) 和 sum 实现加权求和
      // mul: [H, W, 3] * [3] -> [H, W, 3]
      // sum: 沿着最后一个轴(-1)求和 -> [H, W]
      return imgTensor.toFloat().mul(rgbWeights).sum(-1).expandDims(-1)
    })
    const processedTensor = tf.tidy(() => {
      // 1. 等比缩放，但不限制最大宽度
      const targetWidth = Math.floor(width * (ocrInputHeight / height))
      const resizedTensor = grayscaleTensor.resizeBilinear([
        ocrInputHeight,
        targetWidth
      ])

      // 2. 计算需要填充的宽度
      const paddingWidth = OCR_MODEL_FIXED_WIDTH - targetWidth

      // 3. 如果计算出的宽度超过了固定宽度，就直接把它缩放到固定宽度
      if (paddingWidth < 0) {
        return resizedTensor.resizeBilinear([
          ocrInputHeight,
          OCR_MODEL_FIXED_WIDTH
        ])
      }

      // 4. 定义填充量: [[top, bottom], [left, right]]
      // 我们只在右侧填充
      const paddings: [number, number][] = [
        [0, 0],
        [0, paddingWidth],
        [0, 0]
      ]

      // 5. 执行填充。-1 表示用归一化后的黑色填充
      // 归一化是 /127.5 - 1，所以 (0 / 127.5 - 1) = -1
      return resizedTensor.pad(paddings, -1)
    })
    // 继续后续的预处理
    const ocrTensor = tf.tidy(() => {
      return processedTensor
        .div(tf.scalar(127.5))
        .sub(tf.scalar(1.0))
        .transpose([2, 0, 1])
        .expandDims(0)
    })

    const ocrFeed = {
      input: new ort.Tensor('float32', await ocrTensor.data(), ocrTensor.shape)
    }

    const results = await ocrSession?.run(ocrFeed)
    const outputTensor = results?.output

    // 解码OCR输出 (CTC Greedy Decode)
    if (!outputTensor) {
      throw new Error('OCR模型输出为空')
    }
    const text = decodeOcrOutput(outputTensor)
    tf.dispose(ocrTensor)
    return { ...item, text }
  })

  return Promise.all(ocrPromises)
}

/**
 * 解码CRNN模型的输出
 * @param outputTensor onnxruntime的输出Tensor
 * @returns 识别的字符串
 */
function decodeOcrOutput(outputTensor: ort.Tensor): string {
  const predictions = outputTensor.data as Float32Array
  const shape = outputTensor.dims
  const sequenceLength = shape[1]
  const numClasses = shape[2]

  let rawText = ''
  for (let t = 0; t < sequenceLength; t++) {
    let maxProb = -Infinity
    let maxIndex = -1
    for (let c = 0; c < numClasses; c++) {
      const prob = predictions[t * numClasses + c]
      if (prob > maxProb) {
        maxProb = prob
        maxIndex = c
      }
    }
    if (maxIndex > 0 && maxIndex < OCR_CHARSET.length) {
      // 假设0是blank
      rawText += OCR_CHARSET[maxIndex - 1]
    }
  }

  // 去除重复和blank
  return rawText.replace(/(.)\1+/g, '$1').replace(/[-]/g, '') // 假设-是blank字符
}

/**
 * 配对label和value，并解析成结构化数据
 * @param recognizedBoxes 包含文本的边界框
 */
function matchNumber(str: string): number | undefined {
  // 预处理：去除所有空格和非数字相关的特殊字符
  const cleaned = str.replace(/[^\d.-]/g, '')
  // 处理可能的多个小数点（只保留第一个）
  const dotIndex = cleaned.indexOf('.')
  const normalized =
    dotIndex !== -1
      ? cleaned.substring(0, dotIndex + 1) +
        cleaned.substring(dotIndex + 1).replace(/\./g, '')
      : cleaned

  const regex = /-?\d+(\.\d+)?/
  const match = regex.exec(normalized)

  if (match) {
    const num = parseFloat(match[0])
    return isNaN(num) ? undefined : num
  }
  return undefined
}

function pairAndParseResults(recognizedBoxes: BoundingBox[]) {
  console.log('--- 开始智能配对与解析 (新逻辑) ---')
  console.log('所有识别出的文本块:', recognizedBoxes)

  const pairs: Record<string, string> = {}

  // 复制一份，用于安全地从中移除已匹配的项
  const unmatchedBoxes = [...recognizedBoxes]

  // 按从上到下，从左到右的顺序排序，便于处理
  unmatchedBoxes.sort((a, b) => {
    if (Math.abs(a.box[1] - b.box[1]) > 10) {
      // Y坐标差异大，按Y排序
      return a.box[1] - b.box[1]
    }
    return a.box[0] - b.box[0] // Y坐标相近，按X排序
  })

  // 定义一个关键词列表，帮助我们识别哪些是可能的"name"
  const nameKeywords = [
    '体重',
    'BMI',
    '体脂率',
    '水分率',
    '骨骼肌率',
    '骨骼率',
    '蛋白质率',
    '肌肉率',
    '内脏脂肪指数',
    '皮下脂肪',
    '去脂体重',
    '身体年龄',
    '基础代谢',
    '活动代谢',
    '建议体重',
    '体重控制',
    '脂肪控制',
    '肌肉控制',
    '体型'
  ]

  const potentialNames = unmatchedBoxes.filter(b =>
    nameKeywords.some(keyword => (b.text ?? '').startsWith(keyword))
  )

  const potentialValues = new Set(
    unmatchedBoxes.filter(b => !potentialNames.includes(b))
  )

  for (const nameBox of potentialNames) {
    if (!nameBox.text) continue

    let bestMatch: BoundingBox | null = null
    let minDistance = Infinity

    for (const valueBox of potentialValues) {
      const [nx, ny, nright, nbottom] = nameBox.box
      const [vx, vy, vright, vbottom] = valueBox.box

      const nCenterX = nx + (nright - nx) / 2
      const nCenterY = ny + (nbottom - ny) / 2
      const vCenterX = vx + (vright - vx) / 2
      const vCenterY = vy + (vbottom - vy) / 2

      // 规则1：检查是左右结构还是上下结构
      const isHorizontal = Math.abs(nCenterY - vCenterY) < nbottom - ny // Y轴中心点距离小于name的高度，视为水平
      const isVertical = Math.abs(nCenterX - vCenterX) < nright - nx // X轴中心点距离小于name的宽度，视为垂直

      let isSpatiallyCorrect = false
      if (isHorizontal && vCenterX > nCenterX) {
        // 左右结构
        isSpatiallyCorrect = true
      } else if (isVertical && vCenterY > nCenterY) {
        // 上下结构
        isSpatiallyCorrect = true
      }

      if (isSpatiallyCorrect) {
        const distance = Math.sqrt(
          Math.pow(nCenterX - vCenterX, 2) + Math.pow(nCenterY - vCenterY, 2)
        )
        if (distance < minDistance) {
          minDistance = distance
          bestMatch = valueBox
        }
      }
    }

    if (bestMatch?.text) {
      const key = nameBox.text.replace(/[\s(%)]/g, '')
      pairs[key] = bestMatch.text
      potentialValues.delete(bestMatch) // 从待匹配集合中移除
      console.log(
        `%c成功匹配: { "${key}": "${bestMatch.text}" }`,
        'color: green'
      )
    } else {
      console.log(
        `%c匹配失败: Name "${nameBox.text}" 未找到合适的 Value.`,
        'color: red'
      )
    }
  }

  // 初始化数据结构
  const data: BodyMetrics = {
    date: '',
    weight: undefined,
    bmi: undefined,
    bodyFatRate: undefined,
    waterRate: undefined,
    skeletalMuscleRate: undefined,
    boneRatio: undefined,
    proteinRate: undefined,
    muscleRate: undefined,
    visceralFatIndex: undefined,
    subcutaneousFat: undefined,
    leanBodyMass: undefined,
    bodyAge: undefined,
    basalMetabolism: undefined,
    activeMetabolism: undefined,
    targetWeight: undefined,
    weightControl: undefined,
    fatControl: undefined,
    muscleControl: undefined,
    bodyType: ''
  }

  // 关键字映射表
  const keywordMap: Record<string, keyof BodyMetrics> = {
    体重: 'weight',
    BMl: 'bmi',
    BMI: 'bmi',
    体脂率: 'bodyFatRate',
    水分率: 'waterRate',
    骨骼肌率: 'skeletalMuscleRate',
    骨骼率: 'boneRatio',
    蛋白质率: 'proteinRate',
    肌肉率: 'muscleRate',
    内脏脂肪指数: 'visceralFatIndex',
    皮下脂肪: 'subcutaneousFat',
    去脂体重: 'leanBodyMass',
    身体年龄: 'bodyAge',
    基础代谢: 'basalMetabolism',
    活动代谢: 'activeMetabolism',
    建议体重: 'targetWeight',
    目标体重: 'targetWeight',
    体重控制: 'weightControl',
    脂肪控制: 'fatControl',
    肌肉控制: 'muscleControl',
    体型: 'bodyType'
  }
  const rawTextLines: string[] = []
  // 遍历配对好的键值对进行解析
  for (const recognizedKey in pairs) {
    const valueStr = pairs[recognizedKey]

    // 找到映射关系
    for (const mapKey in keywordMap) {
      if (recognizedKey.startsWith(mapKey)) {
        const dataKey = keywordMap[mapKey]

        // 记录到原始文本中
        rawTextLines.push(`${recognizedKey}: ${valueStr}`)

        // --- 应用您的解析和清洗逻辑 ---
        if (dataKey === 'bodyType') {
          // `bodyType`是字符串，特殊处理
          data.bodyType = valueStr.replace(/型$/, '').trim() + '型'
        } else {
          // 其他都是数值类型
          let value = matchNumber(valueStr)

          if (value !== undefined) {
            // 数据清洗与纠错 (完全移植您的逻辑)
            if (dataKey === 'bmi' && value > 50) {
              value /= 10 // 处理可能的小数点识别错误
            }
            if (
              (String(dataKey).includes('Rate') ||
                String(dataKey).includes('率')) &&
              value > 100
            ) {
              value /= 10 // 处理百分比可能的识别错误
            }
            // 使用类型断言来安全地赋值
            data[dataKey] = value
          }
        }
        break // 找到匹配后就跳出内层循环
      }
    }
  }

  console.log('解析后的键值对:', pairs)
  console.log('最终结构化数据:', data)

  return { rawText: rawTextLines.join('\n'), parsedData: data }
}
/**
 * 在图片上绘制边界框用于调试
 * @param imageElement 原始图片
 * @param boxes 边界框数组
 * @returns 带有绘制框的图片的Data URL
 */
function drawBoxesOnImage(
  imageElement: HTMLImageElement,
  boxes: BoundingBox[]
): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageElement.width
  canvas.height = imageElement.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // 1. 先绘制原始图片
  ctx.drawImage(imageElement, 0, 0)

  // 2. 遍历所有框并绘制
  for (const item of boxes) {
    const [x1, y1, x2, y2] = item.box
    const width = x2 - x1
    const height = y2 - y1

    // 随机生成一个颜色，便于区分
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`

    // 绘制矩形框
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.strokeRect(x1, y1, width, height)

    // （可选）在框旁边写上标签，但我们现在是通用标签，意义不大
    // ctx.fillStyle = color;
    // ctx.font = '16px Arial';
    // ctx.fillText(item.label, x1, y1 > 20 ? y1 - 5 : y1 + 15);
  }

  // 3. 返回图片的Data URL
  return canvas.toDataURL('image/jpeg')
}
