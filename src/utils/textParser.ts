/**
 * 清理原始识别文本，处理乱码、异常空格和特殊字符
 */
export function cleanRecognitionText(rawText: string): string {
  // 1. 替换各种空格为标准空格
  let cleaned = rawText.replace(/[\u3000\s\t\n\r]+/g, ' ').trim()

  // 2. 处理常见的识别错误替换
  const replacements = [
    // 数字识别错误替换
    { from: /〇/g, to: '0' },
    { from: /一/g, to: '1' },
    { from: /二/g, to: '2' },
    { from: /三/g, to: '3' },
    { from: /四/g, to: '4' },
    { from: /五/g, to: '5' },
    { from: /六/g, to: '6' },
    { from: /七/g, to: '7' },
    { from: /八/g, to: '8' },
    { from: /九/g, to: '9' },
    // 常见字符识别错误
    { from: /贝体/g, to: '体' },
    { from: /脂月/g, to: '脂' },
    { from: /重体/g, to: '体重' },
    { from: /率脂/g, to: '脂率' },
    { from: /BM1/g, to: 'BMI' },
    { from: /BM/g, to: 'BMI' },
    { from: /8MI/g, to: 'BMI' },
    // 单位识别错误
    { from: /公厅/g, to: '公斤' },
    { from: /公 斤/g, to: '公斤' },
    { from: /大卡/g, to: '大卡' },
    { from: /卡卡/g, to: '大卡' }
  ]

  replacements.forEach(({ from, to }) => {
    cleaned = cleaned.replace(from, to)
  })

  // 3. 合并数字与单位
  cleaned = cleaned.replace(/(\d+)\s+(%|公斤|大卡|岁)/g, '$1$2')
  cleaned = cleaned.replace(/(\d+)\.(\d+)\s+(%|公斤|大卡|岁)/g, '$1.$2$3')

  // 4. 移除无关字符
  cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9%.\s:：]/g, '')

  // 5. 标准化符号
  cleaned = cleaned.replace(/[:：]+/g, ':')
  cleaned = cleaned.replace(/[%]+/g, '%')

  return cleaned
}

/**
 * 身体成分数据接口定义
 */
export interface BodyCompositionData {
  date: string
  weight?: number // 体重(公斤)
  bmi?: number // BMI
  bodyFatRate?: number // 体脂率(%)
  waterRate?: number // 水分率(%)
  muscleRate?: number // 肌肉率(%)
  proteinRate?: number // 蛋白质率(%)
  visceralFatIndex?: number // 内脏脂肪指数
  subcutaneousFat?: number // 皮下脂肪(公斤)
  leanBodyMass?: number // 去脂体重(公斤)
  bodyAge?: number // 身体年龄
  basalMetabolism?: number // 基础代谢(大卡)
  activeMetabolism?: number // 活动代谢(大卡)
  targetWeight?: number // 目标体重(公斤)
  weightControl?: number // 体重控制(公斤)
  fatControl?: number // 脂肪控制(公斤)
  muscleControl?: number // 肌肉控制(公斤)
  bodyType?: string // 体型
}

/**
 * 解析清理后的文本，提取身体成分数据
 */
export function parseBodyComposition(cleanedText: string): BodyCompositionData {
  const result: BodyCompositionData = {
    date: new Date().toISOString().split('T')[0]
  }

  // 使用多模式匹配提高成功率
  const extractValue = (patterns: RegExp[]): number | undefined => {
    for (const pattern of patterns) {
      const match = pattern.exec(cleanedText)
      if (match?.[1]) {
        const value = parseFloat(match[1])
        if (!isNaN(value)) return value
      }
    }
    return undefined
  }

  // 提取体重
  result.weight = extractValue([
    /体重[:：]\s*(\d+\.\d+)\s*公斤/,
    /体重[:：]\s*(\d+\.\d+)/,
    /(\d+\.\d+)\s*公斤\s*体重/,
    /(\d+\.\d+)\s*公斤/
  ])

  // 提取BMI
  result.bmi = extractValue([
    /BMI[:：]\s*(\d+\.\d+)/,
    /BMI\s*(\d+\.\d+)/,
    /(\d+\.\d+)\s*BMI/,
    /体质指数[:：]\s*(\d+\.\d+)/
  ])

  // 提取体脂率
  result.bodyFatRate = extractValue([
    /体脂率[:：]\s*(\d+\.\d+)%/,
    /体脂率\s*(\d+\.\d+)%/,
    /(\d+\.\d+)%\s*体脂率/,
    /全脂肪[:：]\s*(\d+\.\d+)%/,
    /脂肪率[:：]\s*(\d+\.\d+)%/
  ])

  // 提取水分率
  result.waterRate = extractValue([
    /水分率[:：]\s*(\d+\.\d+)%/,
    /水分率\s*(\d+\.\d+)%/,
    /(\d+\.\d+)%\s*水分率/,
    /身体水分[:：]\s*(\d+\.\d+)%/
  ])

  // 提取肌肉率
  result.muscleRate = extractValue([
    /肌肉率[:：]\s*(\d+\.\d+)%/,
    /肌肉率\s*(\d+\.\d+)%/,
    /(\d+\.\d+)%\s*肌肉率/,
    /骨骼肌率[:：]\s*(\d+\.\d+)%/
  ])

  // 提取身体年龄
  result.bodyAge = extractValue([
    /身体年龄[:：]\s*(\d+)/,
    /身体年龄\s*(\d+)/,
    /(\d+)\s*岁\s*身体年龄/
  ])?.toFixed(0) as unknown as number | undefined

  // 提取体型
  const bodyTypeMatch = /体型[:：]\s*([^\d%]+)/.exec(cleanedText)
  if (bodyTypeMatch?.[1]) {
    result.bodyType = bodyTypeMatch[1]
      .trim()
      .replace(/\s+/g, '')
      .replace(/型型/, '型')
  }

  // 提取基础代谢
  result.basalMetabolism = extractValue([
    /基础代谢[:：]\s*(\d+)\s*大卡/,
    /基础代谢\s*(\d+)\s*大卡/,
    /(\d+)\s*大卡\s*基础代谢/
  ])?.toFixed(0) as unknown as number | undefined

  return result
}

/**
 * 主函数：处理原始识别文本并提取身体成分数据
 */
export function processRecognitionText(rawText: string): BodyCompositionData {
  const cleanedText = cleanRecognitionText(rawText)
  return parseBodyComposition(cleanedText)
}
