export const LLM_CONFIG = {
  // 核心开关：true 使用 public/models 下的文件，false 使用 hf-mirror.com

  VITE_USE_NETWORK_MODEL: import.meta.env.VITE_USE_NETWORK_MODEL === 'true',

  // 模型 ID
  MODEL_ID: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',

  // 远程地址 (备用)
  REMOTE_URL: 'https://hf-mirror.com/mlc-ai/Qwen2.5-1.5B-Instruct-q4f32_1-MLC',

  // 远程 WASM (备用)
  REMOTE_WASM:
    'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm'
}
