import React from 'react'

type BadgeVariant =
  | 'emerald'
  | 'amber'
  | 'purple'
  | 'blue'
  | 'red'
  | 'slate'
  | 'outline'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  className = '',
  dot = false,
}) => {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}
