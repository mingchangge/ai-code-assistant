import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import useTheme from './hooks/useTheme' // 自定义主题 Hook
import { ThemeProvider } from './contexts/ThemeContext' // 自定义主题提供者

import router from './router'
import getThemeStyles from './utils/getThemeStyles'
import './App.css'

// 1. 创建内部组件，在 ThemeProvider 内部使用 useTheme
const AppContent = () => {
  // 此时调用 useTheme 时，已在 ThemeProvider 内部
  const { theme } = useTheme()

  const defaultThemeConfig = {
    token: {
      colorPrimary: '#1890ff',
      colorBgContainer: getThemeStyles(theme).cardBgColor,
      colorText: getThemeStyles(theme).textColor,
      colorBorder: getThemeStyles(theme).borderColor,
      colorBgBase: getThemeStyles(theme).backgroundColor
    }
  }

  return (
    <ConfigProvider theme={defaultThemeConfig}>
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
