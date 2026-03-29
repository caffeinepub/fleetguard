export function exportCSV(
  filename: string,
  headers: string[],
  rows: string[][],
): void {
  const wrapCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(wrapCell).join(","),
    ...rows.map((r) => r.map(wrapCell).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
