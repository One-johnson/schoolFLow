import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { convertTo12Hour } from "@/lib/timeUtils";

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

const DAYS: Day[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

type StudentTimetableAssignment = Doc<"timetableAssignments"> & {
  subjectCategory?: "core" | "elective" | "extracurricular";
  subjectColor?: string;
};

type CellPaint = {
  fillColor?: [number, number, number];
  textColor?: [number, number, number];
  fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
  halign?: "left" | "center" | "right";
};

function parseTimeKey(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function groupPeriodsByDay(periods: Doc<"periods">[]): Record<Day, Doc<"periods">[]> {
  const out: Record<Day, Doc<"periods">[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };
  for (const p of periods) {
    if (p.day in out) {
      out[p.day as Day].push(p);
    }
  }
  for (const d of DAYS) {
    out[d].sort((a, b) => parseTimeKey(a.startTime) - parseTimeKey(b.startTime));
  }
  return out;
}

function periodRowsTemplate(periods: Doc<"periods">[]): Doc<"periods">[] {
  for (const day of DAYS) {
    const row = periods
      .filter((p) => p.day === day)
      .sort((a, b) => parseTimeKey(a.startTime) - parseTimeKey(b.startTime));
    if (row.length > 0) return row;
  }
  return [];
}

type BreakKind = "assembly" | "lunch" | "closing" | "break";

function breakKindFromPeriodName(name: string): BreakKind {
  const n = name.toLowerCase();
  if (n.includes("assembly")) return "assembly";
  if (n.includes("lunch")) return "lunch";
  if (n.includes("closing")) return "closing";
  return "break";
}

function breakLabelAndRgb(kind: BreakKind): { label: string; rgb: [number, number, number] } {
  switch (kind) {
    case "assembly":
      return { label: "Assembly", rgb: [5, 150, 105] };
    case "lunch":
      return { label: "Lunch", rgb: [234, 88, 12] };
    case "closing":
      return { label: "Closing", rgb: [51, 65, 85] };
    case "break":
      return { label: "Break", rgb: [2, 132, 199] };
  }
}

function hexToRGB(hex: string | undefined): [number, number, number] {
  if (!hex) return [248, 250, 252];
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return [248, 250, 252];
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return [248, 250, 252];
  return [r, g, b];
}

function lightenRGB(rgb: [number, number, number], amount = 0.72): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ];
}

function categoryFill(
  category: StudentTimetableAssignment["subjectCategory"],
  subjectColor?: string,
): [number, number, number] {
  if (subjectColor) {
    return lightenRGB(hexToRGB(subjectColor));
  }
  switch (category) {
    case "core":
      return [219, 234, 254];
    case "elective":
      return [254, 243, 199];
    case "extracurricular":
      return [237, 233, 254];
    default:
      return [248, 250, 252];
  }
}

function safeFilenameBase(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 80) || "timetable";
}

/**
 * Build and download a landscape PDF of the student weekly timetable (no app chrome).
 */
export function downloadStudentTimetablePdf(args: {
  className: string;
  periods: Doc<"periods">[];
  assignments: StudentTimetableAssignment[];
  academicYearLabel?: string | null;
  termLabel?: string | null;
  updatedAt?: string | null;
}): void {
  const { periods, assignments, className } = args;
  const rowTemplate = periodRowsTemplate(periods);
  if (rowTemplate.length === 0) return;

  const periodsByDay = groupPeriodsByDay(periods);
  const assignmentByPeriodId = new Map<Id<"periods">, StudentTimetableAssignment>();
  for (const a of assignments) {
    assignmentByPeriodId.set(a.periodId, a);
  }

  const getPeriodForDayAndName = (day: Day, periodName: string): Doc<"periods"> | undefined =>
    periodsByDay[day].find((p) => p.periodName === periodName);

  const body: string[][] = [];
  const paints: CellPaint[][] = [];

  for (const templatePeriod of rowTemplate) {
    const isBreak = templatePeriod.periodType === "break";
    const templateBreakKind = breakKindFromPeriodName(templatePeriod.periodName);
    const breakPaint = isBreak ? breakLabelAndRgb(templateBreakKind) : null;
    const timeRange = `${convertTo12Hour(templatePeriod.startTime)} – ${convertTo12Hour(templatePeriod.endTime)}`;

    const row: string[] = [];
    const paintRow: CellPaint[] = [];

    if (isBreak && breakPaint) {
      row.push(`${breakPaint.label}\n${timeRange}`);
      paintRow.push({
        fillColor: breakPaint.rgb,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      });
    } else {
      row.push(`${templatePeriod.periodName}\n${timeRange}`);
      paintRow.push({ halign: "left", fontStyle: "bold" });
    }

    for (const day of DAYS) {
      const period = getPeriodForDayAndName(day, templatePeriod.periodName);
      if (!period) {
        if (isBreak && breakPaint) {
          row.push(breakPaint.label);
          paintRow.push({
            fillColor: breakPaint.rgb,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          });
        } else {
          row.push("—");
          paintRow.push({ halign: "center" });
        }
        continue;
      }

      if (period.periodType === "break") {
        const bk =
          isBreak && breakPaint
            ? breakPaint
            : breakLabelAndRgb(breakKindFromPeriodName(period.periodName));
        row.push(bk.label);
        paintRow.push({
          fillColor: bk.rgb,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        });
        continue;
      }

      const assign = assignmentByPeriodId.get(period._id);
      if (assign) {
        const lines = [assign.subjectName, assign.teacherName].filter(Boolean);
        row.push(lines.join("\n"));
        paintRow.push({
          fillColor: categoryFill(assign.subjectCategory, assign.subjectColor),
          halign: "center",
        });
      } else {
        row.push("Free");
        paintRow.push({
          fillColor: [241, 245, 249],
          textColor: [100, 116, 139],
          halign: "center",
        });
      }
    }

    body.push(row);
    paints.push(paintRow);
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Weekly timetable", 14, 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let metaY = 20;
  doc.text(className, 14, metaY);
  metaY += 5;

  const metaBits: string[] = [];
  if (args.academicYearLabel) metaBits.push(`Year: ${args.academicYearLabel}`);
  if (args.termLabel) metaBits.push(`Term: ${args.termLabel}`);
  if (metaBits.length) {
    doc.text(metaBits.join(" · "), 14, metaY);
    metaY += 5;
  }
  if (args.updatedAt) {
    const d = new Date(args.updatedAt);
    const label = Number.isNaN(d.getTime())
      ? args.updatedAt
      : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Last updated ${label}`, 14, metaY);
    doc.setTextColor(0, 0, 0);
    metaY += 4;
  }

  const startY = Math.max(metaY + 3, 30);

  const headers = [
    "Period / time",
    ...DAYS.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)),
  ];

  autoTable(doc, {
    head: [headers],
    body,
    startY,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      valign: "middle",
      halign: "center",
      lineColor: [200, 200, 210],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 38, halign: "left" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const p = paints[data.row.index]?.[data.column.index];
      if (!p) return;
      if (p.fillColor) data.cell.styles.fillColor = p.fillColor;
      if (p.textColor) data.cell.styles.textColor = p.textColor;
      if (p.fontStyle) data.cell.styles.fontStyle = p.fontStyle;
      if (p.halign) data.cell.styles.halign = p.halign;
    },
  });

  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text("SchoolFlow — student timetable", 14, pageH - 8);
  doc.setTextColor(0, 0, 0);

  doc.save(`${safeFilenameBase(className)}-timetable.pdf`);
}
