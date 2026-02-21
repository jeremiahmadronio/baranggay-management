import React from 'react';

export const ModuleBadge = ({ label, type }: { label: string, type: 'VAWC' | 'BCPC' | 'Clearance' | 'Blotter' | 'FTJS' }) => {
  const colors = {
    VAWC: 'bg-purple-100 text-purple-600',
    BCPC: 'bg-blue-100 text-blue-600',
    Clearance: 'bg-indigo-100 text-indigo-600',
    Blotter: 'bg-orange-100 text-orange-600',
    FTJS: 'bg-teal-100 text-teal-600',
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${colors[type]}`}>{label}</span>;
};


export const InputField = ({ label, placeholder, type = "text", required = false }: { label: string, placeholder?: string, type?: string, required?: boolean }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type={type}
      placeholder={placeholder}
      className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50/30"
    />
  </div>
);