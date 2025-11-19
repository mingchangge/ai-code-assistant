1. 安装 TensorFlow.js 库

   ```bash
   npm install @tensorflow/tfjs
   ```

## 线性回归预测房价

1. 代码示例：

```tsx
// 线性回归预测房价
import { useEffect, useState, useRef } from 'react'
import { Button, Input, Space } from 'antd'
import * as tf from '@tensorflow/tfjs'

export default function LinearRegressionForPredictingHousePrices() {
  const [area, setArea] = useState('')
  const [price, setPrice] = useState('')
  const modelRef = useRef<tf.Sequential>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    // 加载 创建模型：单层 Dense（全连接）
    const model = tf.sequential({
      layers: [tf.layers.dense({ units: 1, inputShape: [1] })]
    })
    // 编译模型
    model.compile({
      loss: 'meanSquaredError', // 随机梯度下降
      optimizer: 'sgd' // 均方误差
    })
    modelRef.current = model
    // 训练模型
    async function trainModel() {
      const areaTensor = tf.tensor2d([50, 60, 70, 80, 90, 100], [6, 1])
      const priceTensor = tf.tensor2d([250, 300, 350, 400, 450, 500], [6, 1])
      // 训练模型
      try {
        await model.fit(areaTensor, priceTensor, {
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
    void trainModel()
  }, [])
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
  return (
    <div>
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
          onClick={() => void handlePredict()}
        >
          预测
        </Button>
      </Space.Compact>
      <div>
        <h2>预测结果：</h2>
        <p>房屋面积：{area}平方米</p>
        <p>预测房价：{price}元</p>
      </div>
    </div>
  )
}
```

2. 代码在**epochs=10、15、20+ 出现的不同现象（负数 → 小正数 → NaN）**全是因为**数值不稳定导致的训练崩溃**。
3. 解决方法：
   - 降低 SGD 学习率（需调参），`optimizer: tf.train.sgd(0.0001) // 把默认 0.01 降到 0.0001`,尝试成功！
   - 使用优化器Adam，只使用Adam尝试失败，依旧会出现预测值NaN

## 归一化/反归一化

上面epochs=10、15、20+ 出现的不同现象（负数 → 小正数 → NaN）的核心原因是：**SGD 优化器 + 高学习率 + 大尺度数据 = 梯度爆炸 → 参数发散 → NaN**。

在 TensorFlow.js（其实任何框架）里，一旦权重变成 NaN，此后所有计算都会是 NaN，直到训练结束。

📊 现象与内部状态的对应关系

| Epochs | 表面现象   | 内部发生了什么？                                                                  |
| ------ | ---------- | --------------------------------------------------------------------------------- |
| 10     | 预测为负数 | SGD 刚开始训练，权重被大梯度“推过头”，比如学到 w ≈ -3，所以 101 × (-3) + b < 0    |
| 15     | 预测≈5.2   | 权重在震荡中偶然接近某个小值（如 w≈0.05），但仍是错误方向（正确应≈5）             |
| ≥20    | NaN        | 某次权重更新后，loss 变成 Infinity → 梯度变成 NaN → 所有参数污染为 NaN → 永久失效 |

### 出现NaN的常见原因：

1. 学习率太大

   你给的 SGD 学习率是 0.05，对于“房价”这种绝对数值很大（几十万~上百万）的回归目标，0.05 仍然过大，一步就把权重推到天文数字，第二步直接 overflow → NaN。

2. 初始化 + 激活函数搭配不当

   这里只有一层线性层，初始化默认是 glorotNormal，倒不会直接炸；但只要学习率或标签尺度任意一个失控，线性层也会飞。

   glorotNormal 是 TensorFlow.js（以及其他框架）对**单层线性层的默认权重初始化策略**的正式名称，也叫 **Xavier Normal**，它只有一句话：**“把权重按正态分布随机初始化，使得输出方差 = 输入方差，避免信号爆炸或消失。”**

   一、具体数值怎么来的

   对于全连接层（dense）
   - 输入维度 = fanIn
   - 输出维度 = fanOut

   glorotNormal 把每个权重采样自：`W ~ N(0, σ²)   其中 σ = sqrt(2 / (fanIn + fanOut))`

   在例子中：`model.add(tf.layers.dense({units: 1, inputShape: [1]}))`
   - fanIn = 1
   - fanOut = 1
     ⇒ σ = sqrt(2 / 2) = 1

   于是

   ```plaintext
   w ~ N(0, 1) // 均值 0，标准差 1
   b ~ N(0, 1) // 偏置同样道理
   ```

   **典型初始值大多落在 ±0.1 ~ ±2.0 之间**，极少超过 ±3。

   二、为什么选它
   1. 保持前向/反向传播时方差稳定；
   2. 对线性、tanh、sigmoid这类对称激活效果最好；
   3. 计算简单，只需知道输入输出维度。

   三、与“梯度爆炸”关系
   - glorotNormal 只保证“初始阶段”方差=1；
   - 如果标签绝对值很大（250）而学习率又没降，第一次反向梯度仍可把权重从 ±0.1 推到几百 → 爆炸；
   - 因此它不能替代归一化或调小 lr，只是“起跑线”相对安全。

3. 特征/标签未归一化

下面把“50→250”这一组小数如何一步步把权重推到 Infinity 拆开给你看。

一、模型里到底在算什么

1.  网络结构  
    只有 1 个线性单元：`y_pred = w · x + b`

2.  初始化  
    tf.js 默认用 **glorotNormal**，`w` 初始值 ≈ `N(0, 1/sqrt(1)) ≈ ±0.1` 量级，`b` 同理。

3.  前向传播（第一轮）  
    取第一条样本 `x=50`

    ```
    y_pred = w·50 + b ≈ 0.1*50 + 0.1 = 5.1
    y_true = 250
    loss = (y_pred − y_true)^2 = (5.1 − 250)^2 ≈ 60000
    ```

4.  反向传播——**梯度正比于“残差 × 输入”**

    ```
    d_loss/d_w = 2 · (y_pred − y_true) · x
             ≈ 2 · (−244.9) · 50
             ≈ −24490
    ```

    学习率如果设为 0.01，权重更新量：

    ```
    Δw = −lr · gradient = −0.01 · (−24490) ≈ +244.9
    ```

    于是一步就把 `w` 从 **0.1 → 245**，暴涨 **3 个数量级**。

5.  第二轮再算  
    现在 `w ≈ 245`，`x=50` 给出 `y_pred ≈ 245*50 ≈ 12250`，离 250 更远，残差更大，**梯度爆炸成正反馈**。第三步 `w` 冲到 1e5，第四步 `w` 大到 JavaScript 浮点溢出 → `Infinity`，再下一步 `Infinity*0 = NaN`，loss 变成 NaN。

二、为什么“50”本身不算大，却能把梯度放大

- 爆炸的**核心因子是“残差 × 输入”的绝对值**。  
  250 相对于初始预测 5.1 的残差是 245，再乘以 50，瞬间 1e4 级。  
  只要 **|y_true| ≫ 初始预测**，且 **|x| 也不小**，梯度就会一步飞天。

三、归一化到底缓和了什么

把 `x` 和 `y` 同时压到 **[-1,1]** 后：

- 初始预测 `y_pred = 0.1*0.2+0.1 ≈ 0.12`
- 残差 `≈ 0.2 − 0.12 = 0.08`
- 梯度 `≈ 2*0.08*0.2 = 0.032`
- 更新量 `Δw = 0.01*0.032 = 0.00032`

权重每次只变化 **10⁻⁴** 级，20 个 epoch 稳稳收敛，再也不会 Infinity。

四、一句话总结

**“50”和“250”本身不大，但 250 与初始预测的落差 × 50 的乘积巨大 → 梯度 1e4 级 → 权重一步翻千倍 → Infinity → NaN。**  
 **归一化把落差和输入同时压到 1 级以内，梯度降到 10⁻² 级，爆炸消失。**

### 归一化/反归一化

归一化是将数据映射到统一范围（如 `[0,1]` 或 `[-1,1]`）的预处理操作，反归一化是归一化的逆过程。它的作用是将模型输出的、处于 `[0, 1]` 区间内的预测结果，转换回原始数据的尺度和单位，使其具有实际的、可解释的意义。；二者是机器学习数据预处理的核心步骤，直接影响模型训练效率和预测准确性。

- 1.  归一化（Normalization）

  **定义与核心目的：**
  - 对数据的特征维度进行缩放，消除不同特征间的量纲差异（如 “身高（厘米）” 和 “体重（千克）”）。
  - 核心目的：让模型更高效收敛、避免某一特征因数值过大主导训练、提升泛化能力。

  **常见方法：**
  - 最小-最大归一化（Min-Max Scaling）：
    - 公式：`X_normalized = (X - X_min) / (X_max - X_min)`，适用于数据分布已知的场景。
      - `X` 是原始数据点。
      - `X_min` 是特征维度的最小值。
      - `X_max` 是特征维度的最大值。
    - 作用：将特征值映射到 [0,1] 区间内。
  - 标准归一化（Z-Score Normalization）：
    - 公式：`x_std = (x - μ) / σ`，适用于数据近似正态分布的场景。
    - 作用：将特征值映射到均值为 0，标准差为 1 的正态分布。

- 2. 反归一化（Denormalization）

  **定义与核心目的：**
  - 对归一化后的数据进行逆操作，将其恢复到原始尺度。
  - 核心目的：让模型输出具有实际物理意义，便于解读和应用（如预测房价时，将归一化后的输出还原为真实价格）。

  **操作逻辑：**
  基于归一化时使用的参数（如x_min、x_max或μ、σ）反向计算原始值。
