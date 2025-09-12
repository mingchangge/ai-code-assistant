import '@/styles/font.css'

const info = {
  name: '亲爱的朋友',
  border: '1px solid transparent'
}

function MyComponent() {
  return (
    <>
      <h2 className="title">Hello {info.name}， 欢迎来到React的世界！</h2>
      <p className="normal card" style={{ border: info.border }}>
        这是一个段落
      </p>
      <p className="normal2">这是一个段落2</p>
    </>
  )
}
export default MyComponent
