import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type StudentResultPdfRow = {
  examName: string;
  subjectName: string;
  classScore: number;
  examScore: number;
  totalScore: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  remarks: string;
  isAbsent: boolean;
  academicYearName: string | null;
  termName: string | null;
};

export function buildStudentResultsPdf(opts: {
  studentDisplayName: string;
  studentIdLabel: string;
  className: string;
  periodLabel: string;
  generatedAt: Date;
  rows: StudentResultPdfRow[];
}): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 16;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Published results", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Student: ${opts.studentDisplayName}`, margin, y);
  y += 5;
  doc.text(`ID: ${opts.studentIdLabel}`, margin, y);
  y += 5;
  doc.text(`Class: ${opts.className}`, margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Scope: ${opts.periodLabel}`, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${opts.generatedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`,
    margin,
    y,
  );
  y += 10;

  const body = opts.rows.map((m) => [
    m.examName,
    m.subjectName,
    m.academicYearName ?? "—",
    m.termName ?? "—",
    m.isAbsent ? "—" : String(m.classScore),
    m.isAbsent ? "—" : String(m.examScore),
    m.isAbsent ? "—" : String(m.totalScore),
    String(m.maxMarks),
    m.isAbsent ? "—" : `${Math.round(m.percentage)}%`,
    m.isAbsent ? "Absent" : m.grade,
    m.isAbsent ? "—" : m.remarks,
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Exam",
        "Subject",
        "Year",
        "Term",
        "Class",
        "Exam sc.",
        "Total",
        "Max",
        "%",
        "Grade",
        "Remark",
      ],
    ],
    body,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: {
      fillColor: [245, 240, 255],
      textColor: [40, 20, 80],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 24 },
      2: { cellWidth: 18 },
      3: { cellWidth: 16 },
    },
    margin: { left: margin, right: margin },
  });

  return doc;
}

export function downloadStudentResultsPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function buildResultsShareText(opts: {
  studentDisplayName: string;
  studentIdLabel: string;
  className: string;
  periodLabel: string;
  rows: StudentResultPdfRow[];
}): string {
  const lines: string[] = [
    `Results — ${opts.periodLabel}`,
    `${opts.studentDisplayName} (${opts.studentIdLabel}) · ${opts.className}`,
    "",
  ];
  for (const m of opts.rows) {
    const score = m.isAbsent
      ? "Absent"
      : `${Math.round(m.percentage)}% · Grade ${m.grade}`;
    lines.push(`• ${m.subjectName} — ${m.examName}: ${score}`);
  }
  lines.push("", "Shared from SchoolFlow");
  return lines.join("\n");
}

export function openWhatsAppWithText(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openEmailWithBody(subject: string, body: string): void {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

export async function sharePdfWithSystemSheet(opts: {
  pdfBlob: Blob;
  filename: string;
  title: string;
  text: string;
}): Promise<boolean> {
  const file = new File([opts.pdfBlob], opts.filename, { type: "application/pdf" });
  const payload: ShareData = { title: opts.title, text: opts.text, files: [file] };
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
    return false;
  }
  try {
    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}
