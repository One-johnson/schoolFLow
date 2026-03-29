import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ClassQuizResultPdfRow = {
  q: number;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  result: string;
  pointsEarned: string;
};

export function buildClassQuizResultPdf(opts: {
  quizTitle: string;
  studentDisplayName: string;
  studentIdLabel: string;
  className: string;
  score: number;
  maxScore: number;
  percent: number;
  generatedAt: Date;
  rows: ClassQuizResultPdfRow[];
}): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 16;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Class quiz results", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Quiz: ${opts.quizTitle}`, margin, y);
  y += 5;
  doc.text(`Student: ${opts.studentDisplayName}`, margin, y);
  y += 5;
  doc.text(`ID: ${opts.studentIdLabel}`, margin, y);
  y += 5;
  doc.text(`Class: ${opts.className}`, margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(
    `Score: ${opts.score} / ${opts.maxScore} (${opts.percent}%)`,
    margin,
    y,
  );
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${opts.generatedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`,
    margin,
    y,
  );
  y += 10;

  const body = opts.rows.map((r) => [
    String(r.q),
    r.question,
    r.yourAnswer,
    r.correctAnswer,
    r.result,
    r.pointsEarned,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Question", "Your answer", "Correct", "Result", "Pts"]],
    body,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 55 },
    },
  });

  return doc;
}
