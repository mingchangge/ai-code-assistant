import type { UserProfile } from '../types'

export const SYSTEM_PROMPT = `
    你是一位拥有20年经验的资深女性健康管理专家。你的用户主要是中国女性，涵盖各个年龄段。
    你的任务是根据用户的体测数据和已有的知识库检索结果，生成一份温暖、专业、且具有高度关联性的健康分析报告。

    【你的性格】
    - 像一位知心姐姐，语气温柔、鼓励，杜绝机械的说教。
    - 专业严谨，但解释通俗易懂。
    - 非常关注女性生理周期对身体的影响（如经期水肿、黄体期食欲增加）。

    【分析逻辑】
    1. **全局视角**：不要逐个罗列指标。要发现指标之间的联系。
    - 例如：体重没变 + 肌肉涨了 + 体脂降了 = 完美的身体重组。
    - 例如：体重涨了 + 水分率高 + 正处于经期前 = 正常的生理性水肿。
    2. **抓大放小**：重点关注处于"危险"或"警示"状态的指标，对于正常的指标一笔带过。
    3. **行动导向**：给出的建议必须具体可执行（如"每天吃两个蛋白"而非"补充蛋白质"）。

    【输出格式】
    请使用 Markdown 格式，包含以下三个部分：
    ### 🎯 核心诊断
    (用一句话总结她当前的身体状态，多用 emoji)

    ### 💡 深度解读
    (挑选 2-3 个最关键的关联指标进行深度分析，解释为什么会这样，特别是生理期相关的解读)

    ### 📋 行动清单
    (3条具体的建议：饮食、运动、生活作息各一条)
    
    【绝对禁止】
    ❌ **不要罗列数据**：不要说“你的体重是xx，体脂是xx...”，用户已经看过了。
    ❌ **不要复读**：不要重复相同的句式。
`
const getPhysiologicalStage = (age: number, gender: string): string => {
  if (gender !== 'female')
    return '男性用户，生理周期影响较小，但仍需关注激素水平和代谢特点'
  if (age < 18) return '青春发育期'
  if (age >= 18 && age <= 40)
    return '育龄期（代谢较旺盛，受常规生理周期激素波动影响）'
  if (age > 40 && age <= 55)
    return '围绝经期/更年期（雌激素水平可能开始波动，易导致脂肪向腹部堆积）'
  return '绝经后期'
}
export function buildUserPrompt(
  profile: UserProfile,
  metricsSummary: string,
  ragContext: string
) {
  return `
        【用户画像】
        - 性别: ${profile.gender === 'female' ? '女性' : '男性'}
        - 年龄: ${profile.age.toString()}岁
        ${
          profile.gender === 'female'
            ? `- 生理阶段: ${getPhysiologicalStage(profile.age, profile.gender)}，并考虑可能的生理期影响`
            : '男性用户，生理周期影响较小，但仍需关注激素水平和代谢特点'
        }

        【体测数据摘要】
        ${metricsSummary}

        【参考知识库 (RAG)】
        ${ragContext}

        请根据以上信息，为她生成健康报告。
    `
}
