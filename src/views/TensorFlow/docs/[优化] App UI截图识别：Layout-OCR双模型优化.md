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

1. **布局检测**：使用YOLO模型检测截图中的各个UI元素位置。
2. **文本识别**：对每个检测到的UI元素，使用CRNN模型识别其文本内容。
3. **Agent修正**：构建一个**前端本地 Agent**（基于 LangChain.js 或自定义逻辑状态机）。它不依赖云端 LLM，而是通过**规则引擎**实现‘观察-思考-行动’循环。当检测到异常（如数值违背物理常识）时，Agent 会**主动回调** OCR 引擎，动态切换‘激进模式’参数（如 Aggressive Padding）进行重试，实现闭环修正。
   - **“闭环反馈与重试”**：Agent 不仅校验逻辑，当发现异常（如数值超出人体极限、符号缺失）时，会**主动控制 OCR 引擎**，调整参数（如增大 Padding、开启二值化）对该区域进行**重新识别**，从而从源头解决 OCR 识别不准的问题。
   - **理解**：根据上下文，理解文本的含义，并将其转换为业务数据。
4. **结果输出**：将修正后的文本内容输出到前端，展示给用户。

### 1. 拆分服务层

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
│   └── geometry.ts         # 几何计算(isSameLine) & 字符串清洗
├── tools/                  # [Debug Layer] 开发者工具
│   └── debug.ts            # Canvas可视化 & 数据集Zip打包
└── weight-domain/          # [Domain Layer] 业务逻辑层
    ├── constants.ts        # 静态数据 (关键字、映射表)
    ├── parser.ts           # 编排流程：分类 -> 配对 -> Agent介入 -> 结构化
    └── agent.ts            # 智能体：逻辑校验 + 主动重试 (Re-Act Pattern)
```
