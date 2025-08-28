import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import styled from 'styled-components'
import SideMenu from './components/SideMenu'

import useTheme from '@/hooks/useTheme'
import getThemeStyles from '../utils/getThemeStyles'

import { Layout, Button } from 'antd'
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
`
const StyledHeader = styled(Header)<{ theme: 'light' | 'dark' }>`
  display: 'flex';
  align-items: 'center';
  width: 100%;
  height: 64px;
  background: ${props => getThemeStyles(props.theme).cardBgColor};
  h1 {
    font-size: 24px;
  }
  .theme-toggle {
    position: absolute;
    top: 16px;
    right: 16px;
  }
`
const StyledContent = styled(Content)<{ theme: 'light' | 'dark' }>`
  margin: 24px 16px;
  padding: 24px;
  min-height: 280px;
  background: ${props => getThemeStyles(props.theme).cardBgColor};
`
const MainLayout = () => {
  // 侧边栏折叠状态
  const [collapsed, setCollapsed] = useState(false)
  // 获取主题状态和切换方法
  const { theme, toggleTheme } = useTheme()

  // 返回布局页面
  return (
    <StyledLayout theme={theme}>
      <StyledHeader theme={theme}>
        <h1>AI Code Assistant</h1>
        <Button
          shape="circle"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
        </Button>
      </StyledHeader>
      <Layout>
        <Sider
          style={{ background: '#fff' }}
          trigger={null}
          collapsible
          collapsed={collapsed}
        >
          <SideMenu />
          <Button
            style={{ position: 'absolute', right: 0, bottom: 0 }}
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
          />
        </Sider>
        <StyledContent theme={theme}>
          <Outlet />
        </StyledContent>
      </Layout>
    </StyledLayout>
  )
}

export default MainLayout
