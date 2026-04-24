import { type Signatory } from './template'
import { Plus, Trash2, AlertCircle } from 'lucide-react'

interface SignatoriesSectionProps {
  signatories: Signatory[]
  onChange: (index: number, field: keyof Signatory, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function SignatoriesSection({
  signatories,
  onChange,
  onAdd,
  onRemove,
}: SignatoriesSectionProps) {
  const MAX_SIGNATORIES = 3
  const MAX_CHAR_LIMIT = 40

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Signatories ({signatories.length}/{MAX_SIGNATORIES})
        </h4>
        <button
          onClick={onAdd}
          disabled={signatories.length >= MAX_SIGNATORIES}
          className={`flex items-center px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            signatories.length >= MAX_SIGNATORIES 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Signatory
        </button>
      </div>

      <div className="space-y-4">
        {signatories.map((signatory, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-md p-3 bg-gray-50/50 relative"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Signatory #{index + 1}
              </span>
              {signatories.length > 1 && (
                <button
                  onClick={() => onRemove(index)}
                  className="flex items-center px-2 py-0.5 text-[10px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* NAME INPUT */}
              <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase">
        Full Name
      </label>
      <span className={`text-[9px] font-mono ${signatory.name.length >= MAX_CHAR_LIMIT ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
        {signatory.name.length}/{MAX_CHAR_LIMIT}
      </span>
    </div>
    <input
      type="text"
      maxLength={MAX_CHAR_LIMIT}
      value={signatory.name}
      onChange={(e) => onChange(index, 'name', e.target.value)}
      placeholder="e.g. JUAN P. DELA CRUZ"
      className={`w-full p-2 text-sm border rounded outline-none transition-all font-bold ${
        signatory.name.length >= MAX_CHAR_LIMIT ? 'border-amber-400 bg-amber-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-600'
      }`}
    />
    {/* SPECIFIC ALERT FOR NAME */}
    {signatory.name.length >= MAX_CHAR_LIMIT && (
      <p className="text-[9px] text-red-600 mt-1 flex items-center italic">
        <AlertCircle className="w-2.5 h-2.5 mr-1" />
        limit reached.
      </p>
    )}
  </div>

              {/* POSITION INPUT */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Position
                  </label>
                  <span className={`text-[9px] font-mono ${signatory.position.length >= MAX_CHAR_LIMIT ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {signatory.position.length}/{MAX_CHAR_LIMIT}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={MAX_CHAR_LIMIT}
                  value={signatory.position}
                  onChange={(e) => onChange(index, 'position', e.target.value)}
                  placeholder="e.g. Punong Barangay"
                  className={`w-full p-2 text-sm border rounded outline-none transition-all ${
                    signatory.position.length >= MAX_CHAR_LIMIT ? 'border-amber-400 bg-amber-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-600'
                  }`}
                />
              </div>
            </div>
            
            {(signatory.name.length >= MAX_CHAR_LIMIT || signatory.position.length >= MAX_CHAR_LIMIT) && (
              <p className="text-[9px] text-red-600 mt-2 flex items-center italic">
                <AlertCircle className="w-2.5 h-2.5 mr-1" />
                 limit reached .
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}