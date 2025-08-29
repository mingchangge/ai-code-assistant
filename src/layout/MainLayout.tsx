import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import styled from 'styled-components'
import SideMenu from './components/SideMenu'

import useTheme from '@/hooks/useTheme'
import getThemeStyles from '../utils/getThemeStyles'

import { Layout, Button, FloatButton } from 'antd'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MoonOutlined,
  SunOutlined
} from '@ant-design/icons'

// 从 Layout 中解构出 Header, Sider, Content 组件
const { Header, Sider, Content } = Layout
// 自定义 Layout 样式
const StyledLayout = styled(Layout)`
  height: 100%;
  text-align: left;
`
const StyledHeader = styled(Header)<{ theme: 'light' | 'dark' }>`
  display: 'flex';
  align-items: 'center';
  width: 100%;
  height: 64px;
  background: ${props => getThemeStyles(props.theme).cardBgColor};
  border-bottom: 1px solid ${props => getThemeStyles(props.theme).borderColor};
  box-shadow: ${props => getThemeStyles(props.theme).shadow};
  h1 {
    font-size: 24px;
  }
  .theme-toggle {
    position: absolute;
    top: 16px;
    right: 16px;
  }
`
const StyledSider = styled(Sider)<{
  collapsed: boolean
  theme: 'light' | 'dark'
}>`
  width: ${props => (props.collapsed ? '80px' : '200px')};
  border-right: 1px solid ${props => getThemeStyles(props.theme).borderColor};
  background: ${props => getThemeStyles(props.theme).cardBgColor};
  transition: width 0.3s ease;
  .ant-menu {
    border-inline-end: none !important;
    background-color: transparent;
    text-align: ${props => (props.collapsed ? 'center' : 'left')};
`
const StyledContent = styled(Content)<{ theme: 'light' | 'dark' }>`
  margin: 24px 16px;
  padding: 24px;
  min-height: 280px;
  background: ${props => getThemeStyles(props.theme).cardBgColor};
  border: 1px solid ${props => getThemeStyles(props.theme).borderColor};
  box-shadow: ${props => getThemeStyles(props.theme).shadow};
`
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
