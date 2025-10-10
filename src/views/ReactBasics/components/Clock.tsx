export default function Clock({
  color,
  time
}: {
  color: string
  time: string
}) {
  return <p style={{ fontSize: '36px', color: color }}>{time}</p>
}
