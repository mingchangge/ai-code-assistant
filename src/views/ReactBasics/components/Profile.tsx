import Avatar, { Avatar2, Avatar3 } from './Avatar'
function Profile() {
  return (
    <Avatar
      person={{
        name: '随机图片 1',
        imageSrc: 'https://picsum.photos/400/225?random=1'
      }}
      size={60}
    />
  )
}
export default Profile

export function Profile2() {
  return (
    <Avatar2
      person={{
        name: '随机图片 2',
        imageSrc: 'https://picsum.photos/400/225?random=2'
      }}
      size={60}
    />
  )
}

interface Person {
  name: string
  imageSrc: string
}
export function Profile3({
  person,
  size,
  isSepia,
  thickBorder
}: {
  person: Person
  size: number
  isSepia: boolean
  thickBorder: boolean
}) {
  return (
    <Avatar3
      person={person}
      size={size}
      isSepia={isSepia}
      thickBorder={thickBorder}
    />
  )
}

interface Props {
  person: Person
  size: number
  isSepia: boolean
  thickBorder: boolean
}
export function Profile4(props: Props) {
  return <Avatar3 {...props} />
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card2">{children}</div>
}

export function Profile5() {
  return (
    <Card>
      <Avatar
        person={{
          name: '随机图片 5',
          imageSrc: 'https://picsum.photos/400/225?random=5'
        }}
        size={60}
      />
      <p>随机图片 5</p>
    </Card>
  )
}
