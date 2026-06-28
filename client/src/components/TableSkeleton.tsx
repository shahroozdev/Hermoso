interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  title?: string;
}

const TableSkeleton = ({
  columns = 6,
  rows = 6,
  title,
}: TableSkeletonProps) => {
  return (
    <div className="shell-panel rounded-2xl p-4">
      {title ? <div className="mb-4 h-6 w-48 ha-skeleton" /> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface-soft)]">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <div className="h-3 w-20 ha-skeleton" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-[var(--border)]">
                {Array.from({ length: columns }).map((__, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 w-full ha-skeleton" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
