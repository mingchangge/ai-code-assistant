// 集中管理参数，方便后期微调。
import type { OcrConfig } from './types'

export const MODEL_PATHS = {
  LAYOUT_MODEL: '/models/layout_model/model.json',
  OCR_MODEL: '/models/ocr_model/crnn_finetuned_web.onnx',
  CHARSET: '/models/ocr_model/charset.txt',
  WASM_PATH: '/models/ocr_model/'
}

export const CONSTANTS = {
  OCR_INPUT_HEIGHT: 64, // 必须与训练脚本中的 IMAGE_HEIGHT 一致
  OCR_INPUT_WIDTH: 256, // 必须与训练脚本中的 IMAGE_WIDTH 一致
  LAYOUT_INPUT_SIZE: 640, // 布局检测模型输入尺寸
  CONFIDENCE_THRESHOLD: 0.5 // 布局检测置信度阈值
}
// NMS (非极大值抑制) 配置
export const LAYOUT_NMS = {
  MAX_OUTPUT_SIZE: 200, // 最多保留多少个框
  IOU_THRESHOLD: 0.65 // 重叠度超过 65% 认为是同一个物体
}
// 策略 A: 标准模式 (适合大多数情况，保留灰度细节以识别小数点)
export const CONFIG_STANDARD: OcrConfig = {
  padLeft: 2,
  padRight: 2,
  padTop: 2,
  padBottom: 2,
  binarize: false,
  binarizeThreshold: 0,
  resizeMethod: 'bilinear' // 关键：保留小数点
}

// 策略 B: 激进模式 (适合抓取丢失的负号或边缘字符)
export const CONFIG_AGGRESSIVE: OcrConfig = {
  padLeft: 6, // 大幅增加左侧 Padding 抓负号
  padRight: 2,
  padTop: 2,
  padBottom: 2,
  binarize: true, // 开启二值化增强对比度
  binarizeThreshold: 110, // 阈值需根据实际图片亮度调整
  resizeMethod: 'nearest' // 二值化后用最近邻插值保持边缘清晰
}
