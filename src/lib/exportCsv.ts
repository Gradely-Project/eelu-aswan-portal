/**
 * Utility to export tabular data directly to CSV with UTF-8 BOM encoding.
 * Ensures clean Arabic and English character rendering in Microsoft Excel.
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  // UTF-8 Byte Order Mark (BOM) prevents Excel from corrupting Arabic text
  const BOM = "\uFEFF";

  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCell).join(","));

  const csvContent = BOM + [headerRow, ...dataRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const timestamp = new Date().toISOString().split("T")[0];
  const safeFilename = filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_");

  link.setAttribute("href", url);
  link.setAttribute("download", `${safeFilename}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
