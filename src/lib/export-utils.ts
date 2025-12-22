import * as Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string;
  key: string;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  const csvData = data.map((row) => {
    const csvRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      csvRow[col.header] = row[col.key];
    });
    return csvRow;
  });

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
  title: string
): void {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);

  const tableData = data.map((row) =>
    columns.map((col) => String(row[col.key] || ""))
  );

  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: tableData,
    startY: 30,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
  });

  doc.save(`${filename}.pdf`);
}
