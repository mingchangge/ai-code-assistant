import type { BodyMetrics } from '../types'

export const UNITS_REGEX = /公斤|%|大卡|cm|岁|kcal/gi

export const BODY_TYPE_VALUES = [
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

export const KEYWORDS = {
  NAMES: [
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
  ],
  STATUS: ['偏胖', '偏高', '标准', '偏低', '肥胖型', '正常', '优', '不足']
}

// 映射表：中文 Key -> 数据结构 Key
export const METRIC_KEY_MAP: Record<string, keyof BodyMetrics> = {
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
// 初始空数据结构
export const INITIAL_METRICS: BodyMetrics = {
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
