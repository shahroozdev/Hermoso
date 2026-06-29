import { useMemo } from "react";

interface PaginationProps {
  page?: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems?: number;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

const Pagination = ({
  page = 1,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationProps) => {
  const pages = useMemo(() => {
    const items: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (page > 3) items.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (page < totalPages - 2) items.push("...");
      items.push(totalPages);
    }
    return items;
  }, [page, totalPages]);

  const from = totalItems ? (page - 1) * pageSize + 1 : 0;
  const to = totalItems ? Math.min(page * pageSize, totalItems) : 0;

  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div className="ha-pagination">
      <div className="ha-pagination-info">
        {totalItems ? `Showing ${from}-${to} of ${totalItems}` : ""}
      </div>

      <div className="ha-pagination-controls">
        <button
          type="button"
          className="ha-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹ Prev
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="ha-pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`ha-pagination-page ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="ha-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next ›
        </button>
      </div>

      <div className="ha-pagination-size">
        <label>
          Show{" "}
          <select
            className="ha-pagination-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default Pagination;
