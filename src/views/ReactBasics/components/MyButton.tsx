import { useState } from 'react'

function MyButton() {
  const [count, setCount] = useState(0)
  const handleClick = () => {
    setCount(count + 1)
  }
  return <button onClick={handleClick}>My Button {count}</button>
}

export default MyButton
