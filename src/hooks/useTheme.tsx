import { useContext } from 'react'
import { ThemeContext } from '@/contexts/theme-context'
import type { ThemeContextType } from '@/contexts/theme-context'

// 单独导出主题 Hook
const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

export default useTheme
