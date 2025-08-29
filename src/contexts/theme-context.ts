import { createContext } from 'react'
import type { ThemeConfig } from 'antd'

// 定义主题模式类型
export type ThemeMode = 'light' | 'dark'

// 定义上下文类型
export interface ThemeContextType {
  theme: ThemeMode
  toggleTheme: () => void
  themeConfig: ThemeConfig
}

// 创建上下文
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
)
