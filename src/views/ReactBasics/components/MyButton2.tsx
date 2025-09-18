function MyButtonShared({
  count,
  onClick
}: {
  count: number
  onClick: () => void
}) {
  return <button onClick={onClick}>My Button {count}</button>
}

export default MyButtonShared
