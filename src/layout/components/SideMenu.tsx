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
  path?: string
  children?: MenuItem[]
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
      key: 'ai-code-generator',
      icon: <InfoCircleOutlined />,
      label: 'AI代码生成',
      children: [
        {
          key: 'multi-spark-code',
          icon: <InfoCircleOutlined />,
          label: 'Multi Spark Code',
          path: '/multi-spark-code'
        },
        {
          key: 'monaco-esbuild-wasm',
          icon: <InfoCircleOutlined />,
          label: 'Monaco + esbuild-wasm',
          path: '/monaco-esbuild-wasm'
        },
        {
          key: 'multi-monaco-esbuild-wasm',
          icon: <InfoCircleOutlined />,
          label: 'Multi Monaco + esbuild-wasm',
          path: '/multi-monaco-esbuild-wasm'
        }
      ]
    },

    {
      key: 'code-demo',
      icon: <InfoCircleOutlined />,
      label: '代码编辑和预览',
      children: [
        {
          key: 'monaco-sandpack',
          icon: <ShoppingOutlined />,
          label: 'Monaco + sandpack',
          path: '/monaco-sandpack'
        },
        {
          key: 'sandpack',
          icon: <ShoppingOutlined />,
          label: 'Sandpack',
          path: '/sandpack'
        },
        {
          key: 'stackblitz',
          icon: <ShoppingOutlined />,
          label: 'Stackblitz',
          path: '/stackblitz'
        },
        {
          key: 'codesandbox-embed',
          icon: <ShoppingOutlined />,
          label: 'CodeSandbox Embed',
          path: '/codesandbox-embed'
        }
      ]
    },
    {
      key: 'intersection-observer',
      icon: <ShoppingOutlined />,
      label: 'IntersectionObserver',
      path: '/intersection-observer'
    },
    {
      key: 'react-basics',
      icon: <ShoppingOutlined />,
      label: 'React Basics',
      path: '/react-basics'
    },
    {
      key: 'js-new-features',
      icon: <ShoppingOutlined />,
      label: 'JavaScript 新特性',
      path: '/js-new-features'
    },
    {
      key: 'fixed-equation-visualizer',
      icon: <ShoppingOutlined />,
      label: '方程可视化',
      path: '/fixed-equation-visualizer'
    }
  ]

  // 递归查找菜单项（包括子菜单）
  const findMenuItemByKey = (
    items: MenuItem[],
    key: string
  ): MenuItem | undefined => {
    for (const item of items) {
      if (item.key === key) {
        return item
      }
      if (item.children) {
        const found = findMenuItemByKey(item.children, key)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = e => {
    // 查找被点击的菜单项（包括子菜单）
    const selectedItem = findMenuItemByKey(menuItems, e.key)

    if (selectedItem?.path) {
      void navigate(selectedItem.path)
    }
  }

  // 找到当前激活的菜单项
  const findSelectedKey = () => {
    // 递归查找匹配当前路径的菜单项
    const findMatchedItem = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.path === location.pathname) {
          return item
        }
        if (item.children) {
          const matched = findMatchedItem(item.children)
          if (matched) {
            return matched
          }
        }
      }
      return undefined
    }

    const matchedItem = findMatchedItem(menuItems)
    return matchedItem ? matchedItem.key : ''
  }

  return (
    <Menu
      selectedKeys={[findSelectedKey()]}
      onClick={handleMenuClick}
      mode="inline"
      items={menuItems.map(item => ({
        ...item,
        children: item.children?.map(child => ({
          ...child
        }))
      }))}
    />
  )
}

export default SideMenu
