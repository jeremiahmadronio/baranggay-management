import React from "react";
interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}
export function SectionCard({
  title,
  icon,
  children,
  action,
}: SectionCardProps) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
