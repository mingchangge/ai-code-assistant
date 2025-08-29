// 根据主题模式获取对应的样式变量
const getThemeStyles = (theme: 'light' | 'dark') => ({
  // 背景色
  backgroundColor: theme === 'light' ? '#f5f5f5' : '#141414',
  // 卡片/组件背景色
  cardBgColor: theme === 'light' ? '#ffffff' : '#1f1f1f',
  // 文本颜色
  textColor: theme === 'light' ? '#333333' : '#ffffff',
  // 边框颜色
  borderColor: theme === 'light' ? '#eeeeee' : '#333333',
  // 阴影效果
  shadow:
    theme === 'light'
      ? '0 2px 8px rgba(0, 0, 0, 0.08)'
      : '0 2px 8px rgba(0, 0, 0, 0.3)',
  boxBottomShadow:
    theme === 'light'
      ? '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      : '0 1px 2px 0 rgba(255, 255, 255, 0.03), 0 1px 6px -1px rgba(255, 255, 255, 0.02), 0 2px 4px 0 rgba(255, 255, 255, 0.02);'
})

export default getThemeStyles
