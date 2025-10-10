interface Person {
  name: string
  imageSrc: string
}
function Avatar({ person, size }: { person: Person; size: number }) {
  return (
    <img
      className="avatar"
      src={person.imageSrc}
      alt={person.name}
      width={size}
      height={size}
    />
  )
}
export default Avatar
interface Props {
  person: Person
  size: number
}
export function Avatar2(props: Props) {
  const { person, size } = props
  return (
    <img
      className="avatar"
      src={person.imageSrc}
      alt={person.name}
      width={size}
      height={size}
    />
  )
}

export function Avatar3({
  person,
  size,
  isSepia = false,
  thickBorder
}: {
  person: Person
  size: number
  isSepia: boolean
  thickBorder: boolean
}) {
  return (
    <img
      className="avatar"
      src={person.imageSrc}
      alt={person.name}
      style={{
        // 根据 isSepia 决定是否应用 sepia 滤镜
        filter: isSepia ? 'sepia(1)' : 'none',
        // 根据 thickBorder 决定边框宽度
        borderWidth: thickBorder ? '4px' : '2px',
        width: size,
        height: size
      }}
    />
  )
}
