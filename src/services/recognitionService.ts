import * as tf from '@tensorflow/tfjs'
import * as ort from 'onnxruntime-web'
import JSZip from 'jszip'
import { saveAs } from 'file-saver' // 用于触发下载
import type {
  BoundingBox,
  BodyMetrics,
  RecognitionResult
} from '@/views/WeightRecords/components/types'

// --- 定义全局变量来存储新的字符集信息 ---
let intToChar = new Map<number, string>()

// --- 模块级变量，用于存储加载的模型和状态 ---
let layoutModel: tf.GraphModel | null = null
let ocrSession: ort.InferenceSession | null = null

const OCR_MODEL_INPUT_HEIGHT = 64 // 必须与训练脚本中的 IMAGE_HEIGHT 一致
const OCR_MODEL_INPUT_WIDTH = 256 // 必须与训练脚本中的 IMAGE_WIDTH 一致
const FRONTEND_CONFIDENCE_THRESHOLD = 0.5 // 前端显示的置信度阈值，低于此值的框将被过滤掉

// --- 1. 初始化函数 (只执行一次) ---
export async function initializeModels() {
  if (layoutModel && ocrSession && intToChar.size > 0) {
    console.log('模型和字符集已初始化。')
    return
  }

  try {
    console.log('正在初始化模型...')

    await tf.setBackend('webgl')
    const modelDir = '/models/ocr_model/'
    const charsetPath = `${modelDir}charset.txt` // <-- 指向新的字符集文件!
    // 2. 配置 ONNX Runtime Web (可选但推荐)， 这里的属性是同步设置的，不是异步等待
    ort.env.wasm.wasmPaths = '/models/ocr_model/' // 建议指定 ONNX wasm 文件的路径
    ort.env.wasm.proxy = true // 明确启用代理，以在单独的 worker 中运行，防止在进行复杂计算时UI线程被阻塞。

    const [loadedLayoutModel, loadedOcrSession, charsetContent] =
      await Promise.all([
        tf.loadGraphModel('/models/layout_model/model.json'),
        ort.InferenceSession.create(
          '/models/ocr_model/crnn_finetuned_web.onnx',
          {
            executionProviders: ['wasm']
          }
        ),
        fetch(charsetPath).then(res => res.text())
      ])

    layoutModel = loadedLayoutModel
    ocrSession = loadedOcrSession
    // 解析字符集文件并创建映射表
    // PyTorch的CTCLoss blank token 在索引0，所以我们从1开始
    // 但我们的Python脚本保存的charset.txt已经去掉了blank，所以直接用即可
    const characters = charsetContent.split('')
    intToChar = new Map(characters.map((char, index) => [index + 1, char])) // +1是因为0是blank
    console.log(`✅ 字符集加载成功，共 ${intToChar.size.toString()} 个字符。`)
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
): Promise<RecognitionResult & { boxesForCropping: BoundingBox[] }> => {
  if (!layoutModel || !ocrSession) {
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

  // OCR识别
  const boxes = await runLayoutDetection(imageElement)
  if (boxes.length === 0) {
    throw new Error('布局检测未能识别出任何文本区域。')
  }
  // --- 【可视化调试的关键步骤】 ---
  // let debugImageUrl: string | undefined = undefined
  // if (enableDebug) {
  //   // 创建一张带有检测框的新图片
  //   debugImageUrl = drawBoxesOnImage(imageElement, boxes)
  //   console.log('调试图片已生成。请在UI中显示它。')
  // }
  const recognizedBoxes = await runOcrOnBoxes(imageElement, boxes)
  // 配对与解析
  const result = pairAndParseResults(recognizedBoxes)
  return { ...result, boxesForCropping: boxes }
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

  // 1. 在前端完美复刻YOLOv8的“信箱填充”预处理
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

  // 3. 使用为 [x1, y1, x2, y2] 格式量身定制的、正确的反向逻辑
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
  if (!ocrSession) throw new Error('OCR模型未初始化')

  const ocrInputHeight = OCR_MODEL_INPUT_HEIGHT
  const ocrInputWidth = OCR_MODEL_INPUT_WIDTH
  const recognizedBoxes: BoundingBox[] = []

  for (const item of boxes) {
    const [x1, y1, x2, y2] = item.box
    const width = x2 - x1
    const height = y2 - y1
    // 裁剪并预处理图像区域 (向外扩张 2-4 像素)
    const padding = 2 // 可根据需要调整
    const x1_c = Math.max(0, x1 - padding)
    const y1_c = Math.max(0, y1 - padding)
    const width_c = Math.min(imageElement.width - x1_c, width + padding * 2)
    const height_c = Math.min(imageElement.height - y1_c, height + padding * 2)

    const canvas = document.createElement('canvas')
    canvas.width = width_c
    canvas.height = height_c
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取2D上下文')
    }
    ctx.drawImage(imageElement, x1, y1, width, height, 0, 0, width, height)

    const tensor = tf.tidy(() => {
      let imgTensor = tf.browser.fromPixels(canvas, 1) // 初始形状: [H, W, C] = [64, 256, 1]
      imgTensor = tf.image.resizeBilinear(imgTensor, [
        ocrInputHeight,
        ocrInputWidth
      ])
      const expandedTensor = imgTensor.toFloat().div(255.0).expandDims(0) // 形状: [B, H, W, C] = [1, 64, 256, 1]

      // 【关键修复】: 使用 tf.transpose 重新排列维度
      // 将 HWC 格式 [0, 1, 2, 3] -> [1, 64, 256, 1]
      // 转换为 CHW 格式 [0, 3, 1, 2] -> [1, 1, 64, 256]
      return expandedTensor.transpose([0, 3, 1, 2])
    })

    const feed = {
      input: new ort.Tensor('float32', tensor.dataSync(), tensor.shape)
    }

    const results = await ocrSession.run(feed)
    const outputTensor = results.output

    const text = decodeOcrPrediction(outputTensor)
    recognizedBoxes.push({ ...item, text })

    tf.dispose(tensor)
  }

  return recognizedBoxes
}

/**
 * 解码CRNN模型的输出
 * @param outputTensor onnxruntime的输出Tensor
 * @returns 识别的字符串
 */
function decodeOcrPrediction(prediction: ort.Tensor): string {
  const data = prediction.data as Float32Array
  const shape = prediction.dims // [batch, sequence_length, num_characters]
  const sequenceLength = shape[1]
  const numChars = shape[2]

  let text = ''
  let lastIndex = 0

  // 遍历序列 (时间步)
  for (let i = 0; i < sequenceLength; i++) {
    const sequenceSlice = data.slice(i * numChars, (i + 1) * numChars)
    const maxIndex = sequenceSlice.indexOf(Math.max(...sequenceSlice))

    // CTC解码逻辑：忽略blank (索引0) 和连续重复的字符
    if (maxIndex > 0 && maxIndex !== lastIndex) {
      text += intToChar.get(maxIndex) ?? ''
    }
    lastIndex = maxIndex
  }
  return text
}

/**
 * 配对label和value，并解析成结构化数据
 * @param recognizedBoxes 包含文本的边界框
 */
function matchNumber(str: string): number | undefined {
  // 预处理：去除所有空格和非数字相关的特殊字符
  // const cleaned = str.replace(/[^\d.-]/g, '')
  // 处理可能的多个小数点（只保留第一个）
  // const dotIndex = cleaned.indexOf('.')
  // const normalized =
  //   dotIndex !== -1
  //     ? cleaned.substring(0, dotIndex + 1) +
  //       cleaned.substring(dotIndex + 1).replace(/\./g, '')
  //     : cleaned
  const fixed = str.replace(/。/g, '.').replace(/\s/g, '')
  const regex = /-?\d+(\.\d+)?/
  const match = regex.exec(fixed)

  if (match) {
    const num = parseFloat(match[0])
    return isNaN(num) ? undefined : num
  }
  return undefined
}

/**
 * 智能配对与解析函数 (优化版)
 * 核心策略：利用页面排版特征（列表通常是左右结构）来过滤 header 区域的干扰（上下结构）
 * ### 主要优化点：
 * 1.  **引入 `isSameLine` 辅助函数**：通过几何计算判断两个框是否在“同一行”，这是解决页面顶部“体重”干扰列表“体重”的核心。
 * 2.  **重构配对逻辑（结构竞争）**：
 *   *   不再简单地遍历 Name 找 Value。
 *   *   而是先将 Name 按关键字分组（例如把所有的“体重”框放在一起）。
 *   *   让这些同名框去竞争匹配 Value，**强制要求“左右结构”且“同一行”**。
 *   *   **结果**：页面顶部的“体重”因为数值在下方（上下结构），无法满足“同一行”条件，会被自动淘汰；列表中的“体重”满足条件，会被保留。
 * 3.  **保留并优化体型识别**：保留了你原本的三级查找策略（Others -> Statuses -> Values），这非常稳健。
 * 4.  **增加特定数据清洗**：针对 OCR 常见的 `11704` (多读了1) 等问题增加了清洗逻辑。
 */
// --- 辅助函数：判断两个框是否在视觉上的“同一行”，结合了“中心点对齐”和“垂直重叠率”两种判断，解决字号差异大导致无法匹配的问题 ---
function isSameLine(boxA: BoundingBox, boxB: BoundingBox): boolean {
  const [ax1, ay1, ax2, ay2] = boxA.box
  const [bx1, by1, bx2, by2] = boxB.box

  // 1. 计算两个框在 Y 轴上的投影重叠区域
  const overlapY1 = Math.max(ay1, by1)
  const overlapY2 = Math.min(ay2, by2)
  const overlapHeight = Math.max(0, overlapY2 - overlapY1)

  // 2. 获取两个框的最小高度（以此为基准计算重叠比例）
  const heightA = ay2 - ay1
  const heightB = by2 - by1
  const minHeight = Math.min(heightA, heightB)

  // 3. 判断逻辑：

  // 规则 A: 重叠高度 > 最小高度的 50%
  const isOverlapping = overlapHeight > minHeight * 0.5

  // 规则 B: 中心点对齐 (放宽到 0.5，应对字号差异巨大的情况)
  const centerYA = (ay1 + ay2) / 2
  const centerYB = (by1 + by2) / 2
  const maxHeight = Math.max(heightA, heightB)
  const isCenterAligned = Math.abs(centerYA - centerYB) < maxHeight * 0.5

  return isOverlapping || isCenterAligned
}
function pairAndParseResults(recognizedBoxes: BoundingBox[]) {
  console.log('--- 开始智能配对与解析 (结构竞争优化版) ---')
  // console.log('所有识别出的文本块:', recognizedBoxes)

  const unitsRegex = /公斤|%|大卡|cm|岁|kcal/gi
  const pairs: Record<string, string> = {}

  // 1. 定义体型白名单
  const bodyTypeValues = [
    '隐形肥胖型',
    '肥胖型',
    '偏胖',
    '偏胖型',
    '标准',
    '标准型',
    '偏瘦',
    '偏瘦型',
    '运动型',
    '不足'
  ]

  // 2. 关键字定义
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
  const statusKeywords = [
    '偏胖',
    '偏高',
    '标准',
    '偏低',
    '肥胖型',
    '正常',
    '优',
    '不足'
  ]

  const names: BoundingBox[] = []
  const values: BoundingBox[] = []
  const statuses: BoundingBox[] = []
  const others: BoundingBox[] = []

  // =================================================================
  // 阶段 1: 预分类与清洗
  // =================================================================
  for (const box of recognizedBoxes) {
    const text = box.text?.trim() ?? ''
    if (!text) continue

    if (nameKeywords.some(keyword => text.startsWith(keyword))) {
      names.push(box)
    } else if (statusKeywords.some(keyword => text.includes(keyword))) {
      statuses.push(box)
    } else if (/\d/.test(text)) {
      values.push(box)
    } else {
      others.push(box)
    }
  }

  // =================================================================
  // 阶段 2: 提取体型 (BodyType) - 级联查找策略
  // =================================================================
  let foundBodyType = ''

  // 策略 A: 检查 others 数组 (最常见)
  for (const box of others) {
    if (bodyTypeValues.some(bt => box.text?.includes(bt))) {
      foundBodyType = box.text ?? ''
      console.log(
        `%c[体型识别] 在Others中找到: ${foundBodyType}`,
        'color: blue'
      )
      break
    }
  }
  // 策略 B: 在 statuses 中查找 (防止被误分为状态)
  if (!foundBodyType) {
    for (const box of statuses) {
      if (bodyTypeValues.some(bt => box.text?.includes(bt))) {
        foundBodyType = box.text ?? ''
        console.log(
          `%c[体型识别] 在Statuses中找到: ${foundBodyType}`,
          'color: blue'
        )
        break
      }
    }
  }
  // 策略 C: 在 values 中查找 (防止OCR把"0"等误读导致进了values)
  if (!foundBodyType) {
    for (const box of values) {
      if (bodyTypeValues.some(bt => box.text?.includes(bt))) {
        foundBodyType = box.text ?? ''
        console.log(
          `%c[体型识别] 在Values中找到: ${foundBodyType}`,
          'color: blue'
        )
        break
      }
    }
  }
  if (!foundBodyType) {
    foundBodyType = '未识别到' // 保持为空字符串，或者按需设置为 '未识别到'
  }

  // =================================================================
  // 阶段 3: 核心匹配逻辑 (基于重叠率 + 最近邻居)
  // =================================================================
  const unmatchedValues = new Set(values)

  // 3.1 对 Name 进行分组，解决重复 Key 问题 (如两个"体重")
  const groupedNames: Record<string, BoundingBox[]> = {}
  names.forEach(box => {
    // 移除括号和空格，确保 key 干净
    const key = box.text?.replace(/[\s(%)（）]/g, '') ?? ''
    if (!key) return

    // ✅ 关键修复：如果数组不存在才创建，否则直接 push
    if (!groupedNames[key]) {
      groupedNames[key] = []
    }
    groupedNames[key].push(box)
  })

  // 3.2 遍历每个 Key，寻找“最佳几何匹配”
  Object.keys(groupedNames).forEach(key => {
    const candidateNameBoxes = groupedNames[key]
    // 调试日志：看看究竟有几个框参与了竞争
    console.log(`Key [${key}] 有 ${candidateNameBoxes.length} 个候选框参与匹配`)

    let bestPair = {
      nameBox: null as BoundingBox | null,
      valueBox: null as BoundingBox | null,
      distance: Infinity
    }

    // 让该 Key 下的所有候选框 (比如顶部的体重、列表的体重) 去竞争
    for (const nameBox of candidateNameBoxes) {
      const [nx, ny, nright, nbottom] = nameBox.box

      for (const valueBox of unmatchedValues) {
        const [vx, vy, vright, vbottom] = valueBox.box

        // --- 纯几何结构判断 ---

        // 条件 A: 必须在右侧 (Value的中心 X > Name的右边界 - 容差)
        const isRightSide = (vx + vright) / 2 > nright - 20

        // 条件 B: 必须是同一行 (这是过滤 Header 干扰的绝杀)
        // Header里的“体重”数值在下方，这里会返回 false
        const isAligned = isSameLine(nameBox, valueBox)

        if (isRightSide && isAligned) {
          const distance = vx - nright

          // 条件 C: 最近原则 (The Nearest Neighbor)
          // 只要距离是正的(允许轻微重叠)，越小越好。
          if (distance > -50) {
            if (distance < bestPair.distance) {
              bestPair = {
                nameBox: nameBox,
                valueBox: valueBox,
                distance: distance
              }
            }
          }
        }
      }
    }

    // 3.3 结算最佳匹配
    if (bestPair.nameBox && bestPair.valueBox) {
      let cleanedValue =
        bestPair.valueBox.text?.replace(unitsRegex, '').trim() ?? ''

      // --- [数据清洗] 特定字段的容错处理 ---

      // 修正 1: "11704" -> "1704" (OCR常把前面的竖线读成1)
      if (
        (key === '活动代谢' || key === '基础代谢') &&
        cleanedValue.length === 5 &&
        cleanedValue.startsWith('1') &&
        parseInt(cleanedValue) > 3000
      ) {
        cleanedValue = cleanedValue.substring(1)
      }

      // 修正 2: 处理可能的中文句号误读
      cleanedValue = cleanedValue.replace(/。/g, '.')

      pairs[key] = cleanedValue

      // 标记使用 (防止重复匹配)
      unmatchedValues.delete(bestPair.valueBox)

      console.log(
        `✅ 成功配对 [${key}]: ${cleanedValue} (距离: ${bestPair.distance.toFixed(1)})`
      )
    } else {
      // 这里的 log 很重要，如果 Header 的“体重”没匹配到是正常的，我们不关心
      // 但如果列表里的也没匹配到，说明距离或对齐有问题
      console.log(`⚠️ Key [${key}] 未找到符合“右侧同路”规则的数值`)
      if (['体重', 'BMI', '身体年龄'].includes(key)) {
        console.log(
          `❌ 警告: Key [${key}] 未找到匹配。请检查 isSameLine 判断。`
        )
      }
    }
  })
  // =================================================================
  // 阶段 4: 映射到 BodyMetrics 结构
  // =================================================================
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
    bodyType: foundBodyType // 使用阶段2找到的体型
  }

  const keywordMap: Record<string, keyof BodyMetrics> = {
    体重: 'weight',
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
    体重控制: 'weightControl',
    脂肪控制: 'fatControl',
    肌肉控制: 'muscleControl',
    体型: 'bodyType'
  }

  for (const key in pairs) {
    if (key.endsWith('_status')) continue

    const valueStr = pairs[key]
    const dataKey = keywordMap[key]

    if (dataKey) {
      if (dataKey === 'bodyType') {
        // 如果 pairs 里有体型 (极少见，除非体型被识别为 Name:Value 结构)，覆盖前面的 foundBodyType
        if (valueStr) data.bodyType = valueStr
      } else if (statusKeywords.includes(valueStr)) {
        // 容错：如果把状态误认为数值
        data[dataKey] = valueStr
      } else {
        const numValue = matchNumber(valueStr)
        if (numValue !== undefined) {
          data[dataKey] = numValue
        }
      }
    }
  }

  console.log('解析后的键值对:', pairs)
  console.log('最终结构化数据:', data)

  const rawTextLines = Object.entries(pairs).map(
    ([key, value]) => `${key}: ${value}`
  )
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

/**
 * [新] 封装的可视化逻辑
 * 在图片上绘制边界框，并返回一个包含Data URL和原始框数据的对象。
 * @param imageElement 原始图片
 * @param boxes 边界框数组
 * @returns 一个包含可视化图片URL的对象
 */
export function visualizeLayoutDetection(
  imageElement: HTMLImageElement,
  boxes: BoundingBox[]
): { debugImageUrl: string } {
  const canvas = document.createElement('canvas')
  canvas.width = imageElement.naturalWidth
  canvas.height = imageElement.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取2D上下文')

  ctx.drawImage(imageElement, 0, 0)

  for (const item of boxes) {
    const [x1, y1, x2, y2] = item.box
    const width = x2 - x1
    const height = y2 - y1

    // 使用随机但明亮的颜色
    const color = `hsl(${(Math.random() * 360).toString()}, 90%, 60%)`
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.strokeRect(x1, y1, width, height)
  }

  return { debugImageUrl: canvas.toDataURL('image/jpeg') }
}

/**
 * [新] 裁剪所有检测框并打包下载为zip
 * @param imageElement 原始图片
 * @param boxes 从布局检测中得到的边界框数组
 */
export async function cropAndDownloadTrainingSet(
  imageElement: HTMLImageElement,
  boxes: BoundingBox[]
): Promise<void> {
  const zip = new JSZip()
  const imagesFolder = zip.folder('images') // 在zip包内创建一个images文件夹

  if (!imagesFolder) {
    throw new Error('创建zip文件夹失败')
  }

  // 用于生成labels.txt的内容
  const labelsContent: string[] = []

  // 使用Promise.all来并行处理所有裁剪操作
  await Promise.all(
    boxes.map(async (item, index) => {
      const [x1, y1, x2, y2] = item.box
      const width = Math.max(1, x2 - x1) // 确保宽高至少为1
      const height = Math.max(1, y2 - y1)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 从原始大图中裁剪
      ctx.drawImage(imageElement, x1, y1, width, height, 0, 0, width, height)

      // 将canvas内容转为Blob
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/png')
      )
      if (blob) {
        // 使用唯一的临时文件名
        const filename = `image_${index}_fixme.png`
        imagesFolder.file(filename, blob)
        // 为labels.txt添加一行，内容是 "images/filename.png [请在这里填写正确文本]"
        labelsContent.push(`images/${filename}\t[REPLACE_WITH_CORRECT_TEXT]`)
      }
    })
  )

  // 将labels.txt添加到zip根目录
  zip.file('labels.txt', labelsContent.join('\n'))

  // 生成zip文件并触发下载
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, 'ocr_finetune_dataset.zip')
}
