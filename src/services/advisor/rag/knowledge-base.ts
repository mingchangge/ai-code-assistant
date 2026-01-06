import type { KnowledgeItem } from '../types'

/**
 * 💡 知识库数据源
 * 包含：中老年女性专属、青少年女性专属、通用兜底
 */
export const HEALTH_KNOWLEDGE_DB: KnowledgeItem[] = [
  // ==========================================
  // 1. 中老年女性 (30-50+) - 复用你的高价值数据
  // ==========================================
  {
    id: 'body_fat_female_30_39',
    category: 'body_fat',
    gender: 'female',
    age_group: '30-39',
    normal_min: 21,
    normal_max: 33,
    overweight_threshold: 33,
    obese_threshold: 39,
    interpretation:
      '此阶段雌激素水平仍较稳定，但基础代谢开始缓慢下降。体脂率 >33% 可能增加胰岛素抵抗风险。',
    advice:
      '每周进行 150 分钟中等强度有氧（如快走、游泳）+ 2 次力量训练，有助于维持肌肉、控制体脂。'
  },
  {
    id: 'body_fat_female_40_49',
    category: 'body_fat',
    gender: 'female',
    age_group: '40-49',
    normal_min: 23,
    normal_max: 35,
    overweight_threshold: 35,
    obese_threshold: 40,
    interpretation:
      '围绝经期开始，雌激素波动导致脂肪更易堆积于腹部。即使体重不变，体脂率也可能上升。',
    advice:
      '重点加强核心与下肢力量训练（如深蹲、臀桥），配合高蛋白饮食（1.2–1.6g/kg/天），减缓肌肉流失。'
  },
  {
    id: 'body_fat_female_50_plus',
    category: 'body_fat',
    gender: 'female',
    age_group: '50+',
    normal_min: 24,
    normal_max: 36,
    overweight_threshold: 36,
    obese_threshold: 42,
    interpretation:
      '绝经后雌激素显著下降，脂肪分布转向腹部，内脏脂肪风险升高。体脂率 >36% 与心血管疾病强相关。',
    advice:
      '优先控制腰围（<80cm），采用“抗阻训练 + 优质脂肪”策略（如坚果、深海鱼），避免节食导致肌肉进一步流失。'
  },
  {
    id: 'body_fat_female_30_39_low',
    category: 'body_fat',
    gender: 'female',
    age_group: '30-39',
    normal_min: 21,
    normal_max: 33,
    low_threshold: 21,
    interpretation:
      '体脂率过低可能影响月经周期和骨密度，尤其在高强度运动或节食人群中常见。',
    advice:
      '适当增加健康脂肪摄入（如牛油果、坚果、橄榄油），确保每日热量不低于基础代谢率。'
  },
  {
    id: 'body_fat_female_40_49_low',
    category: 'body_fat',
    gender: 'female',
    age_group: '40-49',
    normal_min: 23,
    normal_max: 35,
    low_threshold: 23,
    interpretation:
      '围绝经期体脂过低可能加剧潮热、失眠等更年期症状，并加速骨流失。',
    advice: '避免极端节食，保证充足蛋白质与必需脂肪酸，必要时咨询营养师。'
  },
  {
    id: 'body_fat_female_50_plus_low',
    category: 'body_fat',
    gender: 'female',
    age_group: '50+',
    normal_min: 24,
    normal_max: 36,
    low_threshold: 24,
    interpretation:
      '绝经后体脂过低会削弱雌激素替代作用，增加骨质疏松和免疫力下降风险。',
    advice: '关注体成分而非单纯减重，维持适度体脂有助于激素平衡和整体健康。'
  },
  {
    id: 'bmi_female_normal',
    category: 'bmi',
    gender: 'female',
    bmi_min: 18.5,
    bmi_max: 23.9,
    interpretation:
      '中国女性 BMI 正常上限低于国际标准（24 vs 25）。BMI 正常但体脂高者称为“瘦胖子”，需结合体脂率判断。',
    advice: '若 BMI 正常但体脂超标，应减少精制碳水，增加蛋白质与膳食纤维摄入。'
  },
  {
    id: 'bmi_female_overweight',
    category: 'bmi',
    gender: 'female',
    bmi_min: 24.0,
    bmi_max: 27.9,
    interpretation: '2 型糖尿病、高血压风险增加 2–3 倍',
    advice:
      '目标每周减重 0.5kg，每日热量缺口 300–500kcal。推荐地中海饮食模式（蔬菜+全谷+橄榄油+鱼）。'
  },
  {
    id: 'bmi_female_obese',
    category: 'bmi',
    gender: 'female',
    bmi_min: 28.0,
    bmi_max: 100,
    interpretation: '关节负担加重、睡眠呼吸暂停、乳腺癌风险上升',
    advice:
      '联合营养师制定计划，优先改善体成分（减脂增肌），而非单纯减重。可考虑加入水中运动减轻关节压力。'
  },
  {
    id: 'muscle_mass_female_30_39',
    category: 'muscle',
    gender: 'female',
    age_group: '30-39',
    normal_min_percent: 28,
    normal_max_percent: 33,
    low_threshold: 27,
    interpretation:
      '30 岁后肌肉每年流失约 1%，久坐加速流失。肌肉量低会降低基础代谢，易反弹。',
    advice:
      '每周 2–3 次抗阻训练（弹力带/哑铃），每餐摄入 20–30g 优质蛋白（鸡蛋、豆制品、瘦肉）。'
  },
  {
    id: 'muscle_mass_female_40_49',
    category: 'muscle',
    gender: 'female',
    age_group: '40-49',
    normal_min_percent: 27,
    normal_max_percent: 32,
    low_threshold: 26,
    interpretation:
      '围绝经期肌肉合成效率下降，需更高蛋白摄入与更强刺激才能维持。',
    advice: '训练后 30 分钟内补充蛋白质（如乳清蛋白+香蕉），促进肌肉修复。'
  },
  {
    id: 'muscle_mass_female_50_plus',
    category: 'muscle',
    gender: 'female',
    age_group: '50+',
    normal_min_percent: 25,
    normal_max_percent: 30,
    low_threshold: 24,
    interpretation: '绝经后肌肉流失加速，与骨质疏松、跌倒风险正相关。',
    advice:
      '重点训练平衡与下肢力量（如单腿站立、靠墙静蹲），预防跌倒。每日蛋白摄入 ≥1.6g/kg。'
  },
  {
    id: 'muscle_mass_female_high',
    category: 'muscle',
    gender: 'female',
    high_threshold_percent: 33,
    interpretation: '通常为规律力量训练者，是代谢健康的积极信号。',
    advice: '继续保持训练与营养，注意充分恢复，避免过度训练。'
  },
  {
    id: 'body_water_female_30_39',
    category: 'water',
    gender: 'female',
    age_group: '30-39',
    normal_min: 45,
    normal_max: 60,
    low_threshold: 43,
    interpretation:
      '水分率反映肌肉与体脂比例（肌肉含水 73%，脂肪含水 10%）。水分低常伴随肌肉少、体脂高。',
    advice:
      '每日饮水 1.5–2L，避免用咖啡/茶完全替代白水。运动后补充电解质（如淡盐水、椰子水）。'
  },
  {
    id: 'body_water_female_40_49',
    category: 'water',
    gender: 'female',
    age_group: '40-49',
    normal_min: 43,
    normal_max: 58,
    low_threshold: 41,
    interpretation:
      '激素变化可能影响水钠平衡，部分女性出现“水肿-脱水”交替现象。',
    advice: '减少高盐加工食品，增加富含钾的食物（香蕉、菠菜、紫菜）帮助排水。'
  },
  {
    id: 'body_water_female_50_plus',
    category: 'water',
    gender: 'female',
    age_group: '50+',
    normal_min: 40,
    normal_max: 55,
    low_threshold: 38,
    interpretation: '口渴感减弱，老年人易慢性脱水，影响认知与肾功能。',
    advice: '设定饮水提醒，晨起空腹喝温水，观察尿液颜色（淡黄为佳）。'
  },
  {
    id: 'body_water_female_high',
    category: 'water',
    gender: 'female',
    high_threshold: 60,
    interpretation: '可能因肌肉量高、近期大量饮水或轻度水肿引起。',
    advice: '若无不适（如手脚肿胀），通常无需干预。结合其他指标综合判断。'
  },
  {
    id: 'visceral_fat_female_normal',
    category: 'visceral_fat',
    gender: 'female',
    level_min: 1,
    level_max: 9,
    interpretation:
      '内脏脂肪包裹器官，分泌炎症因子，是“隐形肥胖”的核心指标。即使 BMI 正常，内脏脂肪高仍危险。',
    advice:
      '减少添加糖与反式脂肪（奶茶、糕点、油炸食品），增加 Omega-3（深海鱼、亚麻籽）。'
  },
  {
    id: 'visceral_fat_female_high',
    category: 'visceral_fat',
    gender: 'female',
    level_min: 10,
    level_max: 12,
    interpretation: '胰岛素抵抗、脂肪肝、心血管疾病风险显著升高',
    advice:
      '优先通过快走、跳绳等有氧运动消耗内脏脂肪。避免夜间进食，控制精制碳水。'
  },
  {
    id: 'visceral_fat_female_very_high',
    category: 'visceral_fat',
    gender: 'female',
    level_min: 13,
    level_max: 59,
    interpretation: '高度提示代谢综合征，需医学评估',
    advice: '建议尽快就医，检查血压、空腹血糖、血脂，评估心血管风险。'
  },
  {
    id: 'bone_mass_female_30_39',
    category: 'bone',
    gender: 'female',
    age_group: '30-39',
    normal_min_kg: 2.2,
    normal_max_kg: 3.2,
    interpretation:
      '30 岁左右骨密度达峰值，之后缓慢下降。充足钙与维生素 D 是关键。',
    advice:
      '每日钙摄入 800mg（牛奶 300ml ≈ 300mg），晒太阳 15 分钟/天促进维 D 合成。'
  },
  {
    id: 'bone_mass_female_40_49',
    category: 'bone',
    gender: 'female',
    age_group: '40-49',
    normal_min_kg: 2.1,
    normal_max_kg: 3.1,
    interpretation: '雌激素下降加速骨流失，每年约 0.5%–1%。',
    advice:
      '增加负重运动（如爬楼梯、跳舞），避免长期饮用碳酸饮料（影响钙吸收）。'
  },
  {
    id: 'bone_mass_female_50_plus',
    category: 'bone',
    gender: 'female',
    age_group: '50+',
    normal_min_kg: 2.0,
    normal_max_kg: 3.0,
    interpretation: '骨质疏松高发期',
    advice:
      '每日钙 1000mg + 维 D 800–1000IU。可做骨密度检测（DXA），必要时药物干预。'
  },
  {
    id: 'bone_mass_female_low',
    category: 'bone',
    gender: 'female',
    low_threshold_kg: 2.0,
    interpretation:
      '骨量偏低提示骨密度下降，增加骨折风险，尤其在 50 岁以上女性中需警惕。',
    advice: '尽快安排骨密度检测，加强钙与维生素 D 补充，避免跌倒。'
  },
  {
    id: 'bmr_female_30_39',
    category: 'bmr',
    gender: 'female',
    age_group: '30-39',
    formula: 'BMR = 10*weight + 6.25*height - 5*age - 161',
    interpretation:
      '30 岁后 BMR 每 10 年下降约 2–3%。节食会进一步降低 BMR，导致平台期。',
    advice:
      '避免长期 <1200kcal/天饮食。通过增肌提升 BMR（1kg 肌肉日耗 13kcal）。'
  },
  {
    id: 'bmr_female_40_49',
    category: 'bmr',
    gender: 'female',
    age_group: '40-49',
    decline_percent: '5-8%',
    interpretation: '比 30 岁时下降 5%–8%',
    advice:
      '记录饮食 3 天，确保热量不低于 BMR。用“小份多餐”稳定血糖，减少暴食冲动。'
  },
  {
    id: 'bmr_female_50_plus',
    category: 'bmr',
    gender: 'female',
    age_group: '50+',
    decline_percent: '10-15%',
    interpretation: '比 30 岁时下降 10%–15%',
    advice:
      '重点保证蛋白质与微量营养素，而非单纯控制热量。可使用 App 追踪营养均衡度。'
  },
  {
    id: 'weight_trend_weekly_loss_safe',
    category: 'weight_trend',
    gender: 'female',
    safe_loss_kg_per_week_min: 0.25,
    safe_loss_kg_per_week_max: 0.5,
    interpretation: '过快减重（>1kg/周）易流失肌肉、胆囊疾病风险上升。',
    advice: '关注“体脂下降”而非“体重数字”。月经周期、水肿会影响短期体重波动。'
  },
  {
    id: 'weight_plateau_breakthrough',
    category: 'weight_trend',
    gender: 'female',
    plateau_days: 14,
    interpretation: '体重平台期 >2 周',
    advice:
      '1. 改变运动模式（如有氧→HIIT）\n2. 增加蛋白质至 1.6g/kg\n3. 安排 1–2 天“热量重置日”（摄入≈TDEE）'
  },
  {
    id: 'menopause_weight_gain',
    category: 'menopause',
    gender: 'female',
    age_group: '45-55',
    interpretation:
      '围绝经期（45–55 岁）：腹部脂肪堆积、肌肉流失、食欲调节紊乱',
    advice:
      '优先管理压力（皮质醇升高促腹脂）；补充大豆异黄酮（豆腐、豆浆）缓解潮热；避免夜间进食（影响褪黑素与代谢）。'
  },
  {
    id: 'protein_intake_female_muscle',
    category: 'nutrition',
    gender: 'female',
    protein_g_per_kg_min: 1.2,
    protein_g_per_kg_max: 1.6,
    interpretation: '维持/增加肌肉所需蛋白质量',
    advice:
      '每餐 20–30g（如：3 个鸡蛋 + 100g 鸡胸）。植物来源：豆腐、藜麦、鹰嘴豆、坚果。'
  },
  {
    id: 'sleep_and_metabolism',
    category: 'lifestyle',
    gender: 'female',
    sleep_hours_min: 6,
    interpretation: '睡眠 <6 小时 → 饥饿素↑、瘦素↓ → 食欲增加 20%',
    advice: '固定入睡时间，睡前 1 小时避免蓝光。可尝试镁补充剂改善睡眠质量。'
  },
  {
    id: 'stress_cortisol_belly_fat',
    category: 'lifestyle',
    gender: 'female',
    interpretation: '长期压力 → 皮质醇升高 → 脂肪向腹部堆积',
    advice: '每天 10 分钟正念呼吸、瑜伽、写感恩日记，有效降低皮质醇。'
  },
  {
    id: 'hydration_and_appetite',
    category: 'lifestyle',
    gender: 'female',
    interpretation: '轻度脱水常被误判为“饥饿”',
    advice: '餐前喝 1 杯水，减少无意识进食。'
  },
  {
    id: 'alcohol_and_body_fat',
    category: 'lifestyle',
    gender: 'female',
    alcohol_servings_per_week_max: 2,
    interpretation: '酒精优先供能，抑制脂肪燃烧；1g 酒精 = 7kcal',
    advice: '每周 ≤2 次，每次 ≤1 标准杯（红酒 150ml）'
  },
  {
    id: 'fiber_intake_for_satiety',
    category: 'nutrition',
    gender: 'female',
    fiber_g_per_day_min: 25,
    fiber_g_per_day_max: 30,
    interpretation: '延缓胃排空，稳定血糖，减少零食欲望',
    advice: '来源：燕麦、奇亚籽、西兰花、苹果带皮'
  },
  {
    id: 'resistance_training_start_guide',
    category: 'exercise',
    gender: 'female',
    interpretation: '新手建议',
    advice:
      '从自重训练开始（靠墙静蹲、跪姿俯卧撑）；每周 2 次，每次 20 分钟；重点动作：深蹲、硬拉、推举、划船'
  },
  {
    id: 'walking_for_fat_loss',
    category: 'exercise',
    gender: 'female',
    minutes_per_week_min: 150,
    minutes_per_week_max: 300,
    interpretation: '快走（心率达最大心率 60–70%）',
    advice: '饭后 30 分钟开始，有助控血糖'
  },
  {
    id: 'menstrual_cycle_and_weight',
    category: 'hormone',
    gender: 'female',
    age_group: '30-49',
    interpretation:
      '黄体期（月经前 1 周）：水分潴留，体重 ↑1–2kg；月经期：体重回落',
    advice: '不要在黄体期称体重做决策，关注 28 天趋势线'
  },
  {
    id: 'thyroid_and_metabolism',
    category: 'health_warning',
    gender: 'female',
    symptoms: ['怕冷', '疲劳', '脱发', '体重莫名上升'],
    interpretation: '警示信号：甲状腺功能减退',
    advice: '若怀疑甲减，检查 TSH、FT3、FT4'
  },
  {
    id: 'vitamin_d_deficiency_signs',
    category: 'nutrition',
    gender: 'female',
    symptoms: ['乏力', '肌肉酸痛', '情绪低落'],
    interpretation: '血清 25(OH)D <30ng/ml 需补充',
    advice: '目标血浓度 40–60ng/ml，可通过日晒或补充剂达成'
  },
  {
    id: 'calcium_absorption_tips',
    category: 'nutrition',
    gender: 'female',
    interpretation:
      '促进：维 D、胃酸、运动；抑制：草酸（菠菜）、植酸（全谷）、咖啡因',
    advice: '高草酸蔬菜焯水后再吃，钙片随餐服用'
  },
  {
    id: 'intermittent_fasting_caution',
    category: 'diet',
    gender: 'female',
    not_recommended_for: [
      '进食障碍史',
      '甲状腺功能异常',
      '围绝经期情绪不稳定者'
    ],
    interpretation: '不推荐人群',
    advice: '替代方案：规律三餐 + 控制晚餐碳水'
  },
  {
    id: 'healthy_fats_for_hormones',
    category: 'nutrition',
    gender: 'female',
    interpretation: '必需脂肪酸：Omega-3（抗炎）、胆固醇（激素原料）',
    advice: '推荐食物：三文鱼、核桃、牛油果、蛋黄、橄榄油'
  },
  {
    id: 'sugar_craving_management',
    category: 'lifestyle',
    gender: 'female',
    causes: ['血糖波动', '压力', '睡眠不足'],
    advice: '吃复合碳水（燕麦、红薯）；补充铬（西兰花、葡萄汁）；咀嚼无糖口香糖'
  },
  {
    id: 'gut_health_and_weight',
    category: 'nutrition',
    gender: 'female',
    interpretation: '肠道菌群失衡 → 炎症 → 胰岛素抵抗',
    advice: '每日摄入益生元（洋葱、大蒜、香蕉）+ 益生菌（无糖酸奶、泡菜）'
  },
  {
    id: 'water_retention_relieve',
    category: 'lifestyle',
    gender: 'female',
    advice:
      '减少盐（<5g/天）；增加钾（香蕉、菠菜）；抬腿 10 分钟/天；穿压缩袜（久站者）'
  },
  {
    id: 'morning_routine_for_metabolism',
    category: 'lifestyle',
    gender: 'female',
    advice:
      '黄金 30 分钟：1. 空腹喝温水；2. 晒太阳 10 分钟；3. 轻度拉伸或散步 → 启动代谢节律'
  },
  {
    id: 'evening_habits_for_recovery',
    category: 'lifestyle',
    gender: 'female',
    advice:
      '晚餐早吃（睡前 3 小时）；泡脚 15 分钟；写明日计划（减少焦虑） → 提升睡眠质量'
  },
  {
    id: 'body_composition_vs_scale',
    category: 'mindset',
    gender: 'female',
    interpretation: '体重数字 ≠ 健康',
    advice: '关注：体脂率 ↓、肌肉量 ↑、腰围 ↓；每月测一次体脂，而非每天称体重'
  },
  {
    id: 'realistic_goal_setting',
    category: 'mindset',
    gender: 'female',
    advice:
      'SMART 原则：Specific（体脂降到 30%）、Measurable（体脂秤追踪）、Achievable（3 个月减 3%）、Relevant（为健康）、Time-bound（设截止日）'
  },
  {
    id: 'motivation_sustainability',
    category: 'mindset',
    gender: 'female',
    advice:
      '记录非体重成就（如“能爬 5 楼不喘”）；加入女性健康社群；奖励机制（非食物奖励）'
  },
  {
    id: 'hormone_testing_when_to_consider',
    category: 'health_warning',
    gender: 'female',
    indicators: [
      '体脂持续上升但饮食运动无变化',
      '严重疲劳',
      '脱发',
      '月经紊乱'
    ],
    tests: ['性激素六项', '甲状腺功能', '皮质醇'],
    advice: '建议就医评估内分泌状态'
  },
  {
    id: 'soy_and_estrogen_myth',
    category: 'nutrition',
    gender: 'female',
    safe_servings_per_day: '1-2',
    interpretation: '大豆异黄酮是植物雌激素，作用微弱且双向调节',
    advice:
      '1 份 = 1 杯豆浆 or 100g 豆腐；可缓解更年期潮热，不增加乳腺癌风险（WHO）'
  },
  {
    id: 'collagen_supplement_evidence',
    category: 'supplement',
    gender: 'female',
    effectiveness: '可能改善皮肤弹性，对关节疼痛有缓解',
    advice:
      '对体脂/肌肉无直接作用；优先通过饮食获取（骨汤、鱼皮），非必需补充剂'
  },
  {
    id: 'caffeine_metabolism_impact',
    category: 'lifestyle',
    gender: 'female',
    max_mg_per_day: 400,
    interpretation: '适量提升运动表现；过量升高皮质醇、影响睡眠 → 反促腹脂',
    advice: '下午 2 点后避免咖啡因'
  },
  {
    id: 'meal_timing_myth',
    category: 'diet',
    gender: 'female',
    interpretation: '总热量与营养质量 > 进食时间',
    advice:
      '例外：晚餐过晚（<睡前 2 小时）可能影响血糖控制；建议根据作息安排，保持规律即可'
  },
  {
    id: 'scale_vs_tape_measure',
    category: 'measurement',
    gender: 'female',
    waist_target_cm: 80,
    interpretation: '内脏脂肪增加时，腰围 ↑ 早于体重 ↑',
    advice: '测量方法：肚脐上 2cm，呼气时测量；目标：女性 <80cm'
  },
  {
    id: 'exercise_consistency_over_intensity',
    category: 'exercise',
    gender: 'female',
    interpretation: '研究结论：每周 3 次 30 分钟中等强度，优于每月 1 次高强度',
    advice: '选择喜欢的运动（跳舞、徒步、瑜伽），可持续才是王道'
  },
  {
    id: 'social_support_for_health_goals',
    category: 'mindset',
    gender: 'female',
    statistic: '有伙伴监督者，成功率提高 65%',
    advice: '找一位“健康搭子”，互相打卡鼓励'
  },
  {
    id: 'mindful_eating_practice',
    category: 'lifestyle',
    gender: 'female',
    advice:
      '吃饭时不看手机；每口咀嚼 20 次；餐前问：“我真饿吗？” → 减少 20% 无意识进食'
  },
  {
    id: 'seasonal_weight_fluctuation',
    category: 'lifestyle',
    gender: 'female',
    normal_fluctuation_kg: '0.5-1',
    interpretation: '冬季体重 ↑0.5–1kg（代谢适应、活动减少）',
    advice: '接受小幅波动，春季自然回落，无需过度干预'
  },
  {
    id: 'postpartum_body_recovery',
    category: 'special_stage',
    gender: 'female',
    age_group: '25-45',
    timeline: '0–6 月：优先恢复盆底肌、核心；6–12 月：逐步加入有氧与力量',
    caution: '腹直肌分离者避免卷腹',
    advice: '产后 6 周经医生评估后再开始运动'
  },
  {
    id: 'perimenopause_symptom_management',
    category: 'menopause',
    gender: 'female',
    age_group: '45-55',
    symptoms: ['潮热', '失眠', '情绪波动', '体重增加'],
    non_drug_interventions: [
      '黑升麻提取物（需医生指导）',
      '认知行为疗法（CBT）',
      '温和运动（太极、瑜伽）'
    ],
    advice: '建议咨询医生评估具体情况'
  },
  {
    id: 'healthy_aging_mindset',
    category: 'mindset',
    gender: 'female',
    core_belief: '健康 ≠ 年轻，而是“功能良好、活力充沛”',
    advice: '关注“我能做什么”，而非“我看起来如何”'
  },
  {
    id: 'body_fat_female_30_39_athlete',
    category: 'body_fat',
    gender: 'female',
    age_group: '30-39',
    athlete_range_min: 14,
    athlete_range_max: 20,
    interpretation: '运动员体脂率通常低于常人，但需确保月经正常、无疲劳性骨折',
    advice: '定期评估能量可用性（EA），避免 RED-S（相对能量缺乏综合征）'
  },
  {
    id: 'body_fat_female_40_49_athlete',
    category: 'body_fat',
    gender: 'female',
    age_group: '40-49',
    athlete_range_min: 16,
    athlete_range_max: 22,
    interpretation: '围绝经期运动员需特别关注骨健康与激素平衡',
    advice: '确保充足热量与钙摄入，避免过度训练'
  },
  {
    id: 'body_fat_female_50_plus_athlete',
    category: 'body_fat',
    gender: 'female',
    age_group: '50+',
    athlete_range_min: 18,
    athlete_range_max: 24,
    interpretation: '活跃老年女性可维持较低体脂，但需警惕肌肉流失',
    advice: '结合抗阻训练与充足蛋白，维持功能性体能'
  },
  {
    id: 'muscle_mass_female_sarcopenia_risk',
    category: 'muscle',
    gender: 'female',
    age_group: '50+',
    sarcopenia_threshold_percent: 22,
    interpretation: '肌肉量 <22% 提示肌少症风险，与跌倒、失能强相关',
    advice: '立即启动抗阻训练计划，每日蛋白 ≥1.6g/kg，必要时就医评估'
  },
  {
    id: 'visceral_fat_female_waist_correlation',
    category: 'visceral_fat',
    gender: 'female',
    waist_cm_80_visceral_level: 10,
    interpretation: '腰围 ≥80cm 时，内脏脂肪等级通常 ≥10',
    advice: '优先测量腰围，作为内脏脂肪的简易筛查工具'
  },
  {
    id: 'bmi_female_elderly_caution',
    category: 'bmi',
    gender: 'female',
    age_group: '65+',
    optimal_bmi_min: 22,
    optimal_bmi_max: 27,
    interpretation: '老年人 BMI 略高（22–27）与更低死亡率相关，避免过度减重',
    advice: '关注肌肉量与功能状态，而非追求“标准体重”'
  },
  {
    id: 'protein_distribution_optimal',
    category: 'nutrition',
    gender: 'female',
    meals_per_day: 3,
    protein_per_meal_g_min: 20,
    protein_per_meal_g_max: 30,
    interpretation: '均匀分配蛋白摄入比集中一餐更利于肌肉合成',
    advice: '早餐加入鸡蛋/希腊酸奶，午餐晚餐包含瘦肉/豆制品'
  },
  {
    id: 'vitamin_b12_deficiency_elderly',
    category: 'nutrition',
    gender: 'female',
    age_group: '50+',
    risk_factors: ['胃酸减少', '长期素食', '二甲双胍使用'],
    symptoms: ['乏力', '手脚麻木', '记忆力下降'],
    advice: '50 岁以上女性建议定期检测 B12，必要时补充活性形式（甲钴胺）'
  },
  {
    id: 'omega3_for_inflammation',
    category: 'nutrition',
    gender: 'female',
    epa_dha_mg_per_day_min: 500,
    sources: ['三文鱼', '沙丁鱼', '亚麻籽', '核桃'],
    interpretation: 'Omega-3 具有抗炎作用，有助于缓解更年期关节痛和心血管保护',
    advice: '每周吃 2 次深海鱼，或补充高质量鱼油'
  },
  {
    id: 'resistance_band_training_guide',
    category: 'exercise',
    gender: 'female',
    equipment: '弹力带',
    advantages: ['便携', '关节友好', '适合居家'],
    recommended_exercises: ['弹力带深蹲', '划船', '肩推', '臀桥'],
    advice: '从轻阻力开始，注重动作形式，每周 2–3 次'
  },
  {
    id: 'yoga_for_menopause',
    category: 'exercise',
    gender: 'female',
    age_group: '45-60',
    benefits: ['缓解潮热', '改善睡眠', '降低焦虑'],
    recommended_styles: ['哈他瑜伽', '阴瑜伽', '修复瑜伽'],
    advice: '每周 2–3 次，每次 30–60 分钟，避免高温瑜伽'
  },
  {
    id: 'hydration_needs_active_female',
    category: 'lifestyle',
    gender: 'female',
    activity_level: 'active',
    water_ml_per_kg: 35,
    interpretation: '活跃女性需更多水分支持代谢与恢复',
    advice: '运动中每 15–20 分钟补水 150–200ml'
  },
  {
    id: 'sleep_quality_over_quantity',
    category: 'lifestyle',
    gender: 'female',
    deep_sleep_target_percent: 20,
    interpretation: '深度睡眠比例比总时长更能反映恢复质量',
    advice: '保持卧室黑暗凉爽，避免睡前饮酒（虽助眠但破坏深度睡眠）'
  },
  {
    id: 'stress_eating_coping_strategies',
    category: 'lifestyle',
    gender: 'female',
    alternatives: [
      '散步 10 分钟',
      '深呼吸 4-7-8 法',
      '涂色/拼图',
      '给朋友打电话'
    ],
    advice: '建立“情绪-行为”替代清单，打破自动进食反应'
  },
  {
    id: 'healthy_snack_choices',
    category: 'nutrition',
    gender: 'female',
    examples: ['希腊酸奶+莓果', '苹果+花生酱', '煮鸡蛋', '混合坚果（一小把）'],
    avoid: ['饼干', '蛋糕', '含糖酸奶', '果汁'],
    advice: '选择含蛋白+纤维的组合，稳定血糖'
  },
  {
    id: 'meal_prep_for_consistency',
    category: 'lifestyle',
    gender: 'female',
    strategy:
      '周末准备 3–4 种主菜基底（如烤鸡胸、藜麦、蒸蔬菜），工作日快速组合',
    benefit: '减少外卖依赖，控制热量与营养',
    advice: '使用玻璃餐盒分装，冷藏保存 ≤4 天'
  },
  {
    id: 'positive_self_talk_practice',
    category: 'mindset',
    gender: 'female',
    examples: ['我在为健康努力，这值得骄傲', '身体支持我每一天，我要善待它'],
    advice: '每天早晨对镜说一句肯定语，重建身体意象'
  },
  {
    id: 'community_support_importance',
    category: 'mindset',
    gender: 'female',
    research_finding: '参与女性健康小组者，坚持健康行为的概率提高 2 倍',
    advice: '加入线上/线下女性健康社群，分享经验，获得支持'
  },
  {
    id: 'progress_photos_value',
    category: 'measurement',
    gender: 'female',
    frequency: '每月 1 次',
    tips: ['相同光线/角度/服装', '正面+侧面', '不修图'],
    advice: '照片比体重数字更能反映身体变化，增强信心'
  },
  {
    id: 'non_scale_victories_list',
    category: 'mindset',
    gender: 'female',
    examples: ['裤子变松', '爬楼不喘', '睡眠更好', '情绪更稳', '精力提升'],
    advice: '每周记录 1–2 项非体重成就，强化内在动机'
  },
  {
    id: 'clothing_fit_as_indicator',
    category: 'measurement',
    gender: 'female',
    interpretation: '衣服变宽松常早于体重下降，是脂肪减少的可靠信号',
    advice: '保留一件“基准衣物”（如牛仔裤），定期试穿评估进展'
  },
  {
    id: 'energy_levels_tracking',
    category: 'lifestyle',
    gender: 'female',
    method: '每日 1–5 分打分（1=极度疲惫，5=精力充沛）',
    interpretation: '能量水平是健康的重要指标，优于体重',
    advice: '若能量持续 <3，检查睡眠、压力、营养是否失衡'
  },
  {
    id: 'mood_and_nutrition_link',
    category: 'nutrition',
    gender: 'female',
    key_nutrients: ['Omega-3', '维生素 D', '镁', 'B族维生素'],
    advice: '情绪低落时，优先排查营养缺乏，而非归因于“意志力”'
  },
  {
    id: 'gentle_movement_daily',
    category: 'exercise',
    gender: 'female',
    minimum_minutes: 30,
    examples: ['散步', '拉伸', '园艺', '跳舞'],
    interpretation: '日常活动量对代谢健康至关重要，不一定要“锻炼”',
    advice: '每坐 1 小时起身活动 5 分钟，累积达标'
  },
  {
    id: 'rest_day_importance',
    category: 'exercise',
    gender: 'female',
    recommendation: '每周至少 1–2 天完全休息或仅做轻度活动',
    interpretation: '恢复期是身体适应与变强的关键阶段',
    advice: '倾听身体信号，疲劳时主动休息，避免过度训练'
  },
  {
    id: 'hydration_check_urine_color',
    category: 'lifestyle',
    gender: 'female',
    ideal_color: '淡黄（如柠檬水）',
    dark_yellow: '需补水',
    clear: '可能饮水过多',
    advice: '以尿液颜色为日常 hydration 指南，比固定杯数更个体化'
  },

  // ==========================================
  // 2. 青少年女性 (12-19岁) - 新增补充
  // ==========================================
  {
    id: 'body_fat_teen_female',
    category: 'body_fat',
    gender: 'female',
    age_group: '12-19',
    normal_min: 18,
    normal_max: 30, // 青春期脂肪储备是正常的
    interpretation:
      '青春期女性为了发育和激素合成，必须储备一定的体脂，不要过度追求“瘦”。',
    advice:
      '建议：不要节食！保证营养全面，多参与体育社团活动，建立健康的身体意象。'
  },
  {
    id: 'body_fat_teen_female_low',
    category: 'body_fat',
    gender: 'female',
    age_group: '12-19',
    low_threshold: 17,
    interpretation: '体脂过低可能导致生长迟缓或月经初潮推迟（运动型闭经）。',
    advice: '建议：立即停止减重，增加优质碳水和蛋白质摄入，确保月经周期正常。'
  },
  {
    id: 'bone_mass_teen_female',
    category: 'bone',
    gender: 'female',
    age_group: '12-19',
    interpretation: '这是骨量积累的“黄金窗口期”，90%的骨峰值在20岁前形成。',
    advice:
      '建议：多喝牛奶，多晒太阳，多做跳跃类运动（跳绳、篮球）以刺激骨骼生长。'
  },

  // ==========================================
  // 3. 通用建议 / 男性 (Fallback) - 新增补充
  // ==========================================
  {
    id: 'general_visceral_fat_high',
    category: 'visceral_fat',
    gender: 'all', // 适用于所有性别
    high_threshold: 10,
    interpretation:
      '内脏脂肪等级偏高，意味着内脏器官周围脂肪堆积，不仅影响体型，更增加慢性病风险。',
    advice:
      '建议：戒糖、少酒精。内脏脂肪对有氧运动反应敏感，坚持每天快走30分钟即可见效。'
  },
  {
    id: 'general_muscle_low',
    category: 'muscle',
    gender: 'all',
    low_threshold: 30, // 通用低线
    interpretation: '肌肉量不足会导致基础代谢降低，容易形成“易胖体质”。',
    advice:
      '建议：每餐都要有蛋白质（蛋、奶、肉、豆），每周至少进行2次抗阻力训练。'
  },
  {
    id: 'general_water_low',
    category: 'water',
    gender: 'all',
    low_threshold: 45,
    interpretation: '身体水分不足，可能导致代谢减慢、皮肤干燥和疲劳感。',
    advice: '建议：早起一杯温水，运动后及时补充电解质，不要等到口渴了再喝水。'
  },
  {
    id: 'general_bmi_overweight',
    category: 'bmi',
    gender: 'all',
    bmi_min: 24,
    bmi_max: 27.9,
    interpretation:
      '处于超重范围。如果是肌肉发达者可忽略，否则需注意饮食控制。',
    advice: '建议：采用“餐盘法”，蔬菜占一半，主食和蛋白质各占四分之一。'
  }
]
