import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import 'katex/dist/katex.min.css'
import { BlockMath } from 'react-katex'
import {
  Layout,
  Card,
  Checkbox,
  Slider,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Tooltip
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  InfoOutlined,
  ZoomInOutlined
} from '@ant-design/icons'

const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography

interface ThreeObjects {
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  renderer: THREE.WebGLRenderer | null
  controls: OrbitControls | null
  line: THREE.Line | null
  point: THREE.Mesh | null
  trajectory: number[][]
  x: number
  y: number
  z: number
  minBounds: { x: number; y: number; z: number }
  maxBounds: { x: number; y: number; z: number }
  boundaryHelper: THREE.LineSegments | null
  boundaryMaterial: THREE.LineBasicMaterial | null
}

const EQUATION = `
\\begin{cases}
\\frac{dx}{dt} = a x - y z \\\\
\\frac{dy}{dt} = b y + x z \\\\
\\frac{dz}{dt} = c z + \\frac{x y}{3}
\\end{cases}
`

export default function EquationVisualizer() {
  const [a, setA] = useState(1.0)
  const [b, setB] = useState(1.0)
  const [c, setC] = useState(-1.0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [autoScale, setAutoScale] = useState(true)
  const [boundaryLimit, setBoundaryLimit] = useState(30)

  const canvasRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const threeRef = useRef<ThreeObjects>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    line: null,
    point: null,
    trajectory: [[1, 1, 1]],
    x: 1,
    y: 1,
    z: 1,
    minBounds: { x: 1, y: 1, z: 1 },
    maxBounds: { x: 1, y: 1, z: 1 },
    boundaryHelper: null,
    boundaryMaterial: null
  })

  // 初始化Three.js场景 - 优化版本
  useEffect(() => {
    const three = threeRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    // 关键优化：先清理旧资源
    const cleanup = () => {
      // 清理控制器
      if (three.controls) {
        three.controls.dispose()
        three.controls = null
      }

      // 清理渲染器
      if (three.renderer) {
        if (canvas.contains(three.renderer.domElement)) {
          canvas.removeChild(three.renderer.domElement)
        }
        three.renderer.dispose()
        three.renderer = null
      }

      // 清理场景对象
      if (three.scene) {
        three.scene.clear()
      }
    }

    // 执行清理
    cleanup()

    // 创建新场景
    three.scene = new THREE.Scene()
    three.scene.background = new THREE.Color(0xf9f9f9)

    // 添加坐标轴和网格
    const axesHelper = new THREE.AxesHelper(10)
    three.scene.add(axesHelper)

    const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xeeeeee)
    three.scene.add(gridHelper)

    // 创建边界框辅助线
    three.boundaryMaterial = new THREE.LineBasicMaterial({
      color: 0xdddddd,
      linewidth: 1,
      transparent: true,
      opacity: 0.5
    })

    const cubeGeometry = new THREE.BoxGeometry(
      boundaryLimit * 2,
      boundaryLimit * 2,
      boundaryLimit * 2
    )
    const wireframeGeometry = new THREE.WireframeGeometry(cubeGeometry)
    three.boundaryHelper = new THREE.LineSegments(
      wireframeGeometry,
      three.boundaryMaterial
    )
    three.scene.add(three.boundaryHelper)

    // 创建相机
    three.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    )
    three.camera.position.z = 20

    // 创建并挂载渲染器
    three.renderer = new THREE.WebGLRenderer({ antialias: true })
    three.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    // 确保渲染器DOM样式正确
    Object.assign(three.renderer.domElement.style, {
      width: '100%',
      height: '100%',
      display: 'block',
      cursor: 'grab',
      userSelect: 'none',
      touchAction: 'none'
    })
    canvas.appendChild(three.renderer.domElement)

    // 创建新控制器（强制重建，避免状态残留）
    three.controls = new OrbitControls(three.camera, three.renderer.domElement)
    three.controls.enableDamping = true
    three.controls.dampingFactor = 0.05
    three.controls.enableRotate = true
    three.controls.enableZoom = true
    three.controls.enablePan = true

    // 创建轨迹线
    const lineGeometry = new THREE.BufferGeometry()
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x1890ff,
      linewidth: 2
    })
    three.line = new THREE.Line(lineGeometry, lineMaterial)
    three.scene.add(three.line)

    // 创建当前点
    const pointGeometry = new THREE.SphereGeometry(0.2)
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff4d4f })
    three.point = new THREE.Mesh(pointGeometry, pointMaterial)
    three.scene.add(three.point)

    updateTrajectory()

    // 窗口大小调整处理
    const handleResize = () => {
      if (!three.camera || !three.renderer) return

      three.camera.aspect = canvas.clientWidth / canvas.clientHeight
      three.camera.updateProjectionMatrix()
      three.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      cleanup() // 组件卸载时清理资源
    }
  }, [boundaryLimit])

  // 更新边界范围
  const updateBounds = (x: number, y: number, z: number) => {
    const three = threeRef.current

    three.minBounds.x = Math.min(three.minBounds.x, x)
    three.minBounds.y = Math.min(three.minBounds.y, y)
    three.minBounds.z = Math.min(three.minBounds.z, z)

    three.maxBounds.x = Math.max(three.maxBounds.x, x)
    three.maxBounds.y = Math.max(three.maxBounds.y, y)
    three.maxBounds.z = Math.max(three.maxBounds.z, z)
  }

  // 限制点在边界内
  const clampToBoundary = (value: number) => {
    return Math.max(-boundaryLimit, Math.min(boundaryLimit, value))
  }

  // 自动调整相机位置以适应轨迹范围
  const adjustCameraToFit = () => {
    const three = threeRef.current
    if (!three.camera || !three.controls) return

    const centerX = (three.minBounds.x + three.maxBounds.x) / 2
    const centerY = (three.minBounds.y + three.maxBounds.y) / 2
    const centerZ = (three.minBounds.z + three.maxBounds.z) / 2

    const sizeX = three.maxBounds.x - three.minBounds.x
    const sizeY = three.maxBounds.y - three.minBounds.y
    const sizeZ = three.maxBounds.z - three.minBounds.z
    const maxSize = Math.max(sizeX, sizeY, sizeZ)

    const distance = maxSize * 1.5
    three.camera.position.set(
      centerX + distance,
      centerY + distance,
      centerZ + distance
    )

    three.camera.lookAt(centerX, centerY, centerZ)
    three.controls.target.set(centerX, centerY, centerZ)
    three.controls.update()
  }

  // 计算微分方程组的导数
  const calculateDerivatives = (x: number, y: number, z: number) => {
    const dx = a * x - y * z
    const dy = b * y + x * z
    const dz = c * z + (x * y) / 3

    return { dx, dy, dz }
  }

  // 使用四阶龙格-库塔法计算下一步
  const calculateNextStep = (h: number) => {
    const three = threeRef.current
    const { x, y, z } = three

    const k1 = calculateDerivatives(x, y, z)
    const k2 = calculateDerivatives(
      x + (h * k1.dx) / 2,
      y + (h * k1.dy) / 2,
      z + (h * k1.dz) / 2
    )
    const k3 = calculateDerivatives(
      x + (h * k2.dx) / 2,
      y + (h * k2.dy) / 2,
      z + (h * k2.dz) / 2
    )
    const k4 = calculateDerivatives(x + h * k3.dx, y + h * k3.dy, z + h * k3.dz)

    let nx = x + (h * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx)) / 6
    let ny = y + (h * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy)) / 6
    let nz = z + (h * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz)) / 6

    nx = clampToBoundary(nx)
    ny = clampToBoundary(ny)
    nz = clampToBoundary(nz)

    return { x: nx, y: ny, z: nz }
  }

  // 更新轨迹线
  const updateTrajectory = () => {
    const three = threeRef.current
    if (!three.line) return

    const vertices = new Float32Array(three.trajectory.flat())
    three.line.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(vertices, 3)
    )
  }

  // 重置模拟
  const resetSimulation = () => {
    const three = threeRef.current
    three.x = 1
    three.y = 1
    three.z = 1
    three.trajectory = [[1, 1, 1]]
    three.minBounds = { x: 1, y: 1, z: 1 }
    three.maxBounds = { x: 1, y: 1, z: 1 }
    setTime(0)
    updateTrajectory()

    if (three.camera) {
      three.camera.position.set(0, 0, 20)
      three.camera.lookAt(0, 0, 0)
      three.controls?.target.set(0, 0, 0)
      three.controls?.update()
    }
  }

  // 手动调整视图以显示所有内容
  const fitToView = () => {
    adjustCameraToFit()
  }

  // 动画循环
  useEffect(() => {
    const three = threeRef.current
    if (!three.scene || !three.camera || !three.renderer) {
      return () => {
        console.log('Three.js not initialized yet')
      }
    }

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)

      if (isPlaying) {
        const h = 0.01
        const { x, y, z } = calculateNextStep(h)

        three.x = x
        three.y = y
        three.z = z
        setTime(prev => prev + h)

        updateBounds(x, y, z)

        if (autoScale) {
          adjustCameraToFit()
        }

        three.trajectory.push([x, y, z])
        if (three.trajectory.length > 500) {
          three.trajectory.shift()
        }
        updateTrajectory()

        three.point?.position.set(x, y, z)
      }

      // 确保控制器持续更新
      three.controls?.update()
      if (three.scene && three.camera) {
        three.renderer?.render(three.scene, three.camera)
      }
    }

    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, a, b, c, autoScale, boundaryLimit])

  return (
    <Layout
      style={{
        height: '100%',
        background: '#f0f2f5',
        overflowY: 'auto'
      }}
    >
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Title level={3} style={{ margin: '16px 0' }}>
          微分方程组可视化模拟器
        </Title>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Card
              title="微分方程组"
              variant="borderless"
              style={{ height: '100%' }}
              extra={
                <Tooltip title="该方程组展示了一个三维非线性动力系统的演化">
                  <InfoOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
                </Tooltip>
              }
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '150px',
                  padding: '20px',
                  background: '#f9f9f9',
                  borderRadius: '4px'
                }}
              >
                <BlockMath math={EQUATION} />
              </div>
              <Paragraph style={{ marginTop: 16 }}>
                该系统展示了一个三维非线性动力系统的演化过程，通过调整参数a、b、c可以观察到系统从周期性行为到混沌行为的转变。
              </Paragraph>
              <Divider style={{ margin: '63px 0' }} />

              <Space size="middle">
                <Button
                  type="primary"
                  icon={
                    isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />
                  }
                  onClick={() => {
                    setIsPlaying(!isPlaying)
                  }}
                >
                  {isPlaying ? '暂停动画' : '播放动画'}
                </Button>
                <Button
                  danger
                  icon={<SyncOutlined spin={false} />}
                  onClick={resetSimulation}
                >
                  重置模拟
                </Button>
                <Button icon={<ZoomInOutlined />} onClick={fitToView}>
                  适应视图
                </Button>
                <Checkbox
                  checked={autoScale}
                  onChange={e => {
                    setAutoScale(e.target.checked)
                  }}
                >
                  自动调整视图范围
                </Checkbox>
              </Space>

              <div style={{ marginTop: 16 }}>
                <Text>模拟时间: {time.toFixed(2)} 秒</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="参数控制"
              variant="borderless"
              style={{ height: '100%' }}
            >
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Text strong>参数 a: {a.toFixed(1)}</Text>
                </div>
                <Slider
                  min={-5}
                  max={5}
                  step={0.1}
                  value={a}
                  onChange={value => {
                    setA(value)
                  }}
                  tooltip={{
                    formatter: value => `a = ${value?.toFixed(1) ?? 'N/A'}`
                  }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  控制x变量的线性增长和非线性交互项
                </Text>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Text strong>参数 b: {b.toFixed(1)}</Text>
                </div>
                <Slider
                  min={-5}
                  max={5}
                  step={0.1}
                  value={b}
                  onChange={value => {
                    setB(value)
                  }}
                  tooltip={{
                    formatter: value => `b = ${value?.toFixed(1) ?? 'N/A'}`
                  }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  控制y变量的线性增长和非线性交互项
                </Text>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Text strong>参数 c: {c.toFixed(1)}</Text>
                </div>
                <Slider
                  min={-5}
                  max={5}
                  step={0.1}
                  value={c}
                  onChange={value => {
                    setC(value)
                  }}
                  tooltip={{
                    formatter: value => `c = ${value?.toFixed(1) ?? 'N/A'}`
                  }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  控制z变量的线性增长和非线性交互项
                </Text>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Text strong>边界限制: {boundaryLimit}</Text>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={boundaryLimit}
                  onChange={value => {
                    setBoundaryLimit(value)
                  }}
                  tooltip={{
                    formatter: value => `±${value?.toString() ?? 'N/A'}`
                  }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  限制轨迹点的最大范围，防止超出可视区域
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          title="3D 动画展示"
          variant="borderless"
          style={{ marginBottom: '24px' }}
        >
          <div
            ref={canvasRef}
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}
          />
          <div
            style={{
              width: '456px',
              padding: '8px 12px',
              position: 'absolute',
              top: 8,
              left: 120,
              background: '#f9f9f9',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <Paragraph type="secondary" style={{ margin: 0 }}>
              交互提示: 鼠标拖拽可旋转视角，滚轮可缩放，右键拖拽可平移视图
            </Paragraph>
          </div>
        </Card>
      </Content>
    </Layout>
  )
}
