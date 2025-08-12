interface KirvanoLogoProps {
  className?: string
}

export function KirvanoLogo({ className = "h-8 w-auto" }: KirvanoLogoProps) {
  return (
    <img
      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Default-SmwQfm8vXP0a6Af8ZN7hKPZr5PkHiC.png"
      alt="Kirvano"
      className={className}
    />
  )
}
