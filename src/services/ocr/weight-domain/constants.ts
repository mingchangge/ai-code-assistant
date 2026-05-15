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
export const METRIC_KEY_MAP: Record<string, keyof BodyMetrics | undefined> = {
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
// 反向映射表：数据结构 Key -> 中文 Key
export const METRIC_KEY_MAP_REVERSE: Record<
  keyof BodyMetrics,
  string | undefined
> = Object.fromEntries(
  Object.entries(METRIC_KEY_MAP).map(([k, v]) => [v, k])
) as Record<keyof BodyMetrics, string | undefined>
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

// 定义各指标的合理波动系数
export const VOLATILITY = {
  // --- 第一梯队：核心稳定数据 (波动极小) ---
  weight: 0.05, // 体重: 5% (60kg ±3kg)
  bmi: 0.05, // BMI: 同体重
  leanBodyMass: 0.05, // 去脂体重: 同体重
  targetWeight: 0.1, // 建议体重: 10% (目标通常固定，但允许用户调整)

  // --- 第二梯队：常规成分数据 (受状态影响) ---
  bodyFatRate: 0.1, // 体脂率: 10% (20% -> 18%~22%)
  waterRate: 0.1, // 水分率: 10% (受饮水影响大)
  muscleRate: 0.1, // 肌肉率: 10%
  skeletalMuscleRate: 0.1, // 骨骼肌率: 10%
  proteinRate: 0.1, // 蛋白质率: 10%
  subcutaneousFat: 0.15, // 皮下脂肪: 15% (测量难度大，波动稍大)

  // --- 第三梯队：代谢与估算数据 ---
  // 关键修复点：基础代谢 1396 -> 13396 的错误会在这里被拦截
  // 10% 的波动意味着 1396 允许范围 [1256, 1535]，13396 显然出局
  basalMetabolism: 0.1,
  activeMetabolism: 0.1,
  bodyAge: 0.15, // 身体年龄: 15% (算法估算值，跳变较大)

  // --- 第四梯队：小数值/整数指标 (百分比敏感) ---
  // 例如骨骼重只有 2.5kg，内脏脂肪只有 7，变动 1 个单位百分比就很大
  boneRatio: 0.2, // 骨骼率: 20%
  visceralFatIndex: 0.3, // 内脏脂肪: 30% (如 6 -> 8 是 33% 变化，需宽容)

  // --- 第五梯队：差值/控制类 (特殊处理) ---
  // 代码逻辑中对这些字段使用的是 absolute limit (如 ±5kg)
  // 这里设置较宽的百分比作为 fallback，防止代码逻辑未覆盖时报错
  weightControl: 0.5,
  fatControl: 0.5,
  muscleControl: 0.5,

  // 兜底配置 (必须保留！)
  default: 0.2
}
// 时间膨胀系数 (Daily Expansion): 每多隔一天，容忍度增加多少
export const DAILY_EXPANSION = 0.01 // 每多隔一天，容忍度增加 1%
//最大容忍上限 (Max Cap)
export const MAX_CAP = 0.3 // 30% 是个合理的上限

// 人类生理上各指标的物理极限值，用于辅助决策
export const PHYSICAL_LIMITS: Record<string, { min: number; max: number }> = {
  // --- 基础指标 ---

  // 体重：婴儿 ~ 超级肥胖者。防范 OCR "600" 错误
  weight: { min: 2, max: 300 },

  // BMI：亚洲人 BMI>30 即严重肥胖，极限很难超过 100 (吉尼斯记录约 200，但App用户极少见 >80)
  bmi: { min: 5, max: 100 },

  // 身体年龄：虽然有“减龄”说法，但 0岁或 150岁 肯定是错的
  bodyAge: { min: 5, max: 120 },

  // 基础代谢：一般女性1000-1300，男性1400-1800。极端范围放宽至 500-6000
  basalMetabolism: { min: 500, max: 6000 },

  // 活动代谢：通常是基础代谢的 1.2~2.0 倍，迈克尔·菲尔普斯巅峰期也就 12000
  activeMetabolism: { min: 600, max: 15000 },

  // --- 百分比指标 (0-100%) ---
  // 注意：虽然代码里有 val > 100 的通用拦截，但这里的上限能更精准地拦截业务异常
  // 比如体脂率识别成 90% (小于100但几乎不可能)

  // 体脂率：健美运动员 3% ~ 极度肥胖 60-70%。90% 人就没骨头了
  bodyFatRate: { min: 2, max: 80 },

  // 水分率：人类 45%-65%。脱水<30%会死，>85% 是婴儿水平
  waterRate: { min: 30, max: 85 },

  // 骨骼肌率：一般 20%-60%
  skeletalMuscleRate: { min: 10, max: 80 },

  // 蛋白质率：一般 15%-20%。低于 5% 营养不良，高于 40% 极少见
  proteinRate: { min: 5, max: 50 },

  // 肌肉率：包含骨骼肌+平滑肌等，范围比骨骼肌率大
  muscleRate: { min: 15, max: 90 },

  // 皮下脂肪：通常比体脂率低
  subcutaneousFat: { min: 0.1, max: 70 },

  // --- 质量/指数指标 ---

  // 内脏脂肪指数：主流秤量程通常是 1-30，极端情况放宽到 60
  visceralFatIndex: { min: 0.5, max: 60 },

  // 骨骼率/骨量：
  // ⚠️ 特殊情况：有的秤显示 kg (1.5-4.0kg)，有的显示 % (3%-5%)
  // 亚洲人骨架较小。设置 0.5 - 20 可以同时兼容 kg 和 % (20% 骨重极少见，20kg骨重也极少见)
  boneRatio: { min: 0.5, max: 20 },

  // 去脂体重：= 体重 - 脂肪重。肯定小于体重。
  leanBodyMass: { min: 10, max: 250 },

  // 建议体重：参考体重范围
  targetWeight: { min: 10, max: 300 },

  // --- 控制类指标 (差值) ---
  // 这些值可能是负数（需要减重），也可能是正数
  // OCR 常见错误：把 "11.3" 识别成 "113"
  // 我们设定一个绝对值很大的安全范围，比如单次建议增减重不超过 150kg

  // 体重控制
  weightControl: { min: -150, max: 150 },

  // 脂肪控制
  fatControl: { min: -150, max: 150 },

  // 肌肉控制
  muscleControl: { min: -150, max: 150 }
}
