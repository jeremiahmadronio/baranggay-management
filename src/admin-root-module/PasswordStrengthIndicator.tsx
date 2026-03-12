
interface PasswordStrengthIndicatorProps {
  password?: string
}

export function PasswordStrengthIndicator({
  password = '',
}: PasswordStrengthIndicatorProps) {
  const requirements = [
    { id: 'length', label: '8+ chars', regex: /.{8,}/ },
    { id: 'uppercase', label: 'Uppercase', regex: /[A-Z]/ },
    { id: 'lowercase', label: 'Lowercase', regex: /[a-z]/ },
    { id: 'number', label: 'Number', regex: /[0-9]/ },
    // Paalala: Siguraduhin na ang special char dito ay match sa backend regex mo!
    { id: 'special', label: 'Special', regex: /[^A-Za-z0-9]/ },
  ]

  const strength = requirements.reduce(
    (acc, req) => (req.regex.test(password) ? acc + 1 : acc),
    0
  )

  const getStrengthConfig = () => {
    if (strength <= 2) return { color: 'bg-red-500', text: 'text-red-600', label: 'Weak' }
    if (strength <= 3) return { color: 'bg-orange-500', text: 'text-orange-600', label: 'Fair' }
    if (strength === 4) return { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'Good' }
    return { color: 'bg-green-500', text: 'text-green-600', label: 'Strong' }
  }

  const config = getStrengthConfig()

  return (
    <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
      {/* Mini Strength Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 h-1 flex-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                password && strength >= level ? config.color : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider w-10 text-right ${config.text}`}>
          {password ? config.label : ''}
        </span>
      </div>

      {/* Grid Checklist - 2 Columns para hindi matakaw sa vertical space */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {requirements.map((req) => {
          const isMet = req.regex.test(password)
          return (
            <li key={req.id} className="flex items-center gap-1.5 transition-all">
              <div className={`w-1 h-1 rounded-full ${isMet ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className={`text-[11px] ${isMet ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                {req.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}