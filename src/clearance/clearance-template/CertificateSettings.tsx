import React from 'react'
import { type CertificateSettings as SettingsType } from './template'

interface CertificateSettingsProps {
  settings: SettingsType
  onChange: (field: keyof SettingsType, value: any) => void
  onBatchChange?: (updates: Partial<SettingsType>) => void
}

export function CertificateSettings({
  settings,
  onChange,
  onBatchChange,
}: CertificateSettingsProps) {
  
  /**
   * BRUTAL TIP: Wag gumamit ng .toISOString() para sa local date min/max.
   * Gamitin ang locale 'en-CA' para makuha ang YYYY-MM-DD format base sa local time ng PC mo.
   * Sisiguraduhin nito na ang "kahapon" ay laging disabled.
   */
  const today = new Date().toLocaleDateString('en-CA'); 

  const handleHasFeeToggle = (checked: boolean) => {
    if (onBatchChange) {
      onBatchChange({
        hasFee: checked,
        fee: checked ? settings.fee : 0,
      })
    } else {
      onChange('hasFee', checked)
    }
  }

  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Certificate Settings
      </h4>

      {/* Payment Toggle */}
      <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50/50 shadow-sm">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.hasFee}
            onChange={(e) => handleHasFeeToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Paid Certificate (Has Payment)
          </span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Fee Input with 4-number limit */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase font-semibold">
            Fee (₱)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4} 
            value={settings.fee === 0 ? '' : settings.fee}
            disabled={!settings.hasFee}
            placeholder="0"
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || (/^\d*$/.test(val) && val.length <= 4)) {
                onChange('fee', val === '' ? 0 : parseInt(val));
              }
            }}
            className={`w-full p-2 text-sm font-mono border rounded outline-none transition-all ${
              !settings.hasFee 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-500'
            }`}
          />
          <p className="text-[9px] text-gray-400 mt-1 italic">
            Max fee: ₱9,999.
          </p>
        </div>

        {/* Specific Validity Date with Past Date Restriction */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase font-semibold">
            Specific Validity Date
          </label>
          <input
            type="date"
            value={settings.validityDate || ''} 
            min={today} // DITO NAKALAGAY ANG RESTRICTION
            onChange={(e) => onChange('validityDate', e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none hover:border-blue-300 transition-colors"
          />
          <p className="text-[9px] text-gray-400 mt-1 italic">
            *Past dates are disabled.
          </p>
        </div>
      </div>

      <div className="flex space-x-6">
        <label className="flex items-center space-x-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={settings.requiresPhoto}
            onChange={(e) => onChange('requiresPhoto', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Requires Photo</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={settings.requiresThumbmark}
            onChange={(e) => onChange('requiresThumbmark', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Requires Thumbmark</span>
        </label>
      </div>
    </div>
  )
}