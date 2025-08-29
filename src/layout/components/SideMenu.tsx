import { Menu, type MenuProps } from 'antd'
import {
  DashboardOutlined,
  InfoCircleOutlined,
  ShoppingOutlined
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'

// 定义菜单项类型
interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
}

const SideMenu = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // 菜单项配置
  const menuItems: MenuItem[] = [
    {
      key: 'home',
      icon: <DashboardOutlined />,
      label: '首页',
      path: '/'
    },
    {
      key: 'monaco-esbuild-wasm',
      icon: <InfoCircleOutlined />,
      label: 'Monaco + esbuild-wasm',
      path: '/monaco-esbuild-wasm'
    },
    {
      key: 'monaco-sandpack',
      icon: <ShoppingOutlined />,
      label: 'Monaco + sandpack',
      path: '/monaco-sandpack'
    }
  ]

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = e => {
    const selectedItem = menuItems.find(item => item.key === e.key)
    if (selectedItem) {
      void navigate(selectedItem.path)
    }
  }

  // 找到当前激活的菜单项
  const findSelectedKey = () => {
    const matchedItem = menuItems.find(item => item.path === location.pathname)
    return matchedItem ? matchedItem.key : ''
  }

  return (
    <Menu
      selectedKeys={[findSelectedKey()]}
      onClick={handleMenuClick}
      items={menuItems.map(item => ({
        key: item.key,
        icon: item.icon,
        label: item.label
      }))}
    />
  )
}

export default SideMenu
