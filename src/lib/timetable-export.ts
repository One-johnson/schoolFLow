import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { convertTo12Hour } from './timeUtils';

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface Period {
  periodName: string;
  startTime: string;
  endTime: string;
  periodType: 'class' | 'break';
  day: Day;
}

interface Assignment {
  periodId: string;
  subjectName: string;
  teacherName: string;
  subjectColor?: string;
  day: Day;
}

interface TimetableData {
  className: string;
  schoolName?: string;
  periods: Period[];
  assignments: Assignment[];
}

interface TeacherScheduleData {
  teacherName: string;
  schoolName?: string;
  assignments: (Assignment & { className: string; startTime: string; endTime: string })[];
}

// Helper function to get color for PDF
function hexToRGB(hex: string | undefined): [number, number, number] {
  if (!hex) return [255, 255, 255];
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

// Helper function to lighten RGB color
function lightenRGB(rgb: [number, number, number], amount: number = 0.6): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ];
}

// Export individual class timetable as PDF
export function exportClassTimetablePDF(data: TimetableData): void {
  const doc = new jsPDF('landscape');
  
  // Add header
  doc.setFontSize(18);
  doc.text(`${data.className} - Weekly Timetable`, 14, 15);
  
  if (data.schoolName) {
    doc.setFontSize(10);
    doc.text(String(data.schoolName), 14, 22);
  }
  
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Group periods by period name and get unique periods
  const periodsByName: Record<string, Period[]> = {};
  data.periods.forEach(period => {
    if (!periodsByName[period.periodName]) {
      periodsByName[period.periodName] = [];
    }
    periodsByName[period.periodName].push(period);
  });

  // Get period order (sorted by start time from Monday)
  const mondayPeriods = data.periods
    .filter(p => p.day === 'monday')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Prepare table data
  const days: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const headers = ['Period / Time', ...days.map(d => d.charAt(0).toUpperCase() + d.slice(1))];
  
  const rows = mondayPeriods.map(mondayPeriod => {
    const row: string[] = [
      `${mondayPeriod.periodName}\n${convertTo12Hour(mondayPeriod.startTime)} - ${convertTo12Hour(mondayPeriod.endTime)}`
    ];

    days.forEach(day => {
      const period = periodsByName[mondayPeriod.periodName]?.find(p => p.day === day);
      if (!period) {
        row.push('-');
        return;
      }

      if (mondayPeriod.periodType === 'break') {
        row.push('BREAK');
        return;
      }

      const assignment = data.assignments.find(
        a => a.periodId === period.periodName + '_' + day
      );
      
      if (assignment) {
        row.push(`${assignment.subjectName}\n${assignment.teacherName}`);
      } else {
        row.push('');
      }
    });

    return row;
  });

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'left', fontStyle: 'bold' },
    },
    didParseCell: (cellData) => {
      // Color code subject cells based on assignments
      if (cellData.section === 'body' && cellData.column.index > 0) {
        const rowIndex = cellData.row.index;
        const dayIndex = cellData.column.index - 1;
        
        const period = mondayPeriods[rowIndex];
        const day = days[dayIndex];
        const assignment = data.assignments.find(
          a => a.periodId === period.periodName + '_' + day
        );

        if (assignment?.subjectColor) {
          const rgb = hexToRGB(assignment.subjectColor);
          const lightRgb = lightenRGB(rgb);
          cellData.cell.styles.fillColor = lightRgb as [number, number, number];
        }
      }
    },
  });

  doc.save(`${data.className}_Timetable_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export teacher schedule as PDF
export function exportTeacherSchedulePDF(data: TeacherScheduleData): void {
  const doc = new jsPDF('landscape');
  
  // Add header
  doc.setFontSize(18);
  doc.text(`${data.teacherName} - Teaching Schedule`, 14, 15);
  
  if (data.schoolName) {
    doc.setFontSize(10);
    doc.text(String(data.schoolName), 14, 22);
  }
  
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Group assignments by day
  const days: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const headers = ['Time', ...days.map(d => d.charAt(0).toUpperCase() + d.slice(1))];
  
  // Get all unique time slots
  const uniqueSlots = Array.from(
    new Set(data.assignments.map(a => `${a.startTime}-${a.endTime}`))
  ).sort((a, b) => a.split('-')[0].localeCompare(b.split('-')[0]));

  const rows = uniqueSlots.map(slot => {
    const [startTime, endTime] = slot.split('-');
    const row: string[] = [
      `${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}`
    ];

    days.forEach(day => {
      const assignment = data.assignments.find(
        a => a.day === day && a.startTime === startTime && a.endTime === endTime
      );
      
      if (assignment) {
        row.push(`${assignment.subjectName}\n${assignment.className}`);
      } else {
        row.push('Free');
      }
    });

    return row;
  });

  // Calculate summary
  const totalPeriods = data.assignments.length;
  const classesCount = new Set(data.assignments.map(a => a.className)).size;

  // Add summary
  doc.setFontSize(10);
  doc.text(`Total Teaching Periods: ${totalPeriods}/week`, 14, doc.internal.pageSize.height - 10);
  doc.text(`Classes Taught: ${classesCount}`, 100, doc.internal.pageSize.height - 10);

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
    },
  });

  doc.save(`${data.teacherName}_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export master timetable (all classes) as PDF - One page per class
export function exportMasterTimetablePDF(
  timetablesData: TimetableData[],
  schoolName?: string
): void {
  const doc = new jsPDF('landscape');
  
  timetablesData.forEach((data, index) => {
    // Add new page for each class (except the first one)
    if (index > 0) {
      doc.addPage();
    }

    // Add header
    doc.setFontSize(18);
    doc.text('Master Timetable - All Classes', 14, 15);
    
    doc.setFontSize(14);
    doc.text(`Class: ${data.className}`, 14, 22);
    
    if (schoolName) {
      doc.setFontSize(10);
      doc.text(String(schoolName), 14, 28);
    }
    
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, schoolName ? 33 : 28);

    // Group periods by period name and get unique periods
    const periodsByName: Record<string, Period[]> = {};
    data.periods.forEach(period => {
      if (!periodsByName[period.periodName]) {
        periodsByName[period.periodName] = [];
      }
      periodsByName[period.periodName].push(period);
    });

    // Get period order (sorted by start time from Monday)
    const mondayPeriods = data.periods
      .filter(p => p.day === 'monday')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Prepare table data
    const days: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const headers = ['Period / Time', ...days.map(d => d.charAt(0).toUpperCase() + d.slice(1))];
    
    const rows = mondayPeriods.map(mondayPeriod => {
      const row: string[] = [
        `${mondayPeriod.periodName}\n${convertTo12Hour(mondayPeriod.startTime)} - ${convertTo12Hour(mondayPeriod.endTime)}`
      ];

      days.forEach(day => {
        const period = periodsByName[mondayPeriod.periodName]?.find(p => p.day === day);
        if (!period) {
          row.push('-');
          return;
        }

        if (mondayPeriod.periodType === 'break') {
          row.push('BREAK');
          return;
        }

        const assignment = data.assignments.find(
          a => a.periodId === period.periodName + '_' + day
        );
        
        if (assignment) {
          row.push(`${assignment.subjectName}\n${assignment.teacherName}`);
        } else {
          row.push('');
        }
      });

      return row;
    });

    // Generate table for this class
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: schoolName ? 38 : 33,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold' },
      },
      didParseCell: (cellData) => {
        // Color code subject cells based on assignments
        if (cellData.section === 'body' && cellData.column.index > 0) {
          const rowIndex = cellData.row.index;
          const dayIndex = cellData.column.index - 1;
          
          const period = mondayPeriods[rowIndex];
          const day = days[dayIndex];
          const assignment = data.assignments.find(
            a => a.periodId === period.periodName + '_' + day
          );

          if (assignment?.subjectColor) {
            const rgb = hexToRGB(assignment.subjectColor);
            const lightRgb = lightenRGB(rgb);
            cellData.cell.styles.fillColor = lightRgb as [number, number, number];
          }
        }
      },
    });
  });

  doc.save(`Master_Timetable_${new Date().toISOString().split('T')[0]}.pdf`);
}
