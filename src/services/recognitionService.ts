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

// --- 2. 主识别函数 ---
export const runRecognition = async (
  imageUrl: string
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
  const recognizedBoxes = await runOcrOnBoxes(imageElement, boxes)
  return pairAndParseResults(recognizedBoxes)
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
  const scoreThreshold = 0.25 // 稍微降低阈值，看看能否捞出一些value框
  const iouThreshold = 0.45

  const tensor = tf.browser
    .fromPixels(imageElement)
    .resizeNearestNeighbor([modelInputSize, modelInputSize])
    .toFloat()
    .div(tf.scalar(255.0))
    .expandDims(0)

  const predictions = (await layoutModel!.executeAsync(tensor)) as tf.Tensor[]
  const outputTensor = Array.isArray(predictions) ? predictions[0] : predictions

  const transposed = outputTensor.squeeze([0]).transpose()
  const boxesData = (await transposed.array()) as number[][]

  // --- 诊断步骤：打印出原始输出中置信度最高的前10个框 ---
  console.log('--- 模型原始输出诊断 ---')
  // 按置信度（索引4）降序排序
  const sortedBoxesData = [...boxesData].sort((a, b) => b[4] - a[4])
  console.log(
    '置信度最高的前10个原始框数据 [cx, cy, w, h, confidence, classId]:'
  )
  for (let i = 0; i < 10 && i < sortedBoxesData.length; i++) {
    // 将classId格式化为保留3位小数，以便观察
    const formattedData = sortedBoxesData[i].map((val, index) =>
      index === 5 ? val.toFixed(3) : val
    )
    console.log(`  - 框 ${i + 1}:`, formattedData)
  }
  console.log('--- 诊断结束 ---')
  // --- 诊断步骤结束 ---

  const boxes: [number, number, number, number][] = []
  const scores: number[] = []
  const classIds: number[] = []

  for (const boxData of boxesData) {
    const [cx, cy, w, h, confidence, classId] = boxData
    if (confidence < scoreThreshold) {
      continue
    }
    const y1 = cy - h / 2
    const x1 = cx - w / 2
    const y2 = cy + h / 2
    const x2 = cx + w / 2
    boxes.push([y1, x1, y2, x2])
    scores.push(confidence)
    classIds.push(classId)
  }

  const nmsResult = await tf.image.nonMaxSuppressionAsync(
    tf.tensor2d(boxes),
    tf.tensor1d(scores),
    50, // 稍微增加最大输出数量
    iouThreshold,
    scoreThreshold
  )

  const keptIndices = (await nmsResult.array()) as number[]
  const detectedBoxes: BoundingBox[] = []

  const scaleX = imageElement.width / modelInputSize
  const scaleY = imageElement.height / modelInputSize

  for (const index of keptIndices) {
    const [y1, x1, y2, x2] = boxes[index]
    const finalClassId = Math.round(classIds[index])
    detectedBoxes.push({
      label: finalClassId === 0 ? 'label' : 'value',
      box: [x1 * scaleX, y1 * scaleY, x2 * scaleX, y2 * scaleY]
    })
  }

  tf.dispose([tensor, predictions, outputTensor, transposed, nmsResult])
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
  console.log('--- 开始配对与解析 ---')
  console.log('所有识别出的框:', recognizedBoxes) // 调试日志 1: 查看所有原始结果
  const labels = recognizedBoxes.filter(b => b.label === 'label')
  const values = recognizedBoxes.filter(b => b.label === 'value')
  console.log(`找到了 ${labels.length} 个标签框, ${values.length} 个数值框`) // 调试日志 2: 检查分类是否正确
  const pairs: Record<string, string> = {}
  // 步骤2: 解析配对好的数据，应用您的原始逻辑
  const rawTextLines: string[] = []

  for (const value of values) {
    const [vx, vy] = value.box
    let bestMatch: BoundingBox | null = null
    let minDistance = Infinity

    // --- 调试日志 3: 检查每个value和它的潜在label匹配情况 ---
    console.log(
      `正在为 Value "${value.text}" (坐标 Y: ${vy.toFixed(0)}) 寻找 Label...`
    )

    for (const label of labels) {
      const [lx, ly] = label.box
      const distance = Math.abs(vy - ly)

      // 打印出所有潜在的匹配项及其诊断信息
      if (vx > lx) {
        console.log(
          `  - 考虑 Label "${label.text}" (坐标 Y: ${ly.toFixed(0)}), 垂直距离: ${distance.toFixed(2)}`
        )
      }
    }

    // 实际的匹配逻辑 (与之前相同)
    for (const label of labels) {
      const [lx, ly] = label.box
      if (vx > lx) {
        const distance = Math.abs(vy - ly)
        if (distance < minDistance && distance < 20) {
          // 20像素的Y轴容差
          minDistance = distance
          bestMatch = label
        }
      }
    }
    if (bestMatch?.text && value.text) {
      // 清理key中的特殊字符，提高匹配率
      const key = bestMatch.text.replace(/[\s(%)]/g, '')
      pairs[key] = value.text
      console.log(`%c成功匹配: { "${key}": "${value.text}" }`, 'color: green') // 调试日志 4: 报告成功匹配
    } else {
      console.log(
        `%c匹配失败: Value "${value.text}" 未找到合适的 Label.`,
        'color: red'
      ) // 调试日志 5: 报告失败
      if (!bestMatch)
        console.log(
          '%c  - 原因: 没有找到几何上足够近的Label。',
          'color: orange'
        )
      if (bestMatch && !bestMatch.text)
        console.log(
          `%c  - 原因: 几何匹配成功，但Label "${bestMatch.text}" OCR结果为空。`,
          'color: orange'
        )
      if (bestMatch && !value.text)
        console.log(
          `%c  - 原因: 几何匹配成功，但Value "${value.text}" OCR结果为空。`,
          'color: orange'
        )
    }
  }
  // 步骤1: 配对Label和Value
  for (const value of values) {
    if (!value.text) continue // 跳过没有识别出文本的框
    const [, vy, , vbottom] = value.box
    const vCenterY = vy + (vbottom - vy) / 2

    let bestMatch: BoundingBox | null = null
    let minDistance = Infinity

    // 寻找Y轴中心点最接近的label
    for (const label of labels) {
      if (!label.text) continue
      const [, ly, , lbottom] = label.box
      const lCenterY = ly + (lbottom - ly) / 2

      const distance = Math.abs(vCenterY - lCenterY)

      // 设置一个合理的Y轴距离阈值，例如框高的1倍
      const threshold = lbottom - ly
      if (distance < minDistance && distance < threshold) {
        minDistance = distance
        bestMatch = label
      }
    }
    if (bestMatch?.text) {
      // 清理识别出的key，去除不必要的字符
      const key = bestMatch.text.replace(/[\s(%)]/g, '')
      pairs[key] = value.text
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
