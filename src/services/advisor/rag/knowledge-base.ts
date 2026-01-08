import type { KnowledgeItem } from '../types'

export const HEALTH_KNOWLEDGE_DB: KnowledgeItem[] = [
  // =================================================================
  // 1. 体重趋势 (Weight Trend)
  // 逻辑：关注变化的幅度与速度
  // =================================================================
  {
    id: 'weight_stable',
    criteria: {
      category: 'weight_trend',
      gender: 'all',
      valueRange: [-0.5, 0.5]
    },
    content: {
      interpretation: '体重保持平稳。',
      advice:
        '这是理想的状态！体重的短期波动（±0.5kg）通常是水分变化，无需焦虑。'
    }
  },
  {
    id: 'weight_gain_slow',
    criteria: {
      category: 'weight_trend',
      gender: 'all',
      valueRange: [0.6, 2.0]
    },
    content: {
      interpretation: '近期体重有小幅上升趋势。',
      principle:
        '如果是经期前一周，通常是黄体期水肿；如果是非经期，可能是近期聚餐较多或压力大导致皮质醇升高。',
      advice:
        '建议清淡饮食 2 天，多喝水帮助代谢。若在进行力量训练，这也可能是肌肉增长的信号。'
    }
  },
  {
    id: 'weight_gain_rapid',
    criteria: {
      category: 'weight_trend',
      gender: 'all',
      valueRange: [2.1, 100]
    },
    content: {
      interpretation: '体重明显上升，需引起警惕。',
      advice:
        '回顾近期是否摄入过量高油高糖食物？建议立即恢复规律饮食，停止零食，增加有氧运动时长。'
    }
  },
  {
    id: 'weight_loss_healthy',
    criteria: {
      category: 'weight_trend',
      gender: 'all',
      valueRange: [-2.0, -0.6]
    },
    content: {
      interpretation: '体重稳步下降，非常健康的减重节奏。',
      advice:
        '这个速度最不易反弹，且能保护肌肉。请继续保持当前的运动与饮食缺口。'
    }
  },
  {
    id: 'weight_loss_rapid_warning',
    criteria: {
      category: 'weight_trend',
      gender: 'all',
      valueRange: [-100, -2.1]
    },
    content: {
      interpretation: '体重下降过快，可能正在流失肌肉和水分。',
      principle:
        '过快减重（>1kg/周）会引发代谢适应，导致基础代谢降低，极易引起暴食反弹。',
      advice: '请务必增加蛋白质摄入，不要长期摄入低于 1200kcal 的热量。',
      warning: '警惕月经不调和脱发风险。'
    }
  },

  // =================================================================
  // 2. BMI (Body Mass Index) - 中国标准
  // =================================================================
  {
    id: 'bmi_underweight',
    criteria: { category: 'bmi', gender: 'all', valueRange: [0, 18.4] },
    content: {
      interpretation: 'BMI 偏瘦 (Underweight)。',
      principle:
        '虽然符合时尚审美，但过轻会影响免疫力和骨骼健康，女性可能伴随雌激素分泌不足。',
      advice: '建议适度增重，不是吃肥肉，而是通过“抗阻训练+加餐”来增加瘦体重。'
    }
  },
  {
    id: 'bmi_normal',
    criteria: { category: 'bmi', gender: 'all', valueRange: [18.5, 23.9] },
    content: {
      interpretation: 'BMI 处于中国标准健康范围。',
      advice:
        '体重数值很完美！接下来的目标是优化体成分（体脂率），追求线条感而非数字。'
    }
  },
  {
    id: 'bmi_overweight',
    criteria: { category: 'bmi', gender: 'all', valueRange: [24.0, 27.9] },
    content: {
      interpretation: '处于超重范围 (Overweight)。',
      principle: '在中国成人中，此区间已显著增加高血压、高血糖的风险。',
      advice:
        '建议开启温和减脂：将晚餐主食减半，换成粗粮（玉米、红薯），每天快走 6000 步。'
    }
  },
  {
    id: 'bmi_obese',
    criteria: { category: 'bmi', gender: 'all', valueRange: [28.0, 100] },
    content: {
      interpretation: '达到肥胖标准 (Obese)。',
      advice:
        '这是健康的红色警报。建议优先去医院检查胰岛素抵抗和甲状腺功能，并在医生指导下制定减重计划，避免盲目节食。',
      warning: '关节负担较重，暂不建议跳绳。'
    }
  },
  // --- 老年人特殊 BMI ---
  {
    id: 'bmi_elderly_optimal',
    criteria: {
      category: 'bmi',
      gender: 'all',
      ageRange: [65, 120],
      valueRange: [20.0, 26.9]
    },
    content: {
      interpretation: '对于老年人，微胖是长寿的标志。',
      principle: '老年人保留一点脂肪储备可以抵抗疾病消耗。',
      advice: '无需刻意减重，重点关注肌肉力量，防止跌倒。'
    }
  },

  // =================================================================
  // 3. 体脂率 (Body Fat Rate) - 核心审美指标
  // =================================================================
  {
    id: 'bfr_low_risk',
    criteria: {
      category: 'bodyFatRate',
      gender: 'female',
      valueRange: [0, 17.9]
    },
    content: {
      interpretation: '体脂率极低，接近女性生理极限。',
      principle:
        '除非是竞技运动员，否则长期低于 18% 可能导致闭经、骨质疏松和早衰。',
      advice:
        '请立即停止减脂，增加优质脂肪（牛油果、坚果、全蛋）摄入，恢复激素水平。'
    }
  },
  {
    id: 'bfr_athlete',
    criteria: {
      category: 'bodyFatRate',
      gender: 'female',
      valueRange: [18.0, 22.9]
    },
    content: {
      interpretation: '拥有令人羡慕的健身模特身材，线条清晰。',
      advice: '这是极佳的竞技状态，注意保持营养均衡，避免过度训练导致的疲劳。'
    }
  },
  {
    id: 'bfr_ideal',
    criteria: {
      category: 'bodyFatRate',
      gender: 'female',
      valueRange: [23.0, 27.9]
    },
    content: {
      interpretation: '体脂适中，既健康又有女性曲线美。',
      advice: '这是最容易维持且健康的区间。继续保持当前的运动习惯即可。'
    }
  },
  {
    id: 'bfr_high',
    criteria: {
      category: 'bodyFatRate',
      gender: 'female',
      valueRange: [28.0, 34.9]
    },
    content: {
      interpretation: '体脂轻度偏高，身型可能显得圆润。',
      principle: '通常是缺乏运动导致的皮下脂肪堆积。',
      advice: '建议增加无氧运动（力量训练）比例，提高肌肉量从而燃烧更多脂肪。'
    }
  },
  {
    id: 'bfr_obese',
    criteria: {
      category: 'bodyFatRate',
      gender: 'female',
      valueRange: [35.0, 100]
    },
    content: {
      interpretation: '体脂率过高，属于肥胖范畴。',
      advice:
        '重点控制精制碳水（奶茶、蛋糕、米面）。哪怕每天只运动 20 分钟，坚持下来也会有改变。'
    }
  },

  // =================================================================
  // 4. 内脏脂肪 (Visceral Fat Index) - 健康核心
  // =================================================================
  {
    id: 'vfi_optimal',
    criteria: {
      category: 'visceralFatIndex',
      gender: 'all',
      valueRange: [0, 4]
    },
    content: {
      interpretation: '内脏脂肪非常健康，代谢状态极佳。',
      advice: '你的内脏器官没有脂肪负担，患糖尿病风险极低，继续保持！'
    }
  },
  {
    id: 'vfi_normal',
    criteria: {
      category: 'visceralFatIndex',
      gender: 'all',
      valueRange: [5, 9]
    },
    content: {
      interpretation: '内脏脂肪处于正常范围。',
      advice: '注意随着年龄增长代谢变慢，需要适当控制晚餐热量以防上升。'
    }
  },
  {
    id: 'vfi_high_warning',
    criteria: {
      category: 'visceralFatIndex',
      gender: 'all',
      valueRange: [10, 14]
    },
    content: {
      interpretation: '内脏脂肪偏高，这是健康的“黄牌警告”。',
      principle: '腹部肥胖通常与压力（皮质醇）、熬夜和果糖摄入过多有关。',
      advice:
        '建议戒酒、少吃水果（果糖），保证规律睡眠。有氧运动对减内脏脂肪最有效。'
    }
  },
  {
    id: 'vfi_dangerous',
    criteria: {
      category: 'visceralFatIndex',
      gender: 'all',
      valueRange: [15, 100]
    },
    content: {
      interpretation: '内脏脂肪等级极高，高度危险。',
      advice:
        '这通常伴随着脂肪肝风险。请务必就医，并在专业指导下进行干预，切勿拖延。'
    }
  },

  // =================================================================
  // 5. 肌肉率 (Muscle Rate) - 包含骨骼肌+平滑肌+心肌
  // =================================================================
  {
    id: 'muscle_low',
    criteria: {
      category: 'muscleRate',
      gender: 'female',
      valueRange: [0, 33.9]
    },
    content: {
      interpretation: '肌肉量不足，典型的“虚胖”或“易胖”体质根源。',
      principle: '肌肉太少会导致基础代谢低，吃一点就容易胖。',
      advice:
        '不要害怕长肌肉！女性没有睾酮很难练成金刚芭比。请开始尝试举哑铃或深蹲。'
    }
  },
  {
    id: 'muscle_normal',
    criteria: {
      category: 'muscleRate',
      gender: 'female',
      valueRange: [34.0, 39.9]
    },
    content: {
      interpretation: '肌肉含量标准。',
      advice: '身体机能良好。如果想要更紧致的线条，可以针对臀腿进行塑形训练。'
    }
  },
  {
    id: 'muscle_excellent',
    criteria: {
      category: 'muscleRate',
      gender: 'female',
      valueRange: [40.0, 100]
    },
    content: {
      interpretation: '肌肉含量非常优秀！',
      advice:
        '你是行走的燃脂机器。高肌肉量能帮你延缓衰老，保护关节，请继续维持。'
    }
  },

  // =================================================================
  // 6. 骨骼肌率 (Skeletal Muscle Rate) - 真正决定体型的肌肉
  // =================================================================
  {
    id: 'smr_low',
    criteria: {
      category: 'skeletalMuscleRate',
      gender: 'female',
      valueRange: [0, 24.9]
    },
    content: {
      interpretation: '运动相关肌肉较弱，可能感觉体力差、肉松垮。',
      advice:
        '建议从大肌群训练开始（深蹲、俯卧撑、划船），这是提升骨骼肌最快的方式。'
    }
  },
  {
    id: 'smr_normal',
    criteria: {
      category: 'skeletalMuscleRate',
      gender: 'female',
      valueRange: [25.0, 29.9]
    },
    content: {
      interpretation: '骨骼肌处于健康范围。',
      advice: '如果想进一步提升代谢，可以尝试 HIIT（高强度间歇训练）。'
    }
  },
  {
    id: 'smr_high',
    criteria: {
      category: 'skeletalMuscleRate',
      gender: 'female',
      valueRange: [30.0, 100]
    },
    content: {
      interpretation: '骨骼肌发达，属于运动健将级别。',
      advice: '非常棒！请注意运动后的拉伸和筋膜放松，保持肌肉弹性。'
    }
  },

  // =================================================================
  // 7. 基础代谢 (Basal Metabolism) - 燃脂引擎
  // =================================================================
  {
    id: 'bmr_low_alert',
    criteria: {
      category: 'basalMetabolism',
      gender: 'female',
      valueRange: [0, 1099]
    },
    content: {
      interpretation: '基础代谢偏低。',
      principle:
        '这可能是长期节食、久坐或肌肉过少造成的“代谢损伤”。身体进入了省电模式。',
      advice:
        '停止低热量节食！逐渐增加碳水摄入（反向饮食），通过力量训练唤醒代谢。'
    }
  },
  {
    id: 'bmr_normal',
    criteria: {
      category: 'basalMetabolism',
      gender: 'female',
      valueRange: [1100, 1299]
    },
    content: {
      interpretation: '基础代谢正常。',
      advice: '维持正常的三餐，不要暴饮暴食即可维持体重。'
    }
  },
  {
    id: 'bmr_high',
    criteria: {
      category: 'basalMetabolism',
      gender: 'female',
      valueRange: [1300, 10000]
    },
    content: {
      interpretation: '基础代谢较高，令人羡慕的“易瘦体质”。',
      advice: '这通常归功于较高的肌肉量或年轻的基因。记得多喝水支持高代谢需求。'
    }
  },

  // =================================================================
  // 8. 水分率 (Water Rate)
  // =================================================================
  {
    id: 'water_low_dehydrated',
    criteria: {
      category: 'waterRate',
      gender: 'female',
      valueRange: [0, 44.9]
    },
    content: {
      interpretation: '体内水分不足，或肌肉量太少（肌肉锁水）。',
      advice:
        '皮肤可能会干燥。建议每天喝够 8 杯水，如果是肌肉少引起，光喝水没用，要增肌。'
    }
  },
  {
    id: 'water_normal',
    criteria: {
      category: 'waterRate',
      gender: 'female',
      valueRange: [45.0, 60.0]
    },
    content: {
      interpretation: '细胞水合状态良好。',
      advice: '继续保持。运动后记得补充电解质水。'
    }
  },
  {
    id: 'water_high_edema',
    criteria: {
      category: 'waterRate',
      gender: 'female',
      valueRange: [60.1, 100]
    },
    content: {
      interpretation: '水分率偏高，可能有水肿情况。',
      advice:
        '若处于生理期前属于正常现象。平时少吃盐，多吃含钾食物（香蕉、冬瓜）排水。'
    }
  },

  // =================================================================
  // 9. 蛋白质率 (Protein Rate)
  // =================================================================
  {
    id: 'protein_insufficient',
    criteria: {
      category: 'proteinRate',
      gender: 'female',
      valueRange: [0, 15.9]
    },
    content: {
      interpretation: '蛋白质储备不足。',
      principle: '不仅影响肌肉合成，还可能导致免疫力下降、头发干枯。',
      advice:
        '每顿饭必须有“掌心大小”的肉/蛋/奶/豆。早餐不要只吃稀饭馒头，加个蛋！'
    }
  },
  {
    id: 'protein_sufficient',
    criteria: {
      category: 'proteinRate',
      gender: 'female',
      valueRange: [16.0, 100]
    },
    content: {
      interpretation: '营养状况良好，蛋白质充足。',
      advice: '这是抗衰老和维持免疫力的关键。继续保持优质蛋白摄入。'
    }
  },

  // =================================================================
  // 10. 骨骼率/骨量 (Bone Mass)
  // =================================================================
  {
    id: 'bone_low_risk',
    criteria: { category: 'boneRatio', gender: 'female', valueRange: [0, 1.9] }, // 假设单位kg
    content: {
      interpretation: '骨量偏低，有骨质疏松风险。',
      advice:
        '必须重视补钙和维生素D。更重要的是进行“负重运动”（如跳绳、慢跑），重力刺激才能长骨头。'
    }
  },
  {
    id: 'bone_normal',
    criteria: {
      category: 'boneRatio',
      gender: 'female',
      valueRange: [2.0, 100]
    },
    content: {
      interpretation: '骨骼健康。',
      advice: '年轻时多存骨量，老了才不弯腰。保持喝奶和晒太阳的习惯。'
    }
  },

  // =================================================================
  // 通用/兜底 (General Fallback) - 防止数值落空
  // =================================================================
  {
    id: 'general_fallback_diet',
    criteria: { category: 'diet', gender: 'all' }, // 无 valueRange
    content: {
      interpretation: '饮食建议',
      advice:
        '遵循“地中海饮食”原则：多吃全谷物、蔬菜、橄榄油和鱼类，少吃红肉和糖。这是目前公认最健康的饮食模式。'
    }
  },
  {
    id: 'general_fallback_exercise',
    criteria: { category: 'exercise', gender: 'all' },
    content: {
      interpretation: '运动建议',
      advice:
        '最好的运动是你愿意坚持的那一个。哪怕每天只是快走 20 分钟，长期坚持的效果也优于突击式训练。'
    }
  }
]
