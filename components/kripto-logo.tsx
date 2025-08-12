interface KriptoLogoProps {
  className?: string
}

export function KriptoLogo({ className = "h-10 w-auto" }: KriptoLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 8L32 20L20 32L8 20L20 8Z" fill="#0000FF" stroke="white" strokeWidth="2" />
        <circle cx="20" cy="20" r="4" fill="white" />
        <path d="M45 12H48.5L55 20L48.5 28H45V12Z" fill="#0000FF" />
        <path d="M58 12H61V28H58V12Z" fill="#0000FF" />
        <path d="M65 12H68V28H65V12Z" fill="#0000FF" />
        <path d="M72 12H75.5L82 20L75.5 28H72V12Z" fill="#0000FF" />
        <path d="M85 12H98V15H85V12Z" fill="#0000FF" />
        <path d="M85 18H95V21H85V18Z" fill="#0000FF" />
        <path d="M85 25H98V28H85V25Z" fill="#0000FF" />
        <path
          d="M102 12H112C114.2 12 116 13.8 116 16V24C116 26.2 114.2 28 112 28H102V12ZM109 16H105V24H109C110.1 24 111 23.1 111 22V18C111 16.9 110.1 16 109 16Z"
          fill="#0000FF"
        />
      </svg>
    </div>
  )
}
