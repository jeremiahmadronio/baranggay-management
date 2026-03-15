import React from 'react'
interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  noPadding?: boolean
}
export function Card({
  children,
  className = '',
  title,
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  )
}
