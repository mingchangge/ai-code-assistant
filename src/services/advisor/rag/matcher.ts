import type {
  MetricKey,
  MathResult,
  KnowledgeItem,
  UserProfile
} from '../types'
import { HEALTH_KNOWLEDGE_DB } from './knowledge-base'

/**
 * 辅助：判断年龄是否匹配
 */
function isAgeMatch(ageGroup: string | undefined, userAge: number): boolean {
  if (!ageGroup || ageGroup === 'all') return true
  if (ageGroup.includes('+')) {
    const min = parseInt(ageGroup.replace('+', ''), 10)
    return userAge >= min
  }
  if (ageGroup.includes('-')) {
    const [min, max] = ageGroup.split('-').map(n => parseInt(n, 10))
    return userAge >= min && userAge <= max
  }
  return false
}

/**
 * 辅助：判断数值是否命中条目阈值
 */
function isValueMatch(item: KnowledgeItem, value: number): boolean {
  // BMI 专用
  if (item.bmi_min !== undefined && item.bmi_max !== undefined) {
    return value >= item.bmi_min && value <= item.bmi_max
  }
  // 正常范围
  if (item.normal_min !== undefined && item.normal_max !== undefined) {
    return value >= item.normal_min && value <= item.normal_max
  }
  // 异常阈值
  if (item.low_threshold !== undefined && value < item.low_threshold)
    return true
  if (item.high_threshold !== undefined && value > item.high_threshold)
    return true
  if (item.obese_threshold !== undefined && value >= item.obese_threshold)
    return true
  if (
    item.overweight_threshold !== undefined &&
    value >= item.overweight_threshold
  )
    return true

  // 如果没有定义任何数值条件，仅匹配年龄/性别（作为通用类建议）
  const hasNumericConditions = [
    item.normal_min,
    item.low_threshold,
    item.high_threshold,
    item.bmi_min
  ].some(v => v !== undefined)

  return !hasNumericConditions
}

/**
 * 核心匹配函数
 */
export function matchAdvice(
  metricKey: MetricKey,
  result: MathResult,
  userProfile: UserProfile
): { interpretation: string; advice: string } {
  const { current } = result

  // 1. 映射 metricKey 到 Knowledge Category
  // 你的 config key 与 knowledge category 的映射表
  const categoryMap: Record<string, string> = {
    bodyFatRate: 'body_fat',
    bmi: 'bmi',
    visceralFatIndex: 'visceral_fat',
    muscleRate: 'muscle',
    skeletalMuscleRate: 'muscle', // 复用 muscle
    waterRate: 'water',
    boneRatio: 'bone'
  }
  const category = categoryMap[metricKey] || metricKey

  // 2. 筛选候选集 (Filter)
  const candidates = HEALTH_KNOWLEDGE_DB.filter(item => {
    if (item.category !== category) return false
    // 性别匹配：item是all，或者item性别等于用户性别
    if (item.gender !== 'all' && item.gender !== userProfile.gender)
      return false
    // 年龄匹配
    if (!isAgeMatch(item.age_group, userProfile.age)) return false
    return true
  })

  // 3. 寻找最佳匹配 (Best Match Logic)
  // 优先级：异常状态 (High/Low) > 正常范围 > 通用
  let matchedItem: KnowledgeItem | undefined

  // 3.1 尝试匹配异常 (Risk/High/Low)
  if (result.status !== 'normal') {
    matchedItem = candidates.find(item => {
      // 检查是否有对应的阈值定义
      const isHighCheck =
        (result.status === 'high' || result.status === 'risk') &&
        (item.high_threshold !== undefined ||
          item.overweight_threshold !== undefined)
      const isLowCheck =
        result.status === 'low' && item.low_threshold !== undefined

      return (isHighCheck || isLowCheck) && isValueMatch(item, current)
    })
  }

  // 3.2 如果没匹配到异常，匹配正常范围或通用描述
  matchedItem ??= candidates.find(item => isValueMatch(item, current))

  // 4. 返回结果
  if (matchedItem) {
    return {
      interpretation: matchedItem.interpretation ?? '',
      advice: matchedItem.advice || ''
    }
  }

  // 5. 兜底默认文案
  return {
    interpretation: `${metricKey} 当前值为 ${current.toString()}。`,
    advice: '请保持持续监测，观察长期趋势。'
  }
}
