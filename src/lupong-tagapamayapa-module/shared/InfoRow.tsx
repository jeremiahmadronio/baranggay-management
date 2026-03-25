interface InfoRowProps {
  label: string
  value?: string | number | null
}
export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800 font-medium">{value ?? '—'}</p>
    </div>
  )
}
