import React from 'react'
import { type TemplateData } from './template'
import { Printer, Maximize2 } from 'lucide-react'
import { ResidencyPreview } from './ResidencyPreview'
import { ClearancePreview } from './ClearancePreview'
import { IndigencyPreview } from './IndegencyPreview' 
import { JobSeekerPreview } from './JobSeekerPreview'
import { TricyclePreview } from './TricyclePreview'
interface CertificatePreviewProps {
  template: TemplateData
}
export function CertificatePreview({ template }: CertificatePreviewProps) {
  const renderPreview = () => {
    switch (template.id) {
      case 'residency':
        return <ResidencyPreview template={template} />
      case 'barangay-clearance':
        return <ClearancePreview template={template} />
      case 'indigency':
        return <IndigencyPreview template={template} />
      case 'job-seeker':
        return <JobSeekerPreview template={template} />
      case 'tricycle':
        return <TricyclePreview template={template} />
      default:
        // Default fallback to Residency style for others
        return <ResidencyPreview template={template} />
    }
  }
  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Live Preview</h2>
          <div className="flex items-center space-x-3 text-xs mt-1">
            
            
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </button>
          
        </div>
      </div>

      {/* Certificate Paper - A4 */}
      <div className="flex-1 p-3 md:p-5  rounded-lg bg-gray-100/50 border border-gray-200">
        {renderPreview()}
      </div>
    </div>
  )
}
