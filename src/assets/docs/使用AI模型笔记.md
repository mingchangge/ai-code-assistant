# 使用AI模型笔记

## 1. Transformers.js + Phi-3-gguf (已放弃)

**@huggingface/transformers + microsoft/Phi-3-mini-4k-instruct-gguf：**

### 模型下载

1. 从Hugging Face下载模型
   - 访问 [Hugging Face模型库](https://huggingface.co/models)
   - 搜索并选择你需要的模型（如 microsoft/Phi-3-mini-4k-instruct-gguf）
   - 点击模型名称进入详情页
   - 点击 "Download" 按钮下载模型文件
   - 下载完成后，将模型文件放入 项目 `public/models/phi3` 目录下面
2. 下载模型辅助文件 ❌ (gguf) 错误方式，不需要下载
   - 进入模型存放目录：`cd public/models/phi3`
   - 下载命令：

   ```bash
   curl -O https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/raw/main/config.json
   curl -O https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/raw/main/tokenizer.json
   curl -O https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/raw/main/tokenizer_config.json
   curl -O https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/raw/main/special_tokens_map.json
   ```

### 相关文件：

- `scripts/split-model.ts`
- `src/serviceWorkers/sw.ts`
- `src/workers/opfs-cache.worker.ts`
- `src/utils/register-sw.ts`
- `src/views/WeightRecords/components/DataAnalysis.tsx`

### 3. 完整数据流程

开发者设计的完整流程如下：

1. 开发阶段：通过 scripts/split-model.ts 将原始模型切片并准备好，命令：`npx tsx scripts/split-model.ts`
2. 用户交互阶段：用户在 DataAnalysis.tsx 中请求分析体重数据
3. 模型检查与准备：检查 OPFS 中是否已有缓存模型，若没有则通过 Web Worker 下载切片文件
4. 模型加载与拦截：注册 Service Worker 并拦截模型加载请求，从本地 OPFS 提供文件
5. 数据分析与展示：使用加载好的模型分析用户体重数据并生成专业报告

这种设计充分利用了现代浏览器的能力，通过文件切片、Web Worker 并行下载、OPFS 本地存储和 Service Worker 请求拦截等技术，有效解决了浏览器端运行 AI 模型时面临的模型体积大、加载慢、重复下载等问题，为用户提供了流畅的离线 AI 分析体验。可惜，行不通🐶！

### 模型加载

1. 将模型文件上传到浏览器的OPFS系统中：`src/workers/opfs-cache.worker.ts`
2. 加载模型文件：`src/views/WeightRecords/components/DataAnalysis.tsx`
3. 报错：`Local file missing at "/models/phi3/tokenizer.json" and download aborted due to invalid model ID "/models/phi3".`

**❌ 放弃原因**：

- @huggingface/transformers（Transformers.js）只支持 ONNX 运行时
- GGUF 是 llama.cpp 的格式，需用 WebAssembly + llama.cpp（如 WebLLM 或 llama-web）。
- GGUF文件设计与tokenizer的集成机制：
  - GGUF的自包含特性：

    GGUF格式通过二进制结构将模型权重、tokenizer信息、量化参数等所有必要数据封装在单个文件中。具体来说：
    - **tokenizer核心数据**（如词汇表、合并规则、特殊标记）以紧凑格式存储在GGUF文件的元数据区。例如，词汇表以键值对形式保存，合并规则通过二进制编码记录。
    - **运行时依赖**（如tokenizer配置）无需外部文件，GGUF文件内部包含所有初始化tokenizer所需的参数，例如最大输入长度、填充策略等。

  - Hugging Face调用GGUF时的矛盾现象

    尽管GGUF设计为自包含，`transformers` 库调用时仍可能报错寻找外部token文件，原因如下：
    - **库实现的兼容性问题**：`transformers` 对GGUF的支持尚在完善中，其默认加载逻辑仍沿用传统格式（如PyTorch/Safetensors）的依赖解析方式，导致尝试读取外部token文件。
    - **路径解析错误**：若GGUF文件未放置在Hugging Face默认缓存目录（如`~/.cache/huggingface`），或文件名与模型名称不匹配，`transformers`可能无法正确定位内部tokenizer数据。
    - **tokenizer格式差异**：GGUF的tokenizer数据采用自定义二进制格式，而`transformers`期望的是JSON格式的tokenizer配置文件（如`tokenizer_config.json`），两者解析方式不兼容。

**<font color='red' size='5'>❌ Transformers.js 不支持 gguf 格式，所以这个方案暂时放弃。</font>**

## 2. Transformers.js + Phi-3(已放弃)

**@huggingface/transformers + Xenova/Phi-3-mini-4k-instruct：**

1. 使用@huggingface/transformers在线下载Xenova/Phi-3-mini-4k-instruct模型，整个模型大约 2.73GB，差不多 30 分钟。首次需要下载耗时时间久且获取不到下载进度（差评！）后续使用时无需下载，直接从CacheStorage(transformers-cache)缓存中加载。

2. 但是一旦开始使用模型进行数据分析，电脑会被**卡住**，整个机器都会无响应（差差评！）。

3. 因为**阻塞**主线程，后续<font color='red'>将下载模型和分析数据放在 Worker 线程中进行，**不会阻塞主线程**</font>。但分析数据报错：`An error occurred during model execution: "2129075616".Inputs given to model: { ... past_key_values.x.key: Float32Array(0) ... }`。

   这个错误是模型已下载但推理时崩溃，根本原因如下：

   ❌ **核心问题：Phi-3 模型使用 tiktoken tokenizer，但 Transformers.js 不支持！**
   - Transformers.js 只支持 BPE tokenizer（如 GPT-2），不支持 tiktoken（如 Phi-3）。
   - Phi-3 使用 tiktoken 编码器（和 GPT-4 一样），不是 BPE 或 SentencePiece。

4. 相关文件地址：
   - 数据分析组件：`src/views/WeightRecords/components/DataAnalysis_abandoned.tsx`
   - 模型加载 Worker：`src/workers/modelWorker_abandoned.ts`
   - 模型wasm文件：`public/ort-wasm-simd-threaded.jsep.wasm` ，由 `node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm` 文件复制，是为了修复work线程请求文件地址错误的问题

**<font color='red' size='5'>❌ 因为 Transformers.js 不支持 tiktoken tokenizer，所以这个方案暂时放弃。</font>**

## 3. WebLLM + Phi-3/Qwen3 （可行）

1. 安装 WebLLM

   ```bash
   npm i @mlc-ai/web-llm
   ```

2. 核心技术组件：
   - @mlc-ai/web-llm：基于WebAssembly的LLM运行时
   - Phi-3模型：微软开发的轻量级大语言模型，专为边缘计算优化
   - Qwen3模型：阿里巴巴开发的轻量级大语言模型，专为在浏览器等资源受限环境中高效运行而优化。
3. 主要实现文件：
   - 普通输出版本：`src/views/WeightRecords/components/DataAnalysis_NormalOutput.tsx`
   - 流式输出版本：`src/views/WeightRecords/components/DataAnalysis_StreamingOutput.tsx`

**总结**：

该方案基于 **WebLLM**💻（MLC AI 推出的可在浏览器内直接运行大语言模型的前端框架，无需依赖后端服务器即可实现本地推理）与 Phi-3 模型和 Qwen3 模型，开发了两个体重数据分析演示模块，可完成体重变化趋势📈、健康建议💡等基础分析。但因模型适配问题，部分中文回复存在乱码⚠️。

在输出模式上，流式输出实时逐段呈现内容，类似打字机效果，能减少等待感知（流式采用分块增量输出，具备实时交互特性✨）；非流式输出则一次性返回完整结果📑，更适合看重结果完整性的场景，两者在交互体验上差异明显。

# 补充说明：

## tiktoken tokenizer

tiktoken 是 **OpenAI 开发的开源分词器**（tokenizer），专为大语言模型设计，特点是**速度快、内存占用低**，且与 GPT 系列模型（GPT-2、GPT-3、GPT-4 等）深度绑定。其核心原理是：

- 基于 **字节级 BPE（Byte-level Byte Pair Encoding）** 算法，直接从文本字节序列中学习合并规则，避免了传统分词器对 Unicode 字符的依赖，对多语言和特殊符号（如代码、emoji）的处理更稳定。
- 词表（vocabulary）设计紧凑，例如 GPT-3 使用的 `cl100k_base` 词表包含约 10 万个 token，覆盖绝大多数常见文本场景。

简单说，tiktoken 的作用是将自然语言文本拆分为模型可理解的“最小语义单元”（token），是模型输入处理的核心组件。

## 二、Phi-3 与 tiktoken 的关联

Phi-3 系列模型在设计上借鉴了 GPT 架构的诸多特性，其中**分词器采用了与 tiktoken 兼容的逻辑**（甚至直接复用了 tiktoken 的词表和合并规则）。这是因为：

- Phi-3 的训练数据和指令微调流程参考了 GPT 系列的优化方向，使用 tiktoken 可减少分词差异对模型性能的影响。
- 微软在 Phi-3 的技术文档中明确提到，其 tokenizer 与 OpenAI 的 `cl100k_base`（tiktoken 的一种词表）兼容，支持相同的特殊标记（如 `<|endoftext|>`、`<|user|>` 等）。
