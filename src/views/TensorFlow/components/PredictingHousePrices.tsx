// 线性回归预测房价
import { useEffect, useState, useRef } from 'react'
import { Button, Input, Space } from 'antd'
import * as tf from '@tensorflow/tfjs'

// 生成模拟数据
function generateData(num = 100) {
  const [xs, ys]: number[][] = [[], []]
  for (let i = 0; i < num; i++) {
    const area = 30 + Math.random() * 120 // 30~150
    const price = area * (0.02 + Math.random() * 0.01) + Math.random() * 0.2 // 带噪声
    xs.push(area)
    ys.push(price)
  }
  return [tf.tensor2d(xs, [num, 1]), tf.tensor2d(ys, [num, 1])]
}
function generateData2(num = 100) {
  const xs = [],
    ys = []
  for (let i = 0; i < num; i++) {
    const area = 30 + Math.random() * 120 // 30~150
    const price = area * 0.02 + 0.5 + Math.random() * 0.2 // 保证 1~3.5 万/㎡
    xs.push((area - 90) / 60) // 归一化到 [-1,1]
    ys.push((price - 2) / 1) // 归一化到 [-1,1]
  }
  return [tf.tensor2d(xs, [num, 1]), tf.tensor2d(ys, [num, 1])]
}

export default function LinearRegressionForPredictingHousePrices() {
  const [area, setArea] = useState('')
  const [price, setPrice] = useState('')
  const modelRef = useRef<tf.Sequential>(null)
  const [loading, setLoading] = useState(false)
  const [totalPrice, setTotalPrice] = useState('')

  useEffect(() => {
    function createModel() {
      setLoading(true)
      console.log('创建模型', loading)
      // 加载 创建模型：单层 Dense（全连接）
      const model = tf.sequential({
        layers: [tf.layers.dense({ units: 1, inputShape: [1] })]
      })
      // 编译模型
      model.compile({
        loss: 'meanSquaredError', // 随机梯度下降
        // optimizer: 'sgd' // 均方误差
        optimizer: tf.train.sgd(0.01) // 学习率 0.01
      })
      modelRef.current = model
    }
    // 训练模型
    async function trainModel() {
      setLoading(true)
      createModel()
      const areaTensor = tf.tensor2d([50, 60, 70, 80, 90, 100], [6, 1])
      const priceTensor = tf.tensor2d([250, 300, 350, 400, 450, 500], [6, 1])
      // 训练模型
      try {
        if (!modelRef.current) return
        await modelRef.current.fit(areaTensor, priceTensor, {
          epochs: 20,
          callbacks: {
            onEpochEnd: (epoch: number, logs: tf.Logs) => {
              console.log(
                `Epoch ${epoch.toString()}: loss = ${logs.loss.toString()}`
              )
            }
          }
        })
        console.log('模型训练完成')
      } catch (error) {
        console.error('模型训练失败', error)
      } finally {
        setLoading(false)
      }
    }
    // void trainModel()
    // 训练模型2
    async function trainModel2() {
      createModel()
      const [areaTensor, priceTensor] = generateData2(100)
      // 训练模型
      try {
        if (!modelRef.current) return
        await modelRef.current.fit(areaTensor, priceTensor, {
          epochs: 200,
          callbacks: {
            onEpochEnd: (epoch: number, logs: tf.Logs) => {
              if (isNaN(logs.loss))
                throw new Error('Loss 变为 NaN，请检查归一化/学习率')
              if (epoch % 20 === 0) {
                console.log(
                  `Epoch ${epoch.toString()}: loss = ${logs.loss.toString()}`
                )
              }
            }
          }
        })
        console.log('模型训练完成')
      } catch (error) {
        console.error('模型训练失败', error)
      } finally {
        setLoading(false)
      }
    }
    // void trainModel2()
  })
  const handlePredict = async () => {
    if (!modelRef.current) {
      console.error('模型未训练完成')
      return
    }
    if (!area) {
      console.error('请输入房屋面积')
      return
    }
    // 调用 TensorFlow 模型进行预测
    const areaTensor = tf.tensor2d([[parseFloat(area)]])
    const priceTensor = modelRef.current.predict(areaTensor)
    const priceValue = (await priceTensor.data()) as Float32Array
    console.log('预测房价', priceValue)
    // 假设模型返回的房价为 1000000 元
    setPrice(priceValue[0].toFixed(2))
  }
  const handlePredict2 = () => {
    if (!modelRef.current) {
      console.error('模型未训练完成')
      return
    }
    if (!area) {
      console.error('请输入房屋面积')
      return
    }
    // 调用 TensorFlow 模型进行预测
    const areaTensor = tf.tensor2d([[(parseFloat(area) - 90) / 60]])
    const priceTensor = modelRef.current.predict(areaTensor).dataSync()[0]
    const priceValue = (priceTensor * 1 + 2).toFixed(2)
    console.log('预测房价', priceValue)
    // 假设模型返回的房价为 1000000 元
    setPrice(priceValue)
    setTotalPrice((parseFloat(priceValue) * parseFloat(area)).toFixed(2))
  }
  return (
    <>
      <h1>线性回归预测房价</h1>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="请输入房屋面积（平方米）"
          value={area}
          onChange={e => {
            setArea(e.target.value)
          }}
        />
        <Button
          type="primary"
          loading={loading}
          // onClick={() => void handlePredict()}
          onClick={handlePredict2}
        >
          预测
        </Button>
      </Space.Compact>
      <div style={{ marginTop: 20 }}>
        <h2>预测结果：</h2>
        <p>房屋面积：{area}平方米</p>
        <p>预测房价：{price}万元</p>
        <p>预测总价：{totalPrice}万元</p>
      </div>
    </>
  )
}
