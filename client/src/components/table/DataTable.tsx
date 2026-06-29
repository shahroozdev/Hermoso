
export interface ColumnDef {
  title: string;
  size?: string | number;
  align?: "left" | "center" | "right";
  lines?: number;
}

export interface DataTableProps {
  columns: ColumnDef[];
  rows: (string | number | React.ReactNode)[][];
  loading?: boolean;
  loadingRows?: number;
}

const DataTable = ({
  columns,
  rows,
  loading,
  loadingRows = 5,
}: DataTableProps) => (
  <div className="ha-table-scroll">
    <table className="ha-salon-table min-w-full text-left text-sm">
      <thead className="bg-[var(--surface-soft)] text-muted">
        <tr>
          {columns.map((col) => (
            <th
              key={col.title}
              className="px-4 py-3 text-xs font-semibold uppercase whitespace-nowrap min-w-max tracking-[0.12em]"
              style={{
                width: col.size,
                minWidth: col.size,
                textAlign: col.align || "left",
              }}
            >
              {col.title}
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
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-[var(--text)]"
                    style={{
                      textAlign: columns[cellIdx]?.align || "left",
                    }}
                  >
                    <span
                      className="ha-cell-inner"
                      style={
                        columns[cellIdx]?.lines
                          ? {
                              display: "-webkit-box",
                              WebkitLineClamp: columns[cellIdx].lines,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }
                          : undefined
                      }
                    >
                      {cell}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
      </tbody>
    </table>
  </div>
);

export default DataTable;
