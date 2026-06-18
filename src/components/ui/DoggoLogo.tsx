import Image from 'next/image'

interface Props {
  size?: number   // height in px
  className?: string
}

export default function DoggoLogo({ size = 40, className = '' }: Props) {
  return (
    <Image
      src="/logo-round.png"
      alt="Doggo"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}
