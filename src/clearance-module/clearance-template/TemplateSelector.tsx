import React from "react";
import { type TemplateOption } from "./template";
import { Check, FileText } from "lucide-react";
interface TemplateSelectorProps {
  options: TemplateOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}
export function TemplateSelector({
  options,
  selectedId,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Select Certificate Template to Edit:
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(String(option.id))}
              className={`
                relative flex items-center p-3 text-left text-sm rounded-md border transition-all
                ${isSelected ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700"}
              `}
            >
              <FileText
                className={`w-4 h-4 mr-2 ${isSelected ? "text-blue-500" : "text-gray-400"}`}
              />
              <span className="truncate flex-1">{option.name}</span>
              {option.isFree && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 rounded">
                  Free
                </span>
              )}
              {isSelected && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
