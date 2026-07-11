interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showItemCount?: boolean;
  /** Actual number of items on the current page (for accurate "Showing X–Y" display) */
  currentPageItemCount?: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  showItemCount = true,
  currentPageItemCount,
}: PaginationProps) => {
  const safeTotalPages = Math.max(1, totalPages || 0);
  const safeCurrentPage = Math.min(
    Math.max(1, currentPage || 1),
    safeTotalPages,
  );

  const startItem =
    totalItems && totalItems > 0
      ? (safeCurrentPage - 1) * itemsPerPage + 1
      : 0;
  const endItem =
    totalItems && totalItems > 0
      ? currentPageItemCount !== undefined
        ? startItem + currentPageItemCount - 1
        : Math.min(safeCurrentPage * itemsPerPage, totalItems)
      : 0;

  const canGoPrev = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < safeTotalPages;

  const getVisiblePages = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", safeTotalPages] as const;
    }

    if (safeCurrentPage >= safeTotalPages - 3) {
      return [
        1,
        "...",
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ] as const;
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      safeTotalPages,
    ] as const;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-t border-gray-200 ${
        showItemCount && totalItems !== undefined
          ? "sm:justify-between"
          : "sm:justify-end"
      }`}
    >
      {showItemCount && totalItems !== undefined && (
        <p className="text-sm text-gray-500">
          Showing {totalItems === 0 ? 0 : startItem} to {endItem} of{" "}
          {totalItems} results
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => canGoPrev && onPageChange(safeCurrentPage - 1)}
          disabled={!canGoPrev}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-sm text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`min-w-9 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  safeCurrentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => canGoNext && onPageChange(safeCurrentPage + 1)}
          disabled={!canGoNext}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
