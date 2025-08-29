// 根据主题模式获取对应的样式变量
const getThemeStyles = () => {
  return {
    // 背景色-全局
    backgroundColor: 'var(--ant-color-bg-base)',
    // 边框颜色
    borderColor: 'var(--ant-color-border)',
    // 阴影效果
    shadow: 'var(--ant-box-shadow)'
  }
}

export default getThemeStyles
