import React, { useCallback, useEffect, useState, useRef } from 'react'
import { type BodySection as BodySectionType } from './template'
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'

interface BodySectionProps {
  section: BodySectionType
  index: number
  onChange: (id: string, newText: string) => void
}

const MAX_CHAR_COUNT = 500

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{[^}]+\}\}/g)
  return matches || []
}

export function BodySection({ section, index, onChange }: BodySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Character count kasama ang space at newlines
  const charCount = section.text.length
  const isAtLimit = charCount >= MAX_CHAR_COUNT

  // Variable validation logic
  const requiredVars = section.requiredVariables || []
  const currentVars = extractVariables(section.text)
  const missingVars = requiredVars.filter((v) => !currentVars.includes(v))
  const hasMissing = missingVars.length > 0

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.length <= MAX_CHAR_COUNT) {
      onChange(section.id, val)
    }
  }

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    autoResize()
  }, [section.text, autoResize])

  return (
    <div className={`border rounded-md mb-4 overflow-hidden transition-all ${
      hasMissing ? 'border-amber-400' : isAtLimit ? 'border-amber-500 shadow-sm' : 'border-gray-200'
    }`}>
      <div
        className={`px-4 py-2 flex items-center justify-between cursor-pointer border-b ${
          hasMissing ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Body Text #{index + 1}
          </span>
          {hasMissing && (
            <span className="text-[10px] text-amber-600 font-semibold flex items-center">
              <AlertTriangle className="w-3 h-3 mr-0.5" />
              {missingVars.length} variable missing
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-white">
          <textarea
            ref={textareaRef}
            value={section.text}
            onChange={handleChange}
            onInput={autoResize}
            maxLength={MAX_CHAR_COUNT} // Browser-level hard stop
            className={`w-full min-h-[120px] p-3 text-sm border rounded-md outline-none resize-none font-mono leading-relaxed transition-all ${
              hasMissing ? 'border-amber-300 focus:ring-2 focus:ring-amber-300' : 
              isAtLimit ? 'border-amber-400 bg-amber-50/20' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
            }`}
            placeholder="Enter certificate body text here..."
          />
          <div className="mt-2 flex justify-between items-center">
            <p className="text-[10px] text-gray-400 italic">
             {charCount}/{MAX_CHAR_COUNT}
            </p>
            <div className={`flex items-center text-xs font-mono font-bold ${isAtLimit ? 'text-amber-600' : 'text-gray-500'}`}>
              {isAtLimit && <AlertCircle className="w-3 h-3 mr-1" />}
              {charCount.toLocaleString()} / {MAX_CHAR_COUNT}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}