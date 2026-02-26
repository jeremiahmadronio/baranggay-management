import React, { useState } from 'react'
import { Lock, ChevronDown, ChevronUp } from 'lucide-react'
export function PaymentInfo() {
  const [isExpanded, setIsExpanded] = useState(true)
  return (
    <div className="border border-gray-200 rounded-md mb-4 overflow-hidden">
      <div
        className="bg-gray-50 px-4 py-2 flex items-center justify-between cursor-pointer border-b border-gray-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Payment Info
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-xs text-gray-500 font-medium">
            <Lock className="w-3 h-3 mr-1" />
            Fixed
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-white space-y-3">
          {/* O.R. NUMBER */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-xs font-medium text-gray-500 uppercase">
              Paid Under O.R. No
            </label>
            <div className="col-span-1 text-center text-gray-400">:</div>
            <div className="col-span-7">
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-sm font-mono border border-blue-100 inline-block">
                {'{{OR_NUMBER}}'}
              </div>
            </div>
          </div>

          {/* O.R. DATE */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-xs font-medium text-gray-500 uppercase">
              O.R. Date
            </label>
            <div className="col-span-1 text-center text-gray-400">:</div>
            <div className="col-span-7">
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-sm font-mono border border-blue-100 inline-block">
                {'{{OR_DATE}}'}
              </div>
            </div>
          </div>

          {/* ISSUED ON */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-xs font-medium text-gray-500 uppercase">
              Issued On
            </label>
            <div className="col-span-1 text-center text-gray-400">:</div>
            <div className="col-span-7">
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-sm font-mono border border-blue-100 inline-block">
                {'{{DATE_ISSUED}}'}
              </div>
            </div>
          </div>

          {/* AMOUNT */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-xs font-medium text-gray-500 uppercase">
              Amount
            </label>
            <div className="col-span-1 text-center text-gray-400">:</div>
            <div className="col-span-7">
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-sm font-mono border border-blue-100 inline-block">
                {'{{AMOUNT_PAID}}'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
