import { Copy } from 'lucide-react'
interface VariablesDisplayProps {
  variables: string[]
}
export function VariablesDisplay({ variables }: VariablesDisplayProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`{{${text}}}`)
  }
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-2 mb-3">
       
        <h4 className="text-sm font-semibold text-gray-700">
          Variables Used in This Template
        </h4>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {variables.length} dynamic fields • Click to copy
      </p>
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <button
            key={variable}
            onClick={() => copyToClipboard(variable)}
            className="group flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono border border-blue-100 transition-colors"
            title="Click to copy"
          >
            <span>{`{{${variable}}}`}</span>
            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  )
}
