import { useEffect, useState } from 'react'
import Clock from './Clock'

const colorOptions = [
  {
    color: '#FFB6C1',
    name: '浅粉红'
  },
  {
    color: '#F5DEB3',
    name: '小麦色'
  },
  {
    color: '#87CEEB',
    name: '天蓝色'
  }
]
export default function TimeChange() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())
  const [color, setColor] = useState('#FFB6C1')
  const colorChangeHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setColor(e.target.value)
  }
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000) // 每秒更新一次
    return () => {
      clearInterval(timer) // 组件卸载时清除定时器
    }
  }, [])
  // useLayoutEffect 会在浏览器绘制 DOM 之前执行，所以时间会固定
  // useLayoutEffect(() => {
  //   setTime(new Date().toLocaleTimeString()) // 时间固定
  // }, [])
  return (
    <>
      <select name="color" onChange={colorChangeHandler}>
        {colorOptions.map(element => (
          <option key={element.color} value={element.color}>
            {element.name}
          </option>
        ))}
      </select>
      <Clock color={color} time={time} />
    </>
  )
}
