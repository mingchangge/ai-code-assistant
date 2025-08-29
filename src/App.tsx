import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
// antd v5 默认兼容 React 16 ~ 18 版本，对于 React 19 版本，可以使用以下兼容方法进行适配，该兼容方式以及接口将在 v6 被移除。
import '@ant-design/v5-patch-for-react-19'
import useTheme from './hooks/useTheme' // 自定义主题 Hook
import { ThemeProvider } from './contexts/ThemeProvider' // 自定义主题提供者
import router from './router'
import './App.css'

// 1. 创建内部组件，在 ThemeProvider 内部使用 useTheme
const AppContent = () => {
  const { themeConfig } = useTheme()
  return (
    <ConfigProvider theme={themeConfig}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

// 2. 外层 App 组件只负责渲染 ThemeProvider
const App = () => {
  return (
    <ThemeProvider>
      <AppContent /> {/* 内部组件在提供者内部，可安全使用 useTheme */}
    </ThemeProvider>
  )
}

export default App
