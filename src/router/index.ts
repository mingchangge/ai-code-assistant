import {
  lazy,
  createElement,
  Suspense as ReactSuspense,
  type ReactElement,
  type ComponentType,
  type LazyExoticComponent,
  type PropsWithChildren
} from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import Loading from '../components/Loading'

// 定义默认Props接口，替代空对象类型{}
interface DefaultProps {
  // 1. 控制组件显示/隐藏（如布局是否折叠、Loading是否显示）
  isVisible?: boolean // 可选，默认true（显示）

  // 2. 自定义样式（支持内联样式或类名）
  style?: React.CSSProperties // 内联样式，符合React.CSSProperties类型
  className?: string // 外部传入的CSS类名，用于样式覆盖

  // 3. 路由相关参数（如果组件需要路由信息，如MainLayout可能需要当前路径）
  currentPath?: string // 当前路由路径，如"/home"
  isHomePage?: boolean // 是否为首页，用于差异化渲染（如首页隐藏侧边栏）

  // 4. 加载状态回调（如Loading组件加载完成后通知父组件）
  onLoadFinish?: () => void // 无参数、无返回值的回调函数
}

// 定义LazyComponent类型
type LazyComponent<T = DefaultProps> = () => Promise<{
  default: ComponentType<T>
}>

// 修复后的wrapWithSuspense函数
const wrapWithSuspense = <T = DefaultProps>(
  lazyComponent: LazyComponent<T>
): ComponentType<T> => {
  // 明确声明LazyComponent的类型
  const LazyLoadedComponent: LazyExoticComponent<ComponentType<T>> =
    lazy(lazyComponent)

  // 返回一个新的组件函数，处理props类型
  return (props: T): ReactElement => {
    // 类型断言，帮助TypeScript识别组件类型
    const Component = LazyLoadedComponent as unknown as ComponentType<
      PropsWithChildren<T>
    >

    return createElement(
      ReactSuspense,
      { fallback: createElement(Loading) },
      // 传递props时明确类型
      createElement(Component, props as PropsWithChildren<T>)
    )
  }
}

// 路由懒加载
const MainLayout = wrapWithSuspense(() => import('@/layout/MainLayout'))
const Home = wrapWithSuspense(() => import('@/views/home/index'))
const MonacoEsbuildWasm = wrapWithSuspense(
  () => import('@/views/MonacoEsbuildWasm/index')
)
const MonacoSandpack = wrapWithSuspense(
  () => import('@/views/MonacoSandpack/index')
)
const NotFound = wrapWithSuspense(() => import('@/views/NotFound/index'))

const routes: RouteObject[] = [
  {
    path: '/',
    element: createElement(MainLayout),
    children: [
      // 关键：默认子路由（匹配/时，<Outlet />渲染Home）
      { index: true, element: createElement(Home) },

      {
        path: '/monaco-esbuild-wasm',
        element: createElement(MonacoEsbuildWasm)
      },
      {
        path: '/monaco-sandpack',
        element: createElement(MonacoSandpack)
      }
    ]
  },
  {
    path: '*',
    element: createElement(NotFound)
  }
]

// 创建路由
const router = createBrowserRouter(routes)

// 路由提供组件（使用函数式创建元素）
// const AppRouter = (): ReactElement => createElement(RouterProvider, { router })

export default router
