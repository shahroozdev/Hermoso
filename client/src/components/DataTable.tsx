import NoDataFound from "./NoDataFound";

interface DataTableProps {
  columns: string[];
  rows: (string | number | React.ReactNode)[][];
  loading?: boolean;
  loadingRows?: number;
}

const DataTable = ({ columns, rows, loading, loadingRows = 5 }: DataTableProps) => (
  <div className="shell-panel overflow-x-auto rounded-2xl">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-[var(--surface-soft)] text-muted">
        <tr>
          {columns.map((col) => (
            <th
              key={col}
              className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading
          ? Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-[var(--border)]">
                {Array.from({ length: columns.length }).map((__, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse bg-[var(--surface-soft)]" />
                  </td>
                ))}
              </tr>
            ))
          : rows.map((row, idx) => (
              <tr key={idx} className="border-t border-[var(--border)]">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-[var(--text)] ">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
      </tbody>
    </table>
    {rows.length === 0 && !loading && <NoDataFound />}
  </div>
);

export default DataTable;
