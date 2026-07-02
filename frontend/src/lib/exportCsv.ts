export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

function toCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  // Quote any cell containing a comma, quote, or newline, escaping embedded quotes.
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * Generic, dependency-free CSV export — used across list/table pages
 * (Personnel, Assets, Weapons & Ammunition, Training, Intelligence) so every
 * module can export its current (filtered) view to a file that opens
 * directly in Excel/Sheets, satisfying the "exporting" requirement without
 * pulling in a heavyweight spreadsheet library just for a flat export.
 */
export function exportToCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((c) => toCsvCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => toCsvCell(c.accessor(row))).join(","));
  const csv = [header, ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
