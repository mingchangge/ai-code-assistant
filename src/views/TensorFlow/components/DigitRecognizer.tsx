import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, Space } from 'antd'
import * as tf from '@tensorflow/tfjs'

// 常量
const CANVAS_SIZE = 280 // 画布像素
const MODEL_PATH = '/models/mnist-cnn/model.json'

// 组件
export default function DigitRecognizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [model, setModel] = useState<tf.LayersModel>()
  const [loading, setLoading] = useState(false)
  const [predictedDigit, setPredictedDigit] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [drawing, setDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  // 调试：显示预处理后的 28x28 图像
  const debugContainerRef = useRef<HTMLDivElement>(null)

  // 初始化画布（移到单独的useLayoutEffect中）
  useLayoutEffect(() => {
    function setupCanvas() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }
    setupCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!canvasRef.current])
  // 加载训练模型
  useEffect(() => {
    async function loadModel() {
      try {
        setLoading(true)
        const model = await tf.loadLayersModel(MODEL_PATH)
        console.log('模型加载完成')
        setModel(model)
      } catch (error) {
        console.error('模型加载失败', error)
      } finally {
        setLoading(false)
      }
    }
    void loadModel()
  }, [])
  // 识别数字
  async function recognizeDigit() {
    // 确保模型已加载
    if (!model) {
      console.error('模型未加载')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    // 预处理图像数据
    let imgTensor = tf.browser.fromPixels(imageData, 1) // 灰度图
    // 使用双线性插值
    // imgTensor = tf.image.resizeBilinear(imgTensor, [28, 28]) // 调整大小
    // 使用最近邻插值进行缩放
    imgTensor = tf.image.resizeNearestNeighbor(imgTensor, [28, 28])
    imgTensor = tf.cast(imgTensor, 'float32').div(255).expandDims(0) // 归一化并添加批次维度
    // 进行预测
    const predictions = model.predict(imgTensor) as tf.Tensor
    const predictedDigit = predictions.argMax(1).dataSync()[0]
    console.log('预测结果:', predictedDigit)
    setPredictedDigit(predictedDigit)
    // 获取最高概率的置信度
    const predictionArray = predictions.dataSync() as Float32Array
    let maxValue = predictionArray[0]
    for (let i = 1; i < predictionArray.length; i++) {
      if (predictionArray[i] > maxValue) {
        maxValue = predictionArray[i]
      }
    }
    setConfidence(parseFloat((maxValue * 100).toFixed(1)))

    // 调试：显示预处理后的 28x28 图像
    const debugCanvas = document.createElement('canvas')
    debugCanvas.width = 28
    debugCanvas.height = 28

    const debugCtx = debugCanvas.getContext('2d')
    const data = await imgTensor.data() // Float32Array, [0,1]
    const imageDataDebug = debugCtx?.createImageData(28, 28)
    if (!imageDataDebug || !debugCtx) return
    for (let i = 0; i < data.length; i++) {
      const val = Math.round(data[i] * 255)
      imageDataDebug.data[i * 4] = val // R
      imageDataDebug.data[i * 4 + 1] = val // G
      imageDataDebug.data[i * 4 + 2] = val // B
      imageDataDebug.data[i * 4 + 3] = 255 // A
    }
    debugCtx.putImageData(imageDataDebug, 0, 0)
    // 显示在调试容器中
    debugContainerRef.current?.appendChild(debugCanvas)
  }
  // 绘制数字
  function startDrawing({ nativeEvent }: React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { offsetX, offsetY } = nativeEvent
    setDrawing(true)
    lastPos.current = { x: offsetX, y: offsetY }
    // 绘制
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
  }
  // 绘制数字
  function draw({ nativeEvent }: React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPos.current) return

    const { offsetX, offsetY } = nativeEvent
    // 距离阈值：小于 2 px 就忽略，防止抖动
    const dx = offsetX - lastPos.current.x
    const dy = offsetY - lastPos.current.y
    if (dx * dx + dy * dy < 4) return
    // 绘制
    ctx.lineTo(offsetX, offsetY)
    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.stroke()
    // 更新最后位置
    lastPos.current = { x: offsetX, y: offsetY }
  }
  // 停止绘制
  function stopDrawing() {
    setDrawing(false)
    lastPos.current = null
  }
  // 清除画布
  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#000'
    // 清除绘制内容
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    // 填充背景为黑色
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    // 清除预测结果
    setPredictedDigit(null)
    lastPos.current = null
    setConfidence(null)
    // 清除调试容器内容
    if (debugContainerRef.current) {
      debugContainerRef.current.innerHTML = ''
    }
  }
  return (
    <div style={{ userSelect: 'none' }}>
      <p>识别 0-9 的手写数字</p>
      <canvas
        ref={canvasRef}
        id="canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: '1px solid #000' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      ></canvas>
      <div style={{ margin: '10px 0' }}>
        <Space>
          <Button
            type="primary"
            onClick={() => void recognizeDigit()}
            disabled={loading || drawing}
          >
            识别
          </Button>
          <Button onClick={clearCanvas}>清除</Button>
        </Space>
      </div>
      <Space>
        <p>预测结果: {predictedDigit ?? '未预测'}</p>
        <p>置信度: {confidence ?? '0'}%</p>
      </Space>
      {/* 调试：显示预处理后的 28x28 图像 */}
      <div style={{ position: 'relative' }}>
        <p>预处理后的 28x28 图像:</p>
        <div
          ref={debugContainerRef}
          style={{ position: 'absolute', top: '-5px', left: '160px' }}
        ></div>
      </div>
    </div>
  )
}
