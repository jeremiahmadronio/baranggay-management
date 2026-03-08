import React from 'react'
import {
  type TemplateData,
  type Signatory,
  type CertificateSettings as SettingsType,
} from './template'
import { BodySection } from './BodySection'
import { PaymentInfo } from './PaymentInfo'
import { SignatoriesSection } from './SignatoriesSection'
import { CertificateSettings } from './CertificateSettings'
import { VariablesDisplay } from './VariableDisplay'
import { RotateCcw, Save, AlertTriangle, AlertCircle } from 'lucide-react'
interface ValidationError {
  sectionIndex: number
  sectionId: string
  missingVars: string[]
}
interface TemplateEditorProps {
  template: TemplateData
  onUpdate: (updatedTemplate: TemplateData) => void
  onSave: () => void
  onReset: () => void
  isSaving: boolean
  canSave: boolean
  validationErrors: ValidationError[]
}
export function TemplateEditor({
  template,
  onUpdate,
  onSave,
  onReset,
  isSaving,
  canSave,
  validationErrors,
}: TemplateEditorProps) {
  const handleTitleChange = (newTitle: string) => {
    onUpdate({
      ...template,
      title: newTitle,
    })
  }
  const handleBodyChange = (id: string, newText: string) => {
    const updatedSections = template.bodySections.map((section) =>
      section.id === id
        ? {
            ...section,
            text: newText,
          }
        : section,
    )
    onUpdate({
      ...template,
      bodySections: updatedSections,
    })
  }
  const handleFooterChange = (newText: string) => {
    onUpdate({
      ...template,
      footerText: newText,
    })
  }
  const handleSignatoryChange = (
    index: number,
    field: keyof Signatory,
    value: string,
  ) => {
    const updatedSignatories = [...template.signatories]
    updatedSignatories[index] = {
      ...updatedSignatories[index],
      [field]: value,
    }
    onUpdate({
      ...template,
      signatories: updatedSignatories,
    })
  }
  const handleAddSignatory = () => {
    onUpdate({
      ...template,
      signatories: [
        ...template.signatories,
        {
          name: '',
          position: '',
        },
      ],
    })
  }
  const handleRemoveSignatory = (index: number) => {
    if (template.signatories.length <= 1) return
    const updatedSignatories = template.signatories.filter(
      (_, i) => i !== index,
    )
    onUpdate({
      ...template,
      signatories: updatedSignatories,
    })
  }
  const handleSettingsChange = (field: keyof SettingsType, value: any) => {
    onUpdate({
      ...template,
      settings: {
        ...template.settings,
        [field]: value,
      },
    })
  }
  const handleSettingsBatchChange = (updates: Partial<SettingsType>) => {
    onUpdate({
      ...template,
      settings: {
        ...template.settings,
        ...updates,
      },
    })
  }
  const totalMissing = validationErrors.reduce(
    (sum, e) => sum + e.missingVars.length,
    0,
  )
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Template Editor</h2>
          <p className="text-xs text-gray-500 mt-0.5">{template.title}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onReset}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !canSave}
            className={`flex items-center px-4 py-1.5 text-xs font-medium border border-transparent rounded transition-colors ${canSave ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' : 'text-gray-400 bg-gray-200 cursor-not-allowed'} disabled:opacity-70 disabled:cursor-not-allowed`}
            title={
              !canSave
                ? `${totalMissing} required variable${totalMissing > 1 ? 's' : ''} missing`
                : 'Save template'
            }
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {!canSave && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
          <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700">
              Cannot save — {totalMissing} required variable
              {totalMissing > 1 ? 's' : ''} missing
            </p>
            <div className="mt-1 space-y-0.5">
              {validationErrors.map((err) => (
                <p key={err.sectionId} className="text-[11px] text-amber-600">
                  Body Text #{err.sectionIndex + 1}:{' '}
                  {err.missingVars.map((v) => v).join(', ')}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Certificate Title
          </label>
          <input
            type="text"
            value={template.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full p-2.5 text-sm font-bold text-gray-800 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Certificate Body Sections
          </label>
          {template.bodySections.map((section, index) => (
            <BodySection
              key={section.id}
              section={section}
              index={index}
              onChange={handleBodyChange}
            />
          ))}
        </div>

        {template.settings.hasFee && <PaymentInfo />}

<div className="space-y-2">
  <div className="flex justify-between items-center">
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
      Footer Text
    </label>
    <span className={`text-[10px] font-mono font-bold ${
      (template.footerText?.length || 0) >= 80 ? 'text-red-500' : 'text-gray-400'
    }`}>
      {template.footerText?.length || 0} / 80
    </span>
  </div>
  
  <textarea
    value={template.footerText}
    onChange={(e) => {
      if (e.target.value.length <= 80) {
        handleFooterChange(e.target.value);
      }
    }}
    maxLength={80}
    className={`w-full p-3 text-sm border rounded-md outline-none transition-all min-h-[80px] font-mono ${
      (template.footerText?.length || 0) >= 80
        ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500' 
        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
    }`}
    placeholder="e.g., Not valid without dry seal."
  />
  
  <div className="flex justify-between">
    
    {(template.footerText?.length || 0) >= 80 && (
      <p className="text-[9px] text-red-600 mt-1 flex items-center italic">
        <AlertCircle className="w-2.5 h-2.5 mr-1" />
        limit reached.
      </p>
    )}
  </div>
</div>

        <SignatoriesSection
          signatories={template.signatories}
          onChange={handleSignatoryChange}
          onAdd={handleAddSignatory}
          onRemove={handleRemoveSignatory}
        />

        {/* Settings */}
        <CertificateSettings
          settings={template.settings}
          onChange={handleSettingsChange}
          onBatchChange={handleSettingsBatchChange}
        />

        {/* Variables */}
        <VariablesDisplay variables={template.variables} />
      </div>
    </div>
  )
}
