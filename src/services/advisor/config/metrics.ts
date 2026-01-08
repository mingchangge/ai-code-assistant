import type { MetricConfigMap } from '../types'

/**
 * 指标元数据配置
 * 这里的 Standard 主要用于数学层的基础状态判断 (low/normal/high)
 * 更细致的年龄段判断逻辑在 RAG 层处理
 */
export const METRIC_CONFIG: MetricConfigMap = {
  weight: {
    label: '体重',
    unit: 'kg',
    type: 'trend_only',
    //告诉 Agent，分析体重时，去查 'weight_trend' 这个分类，并且查询时使用 diff (变化值) 而不是 current (绝对值)
    ragConfig: {
      label: '体重变化',
      category: 'weight_trend',
      useDiffValue: true
    },
    description: '体重只是数字，请结合体脂率和肌肉量综合看待。'
  },
  bmi: {
    label: 'BMI',
    unit: '',
    type: 'range',
    standard: { min: 18.5, max: 23.9, ideal: 21.0 },
    description: '中国标准：正常范围 18.5 ~ 23.9，超过 24 即为超重。'
  },
  bodyFatRate: {
    label: '体脂率',
    unit: '%',
    type: 'range',
    standard: { min: 20.0, max: 28.0, ideal: 23.0 },
    description: '女性必需脂肪建议在 20% 以上，23% 左右体态较紧致。'
  },
  visceralFatIndex: {
    label: '内脏脂肪',
    unit: '级',
    type: 'max',
    standard: { max: 9.0, ideal: 4.0 },
    description: '反映腹部器官脂肪堆积程度，等级越高心血管风险越大。'
  },
  muscleRate: {
    label: '肌肉率',
    unit: '%',
    type: 'min',
    standard: { min: 34.0, ideal: 38.0 },
    description: '包含骨骼肌和平滑肌，越高代表基础代谢能力越强。'
  },
  skeletalMuscleRate: {
    label: '骨骼肌率',
    unit: '%',
    type: 'range',
    standard: { min: 25.0, max: 30.0, ideal: 27.0 },
    description: '通过运动最容易改变的肌肉组织，是塑形的关键。'
  },
  waterRate: {
    label: '水分率',
    unit: '%',
    type: 'range',
    standard: { min: 45.0, max: 60.0, ideal: 55.0 },
    description: '水分充足有助于代谢，女性通常应高于 45%。'
  },
  proteinRate: {
    label: '蛋白质率',
    unit: '%',
    type: 'range',
    standard: { min: 16.0, max: 20.0, ideal: 18.0 },
    description: '缺乏蛋白质会导致肌肉流失、免疫力下降。'
  },
  boneRatio: {
    label: '骨骼率',
    unit: '%',
    type: 'trend_only',
    standard: { min: 3.5, ideal: 4.5 },
    description: '反映骨骼健康程度，剧烈节食可能导致此数值下降。'
  },
  subcutaneousFat: {
    label: '皮下脂肪',
    unit: '%',
    type: 'trend_only', // 假设单位修正为 %
    description: '存储在皮肤下的脂肪，影响外观胖瘦。'
  },
  basalMetabolism: {
    label: '基础代谢',
    unit: 'kcal',
    type: 'min',
    standard: { min: 1100 },
    description: '维持生命所需的最低能量。'
  }
}

export default METRIC_CONFIG
