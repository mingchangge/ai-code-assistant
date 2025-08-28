// src/contexts/theme-context.ts
import { createContext } from 'react'

// 主题模式类型
export type ThemeMode = 'light' | 'dark'

// Context 数据类型
export interface ThemeContextType {
  theme: ThemeMode
  toggleTheme: () => void
}

// 创建并导出 Context（非组件）
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
)
