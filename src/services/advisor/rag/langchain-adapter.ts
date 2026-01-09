import { Embeddings, type EmbeddingsParams } from '@langchain/core/embeddings'
import { embeddingEngine } from '../../ocr/rag/embedding-engine'

/**
 * 适配器模式：
 * 将我们自己的 EmbeddingEngine 包装成 LangChain 标准的 Embeddings 接口
 */
export class LangChainAdapter extends Embeddings {
  constructor(params?: EmbeddingsParams) {
    super(params ?? {})
  }

  /**
   * 实现接口：将文档数组转为向量数组
   * LangChain 在存入知识库时会调用此方法
   */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    // 复用你的引擎，并发计算
    const promises = documents.map(doc => embeddingEngine.embed(doc))
    return Promise.all(promises)
  }

  /**
   * 实现接口：将查询字符串转为向量
   * LangChain 在检索时会调用此方法
   */
  async embedQuery(document: string): Promise<number[]> {
    // 复用你的引擎
    return embeddingEngine.embed(document)
  }
}
