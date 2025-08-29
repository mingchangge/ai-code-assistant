import { useState, useEffect, type ReactNode } from 'react'
import { theme } from 'antd'
import { ThemeContext } from './theme-context'
import type { ThemeMode, ThemeContextType } from './theme-context'

// 导入Ant Design内置算法
const { defaultAlgorithm, darkAlgorithm } = theme

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // 从localStorage读取保存的主题模式
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('app-theme') as ThemeMode | null) ?? 'light'
  )

  // 根据主题模式切换算法
  const themeConfig: ThemeContextType['themeConfig'] = {
    algorithm: themeMode === 'light' ? defaultAlgorithm : darkAlgorithm,
    // 可以在这里添加自定义token，会与算法生成的token合并
    token: {
      colorPrimary: '#1890ff' // 保持主色调一致
    }
  }

  // 切换主题模式
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
    localStorage.setItem('app-theme', newMode)
  }

  // 同步主题到HTML根元素（方便自定义样式适配）
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])

  const contextValue: ThemeContextType = {
    theme: themeMode,
    toggleTheme,
    themeConfig
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
