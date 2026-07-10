interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  label: string;
  key: string;
  options: FilterOption[];
  value?: string;
}

interface DateRangeConfig {
  startLabel?: string;
  endLabel?: string;
  startValue?: string;
  endValue?: string;
  maxDate?: string;
  onStartChange?: (value: string) => void;
  onEndChange?: (value: string) => void;
}

interface TableFilterProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  onFilterChange?: (key: string, value: string) => void;
  onFilterClick?: () => void;
  onClearClick?: () => void;
  showSearch?: boolean;
  showFilterButton?: boolean;
  showClearButton?: boolean;
  filterButtonText?: string;
  clearButtonText?: string;
  dateRange?: DateRangeConfig;
  activeFilterCount?: number;
  disabled?: boolean;
}

export const TableFilter = ({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  onFilterChange,
  onFilterClick,
  onClearClick,
  showSearch = true,
  showFilterButton = true,
  showClearButton = true,
  filterButtonText = "Filter",
  clearButtonText = "Clear",
  dateRange,
  activeFilterCount,
  disabled = false,
}: TableFilterProps) => {
  const handleStartChange = (v: string) => {
    const clamped =
      dateRange?.maxDate && v && v > dateRange.maxDate ? dateRange.maxDate : v;
    dateRange?.onStartChange?.(clamped);
    // Auto-clamp: if new start > current end, clear end
    if (dateRange?.endValue && clamped > dateRange.endValue) {
      dateRange?.onEndChange?.("");
    }
  };

  const handleEndChange = (v: string) => {
    // Ignore if before start
    if (dateRange?.startValue && v && v < dateRange.startValue) return;
    if (dateRange?.maxDate && v && v > dateRange.maxDate) return;
    dateRange?.onEndChange?.(v);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onFilterClick?.();
      }}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4"
    >
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        {showSearch && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                maxLength={50}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^a-zA-Z0-9ñÑ\s.,\-']/g, "");
                  onSearchChange?.(sanitized);
                }}
                placeholder={searchPlaceholder}
                disabled={disabled}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Dropdown Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <select
              value={filter.value || ""}
              onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-600"
            >
              <option value="">All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Date Range — only rendered when dateRange prop is passed */}
        {dateRange && (
          <>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {dateRange.startLabel ?? "From"}
              </label>
              <input
                type="date"
                value={dateRange.startValue ?? ""}
                max={dateRange.maxDate || dateRange.endValue || undefined}
                onChange={(e) => handleStartChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
              />
            </div>

            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {dateRange.endLabel ?? "To"}
              </label>
              <input
                type="date"
                value={dateRange.endValue ?? ""}
                min={dateRange.startValue || undefined}
                max={dateRange.maxDate || undefined}
                onChange={(e) => handleEndChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
              />
            </div>
          </>
        )}

        {/* Apply Button */}
        {showFilterButton && (
          <button
            type="submit"
            disabled={disabled}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {filterButtonText}
            {/* Active filter count badge */}
            {activeFilterCount != null && activeFilterCount > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Clear Button */}
        {showClearButton && (
          <button
            type="button"
            onClick={onClearClick}
            disabled={disabled}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 border border-gray-300"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {clearButtonText}
          </button>
        )}
      </div>
    </form>
  );
};
