export const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportPageTables = (pageKey: string) => {
  const tables = Array.from(document.querySelectorAll(".ha-content table"));
  if (!tables.length) return false;

  const rows: string[][] = [];
  tables.forEach((table, index) => {
    if (index > 0) rows.push([]);
    rows.push(
      ...Array.from(table.querySelectorAll("tr")).map((row) =>
        Array.from(row.querySelectorAll("th, td")).map(
          (cell) => cell.textContent?.replace(/\s+/g, " ").trim() || "",
        ),
      ),
    );
  });

  if (!rows.length) return false;

  downloadCsv(
    `hermoso-${pageKey}-${new Date().toISOString().slice(0, 10)}.csv`,
    rows,
  );
  return true;
};