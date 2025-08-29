import { useState } from 'react'
import { Outlet } from 'react-router-dom'
// 样式相关
import styled from 'styled-components'
import useTheme from '@/hooks/useTheme'
import getThemeStyles from '../utils/getThemeStyles'
// antd组件
import { Layout, Button, FloatButton } from 'antd'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MoonOutlined,
  SunOutlined
} from '@ant-design/icons'
// 自定义组件
import SideMenu from './components/SideMenu'

// 从 getThemeStyles 中获取主题样式,方便有改动后进行替换
const setThemeStyle = getThemeStyles()
// 从 Layout 中解构出 Header, Sider, Content 组件
const { Header, Sider, Content } = Layout
// 自定义 Layout 样式
const StyledLayout = styled(Layout)`
  height: 100%;
  text-align: left;
`
// 自定义 Header 样式
const StyledHeader = styled(Header)`
  display: 'flex';
  align-items: 'center';
  width: 100%;
  height: 64px;
  background: ${setThemeStyle.backgroundColor};
  border-bottom: 1px solid ${setThemeStyle.borderColor};
  box-shadow: ${setThemeStyle.shadow};
  h1 {
    font-size: 24px;
  }
  .theme-toggle {
    position: absolute;
    top: 16px;
    right: 16px;
  }
`
// 自定义 Sider 样式
const StyledSider = styled(Sider)<{ collapsed: boolean }>`
  width: ${props => (props.collapsed ? '80px' : '200px')};
  border-right: 1px solid ${setThemeStyle.borderColor};
  background: ${setThemeStyle.backgroundColor};
  transition: width 0.3s ease;
  .ant-menu {
    border-inline-end: none !important;
    background-color: transparent;
    text-align: ${props => (props.collapsed ? 'center' : 'left')};
`
// 自定义 Content 样式
const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  min-height: 280px;
  background: ${setThemeStyle.backgroundColor};
  border: 1px solid ${setThemeStyle.borderColor};
  box-shadow: ${setThemeStyle.shadow};
`

// 主布局组件
const MainLayout = () => {
  // 侧边栏折叠状态
  const [collapsed, setCollapsed] = useState(false)
  // 获取主题状态和切换方法
  const { theme, toggleTheme } = useTheme()

  // 返回布局页面
  return (
    <StyledLayout>
      <StyledHeader theme={theme}>
        <h1>AI Code Assistant</h1>
        <Button
          shape="circle"
          className="theme-toggle"
          icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
          aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          onClick={toggleTheme}
        ></Button>
      </StyledHeader>
      <Layout>
        <StyledSider
          theme={theme}
          trigger={null}
          collapsible
          collapsed={collapsed}
        >
          <SideMenu />
          <FloatButton
            style={{ position: 'absolute', right: '4px', bottom: '4px' }}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            shape="square"
            onClick={() => {
              setCollapsed(!collapsed)
            }}
          />
        </StyledSider>
        <StyledContent theme={theme}>
          <Outlet />
        </StyledContent>
      </Layout>
    </StyledLayout>
  )
}

export default MainLayout
