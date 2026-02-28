import React from 'react';
import { Pagination } from './Pagination';

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  minRows?: number; 
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onSelectionChange?: (keys: (string | number)[]) => void;
  // Pagination props
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
}

export const Table = <T,>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
  striped = false,
  hoverable = true,
  minRows,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  pagination
}: TableProps<T>) => {
  const allKeys = data.map((item, index) => keyExtractor(item, index));
  const isAllSelected = data.length > 0 && allKeys.every(key => selectedKeys.includes(key));
  const isSomeSelected = selectedKeys.some(key => allKeys.includes(key));

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all on current page
      onSelectionChange?.(selectedKeys.filter(key => !allKeys.includes(key)));
    } else {
      // Select all on current page
      const newKeys = [...new Set([...selectedKeys, ...allKeys])];
      onSelectionChange?.(newKeys);
    }
  };

  const handleSelectRow = (key: string | number) => {
    if (selectedKeys.includes(key)) {
      onSelectionChange?.(selectedKeys.filter(k => k !== key));
    } else {
      onSelectionChange?.([...selectedKeys, key]);
    }
  };
  const getAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getCellValue = (item: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(item, data.indexOf(item));
    }
    const value = item[column.key as keyof T];
    return value !== undefined && value !== null ? String(value) : '-';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-600"></div>
          <span className="ml-3 text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  // Calculate fixed height based on minRows (header ~41px + row ~49px each)
  const tableMinHeight = minRows ? `${41 + (minRows * 49)}px` : undefined;

  // Generate empty rows to fill minRows
  const emptyRowsCount = minRows && data.length < minRows ? minRows - data.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div 
        className="overflow-x-auto flex-1"
        style={{ minHeight: tableMinHeight }}
      >
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-[50px]">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-sm font-medium text-gray-700 ${getAlignment(column.align)}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={selectable ? columns.length + 1 : columns.length} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {data.map((item, index) => {
                  const rowKey = keyExtractor(item, index);
                  const isSelected = selectedKeys.includes(rowKey);
                  const isLastDataRow = index === data.length - 1;
                  // Only show border between data rows, not after the last data row
                  const showBorder = !isLastDataRow;
                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick?.(item)}
                      className={`
                        ${striped && index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                        ${hoverable ? 'hover:bg-slate-50 transition-colors' : ''}
                        ${onRowClick ? 'cursor-pointer' : ''}
                        ${isSelected ? 'bg-blue-50/50' : ''}
                        ${showBorder ? 'border-b border-gray-100' : ''}
                      `}
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(rowKey)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={`px-4 py-3 text-sm text-gray-700 ${getAlignment(column.align)}`}
                        >
                          {getCellValue(item, column)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {/* Empty rows to maintain fixed height */}
                {Array.from({ length: emptyRowsCount }).map((_, index) => (
                  <tr key={`empty-${index}`} className="bg-white">
                    {selectable && <td className="px-4 py-3">&nbsp;</td>}
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-4 py-3 text-sm">&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
};
