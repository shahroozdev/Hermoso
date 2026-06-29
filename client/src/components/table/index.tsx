import { useApi } from "@/hooks/useApi";
import NoDataFound from "../NoDataFound";
import DataTable, { type ColumnDef } from "./DataTable";
import Pagination from "./Pagination";
import { useState } from "react";

interface TableProps<T> {
  title?: string;
  queryKey?: string[];
  showPagination?: boolean;
  service?: (
    params: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  serviceParams?: Record<string, unknown>;
  columns: ColumnDef[];
  noBorder?: boolean;
  rows: (data: T[]) => (string | number | React.ReactNode)[][];
}

const TABLE = <T,>({
  title,
  queryKey=[],
  showPagination,
  service,
  serviceParams,
  columns,
  noBorder,
  rows,
}: TableProps<T>) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isDynamic = !!service;

  const { data, loading, error } = useApi(
    () => service({ page, limit: pageSize, ...serviceParams }),
    [...queryKey, pageSize, page, serviceParams],
  );
  const handlePageChange = (p: number) => setPage(p);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };
  console.log("data", data, page, pageSize, serviceParams);
  const meta = data?.meta as Record<string, unknown> | undefined;
  const items = (data?.data ?? []) as T[];
  const total = (meta?.total as number) ?? items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const tableRows = typeof rows === "function" ? rows(items) : (rows ?? []);

  return (
    <div className={noBorder?"":"ha-card"}>
      {title ? <div className="ha-card-title">{title}</div> : null}
      {error ? <div className="ha-error-banner">{error}</div> : null}
      <DataTable columns={columns} rows={tableRows} loading={loading} />
      {tableRows.length === 0 && !loading && !error && <NoDataFound />}
      {showPagination && isDynamic && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          totalItems={total}
        />
      )}
    </div>
  );
};

export { type ColumnDef };
export default TABLE;
