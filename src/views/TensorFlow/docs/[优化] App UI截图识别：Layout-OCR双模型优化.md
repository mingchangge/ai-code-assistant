# App UI截图识别：Layout-OCR双模型优化

本文是在上一篇【[指南] App UI截图识别：Layout-OCR双模型训练实战指南】的基础上，考虑在前端引入agent、RAG、微调等方案，优化识别准确率。

## 背景

在上一篇指南中，我们已经训练出了一个基于YOLOv8的布局检测模型和一个基于CRNN的文本识别模型，并成功部署在前端，实现了对App UI截图的文字识别功能。
然而，在实际使用中，我们发现仍然存在一些问题：

- **识别错误**：OCR模型在面对复杂背景、特殊字体时，仍然会出现较高的错误率。
- **布局误判**：布局检测模型有时会漏检或错检某个元素，导致OCR模型无法正确识别其文本内容。
- **业务理解不足**：模型无法理解某些特定业务场景下的文本含义，导致识别结果不符合预期。

为了解决这些问题，我们决定引入**Agent修正**机制，利用LangChain等工具，对OCR结果进行智能纠错和业务理解，从而提升整体识别效果。

## 🛠️ 实战一、加入Agent修正

我们在前端OCR识别流程中，加入了一个Agent修正环节。具体步骤如下：

1.  **布局检测**：使用YOLO模型检测截图中的各个UI元素位置。
2.  **文本识别**：对每个检测到的UI元素，使用CRNN模型识别其文本内容。
3.  **Agent 的四重防御策略 (Strategy Chain)**：

    我们设计了优先级的策略链，由轻到重，层层过滤异常：
    - **上下文公式修正 (Context Logic)**：利用当前图片中的关联数据（如 `建议体重 - 当前体重 = 体重控制`），如果符号与 OCR 结果不符，优先信赖公式，强制修正符号。
    - **历史范围修正 (History Magnitude)**：基于用户历史数据的**中位数**和**时间衰减**计算动态合理范围。针对 OCR 常见的“小数点丢失”或“多读一位”错误（如 `54.5` 变 `545`），尝试 `/10` 或 `/100` 回归。
    - **物理极限兜底 (Physical Limits)**：针对冷启动（无历史数据）用户，引入人类生理极限常识（如基础代谢不可能 > 5000）。这是防止离谱错误的最后一道防线。
    - **激进模式重试 (Aggressive Retry)**：当上述软修正失效且数值依然异常时，Agent 主动调度 OCR 引擎，开启**二值化**与**大 Padding** 重新截图识别。

4.  **结果输出**：将修正后的文本内容输出到前端，展示给用户。

### 拆分服务层

为了更好地组织代码结构📁，我们将OCR识别服务层拆分成多个模块，每个模块负责特定的功能。具体拆分如下：

```text
src/services/ocr/
├── index.ts                # [Facade] 对外暴露 runRecognition, initializeModels
├── types.ts                # [Type] 类型定义
├── config.ts               # [Config] 包含标准模式/激进模式配置
├── core/                   # [Core Layer] AI 基础设施
│   ├── model-state.ts      # 单例管理 (TFJS/ONNX Session)
│   ├── layout.ts           # YOLOv5 预处理与后处理
│   └── ocr-engine.ts       # CRNN 原子推理能力 (支持不同Config)
├── utils/                  # [Utils Layer] 纯函数工具
│   ├── math.ts             # 数学计算 (两个向量的余弦相似度)
│   └── geometry.ts         # 几何计算(isSameLine) & 字符串清洗
├── debug/                  # [Debug Layer] 开发者工具
│   └── tools.ts            # Canvas可视化 & 数据集Zip打包
├── rag/                    # [Core Layer] AI 基础设施
│   ├── embedding-engine.ts # [Core] 模型加载器 (Transformers.js, WebGPU加速, 单例锁)
│   └── semantic-matcher.ts # [Logic] 语义匹配器 (向量库构建, 阈值过滤, 长度惩罚)
└── weight-domain/          # [Domain Layer] 业务逻辑层
    ├── constants.ts        # 静态数据 (关键字、映射表)
    ├── history-analyzer.ts # 历史数据分析 (动态范围计算、时间衰减逻辑)
    ├── parser.ts           # 编排流程：分类 -> 配对 -> 提取上下文 -> 并发Agent -> 结构化
    └── agent.ts            # 智能体：多策略修正 (Context/History/Physics) + 主动重试
```
