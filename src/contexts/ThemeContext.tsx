import { useState, useEffect, type ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './theme-context'

// 主题提供者组件
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // 从localStorage读取保存的主题，默认亮色
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app-theme')
      return savedTheme ? (savedTheme as ThemeMode) : 'light'
    }
    return 'light'
  })

  // 当主题变化时保存到localStorage
  useEffect(() => {
    localStorage.setItem('app-theme', theme)
  }, [theme])

  // 切换主题的方法
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
