import React from "react";
import { ArrowRight, Inbox } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  onViewAll?: () => void;
  onRowClick?: (item: T) => void;
}

export const ResponsiveTable = <T extends Record<string, any>>({
  title,
  data,
  columns,
  onViewAll,
  onRowClick,
}: ResponsiveTableProps<T>) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6 overflow-hidden">
      {/* Table Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
          {title}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1.5 transition-all group"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {data.slice(0, 3).map((item, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick && onRowClick(item)}
            className={`border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm bg-white transition-all
              ${onRowClick ? "cursor-pointer hover:border-blue-300 hover:shadow-md active:scale-[0.98]" : ""}`}
          >
            {columns.map((col, colIndex) => (
              <div
                key={colIndex}
                className={`flex justify-between items-center ${
                  colIndex !== columns.length - 1
                    ? "border-b border-gray-50 pb-3 mb-3"
                    : ""
                }`}
              >
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest w-1/3">
                  {col.header}
                </span>
                <div className="text-sm font-medium text-gray-900 flex-1 flex justify-end text-right break-words">
                  {col.render
                    ? col.render(item)
                    : (item[col.accessorKey as keyof T] as React.ReactNode)}
                </div>
              </div>
            ))}
          </div>
        ))}

        {data.length === 0 && (
          <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Inbox className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              No records found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check back later for new updates.
            </p>
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col, index) => {
                const isCenter = ["status", "actions"].includes(
                  col.header.trim().toLowerCase(),
                );
                const widthClass =
                  col.header.trim().toLowerCase() === "status"
                    ? "w-40"
                    : col.header.trim().toLowerCase() === "actions"
                      ? "w-24"
                      : "";
                return (
                  <th
                    key={index}
                    className={`py-3.5 px-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider
                      ${index === 0 ? "rounded-tl-lg" : ""} 
                      ${index === columns.length - 1 ? "rounded-tr-lg" : ""}
                      ${isCenter ? "text-center" : "text-left"} ${widthClass}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors group
                  ${onRowClick ? "cursor-pointer hover:bg-blue-50/40" : "hover:bg-gray-50/40"}`}
              >
                {columns.map((col, colIndex) => {
                  const isCenter = ["status", "actions"].includes(
                    col.header.trim().toLowerCase(),
                  );
                  return (
                    <td
                      key={colIndex}
                      className={`py-4 px-5 text-sm text-gray-700 align-middle
                      ${isCenter ? "text-center" : "text-left"}`}
                    >
                      {col.render
                        ? col.render(item)
                        : (item[col.accessorKey as keyof T] as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Inbox className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-600">
                      No records found
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Check back later for new updates.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
