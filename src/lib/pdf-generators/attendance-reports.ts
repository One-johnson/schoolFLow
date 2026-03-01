import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface AttendanceRecord {
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  arrivalTime?: string;
  remarks?: string;
}

interface StudentAttendanceData {
  studentName: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

interface ClassAttendanceData {
  className: string;
  totalDays: number;
  attendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
}

/**
 * Generate Daily Attendance Register PDF
 */
export function generateDailyRegisterPDF(data: {
  schoolName: string;
  className: string;
  date: string;
  session: string;
  records: AttendanceRecord[];
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  totalStudents: number;
}): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text(data.schoolName, 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Daily Attendance Register', 105, 30, { align: 'center' });
  
  // Details
  doc.setFontSize(10);
  doc.text(`Class: ${data.className}`, 20, 45);
  doc.text(`Date: ${data.date}`, 20, 52);
  doc.text(`Session: ${data.session}`, 20, 59);
  
  // Attendance Table
  const tableData = data.records.map((record, index) => [
    (index + 1).toString(),
    record.studentName,
    getStatusSymbol(record.status),
    record.arrivalTime || '-',
    record.remarks || '-'
  ]);
  
  autoTable(doc, {
    startY: 70,
    head: [['#', 'Student Name', 'Status', 'Arrival Time', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30 },
      4: { cellWidth: 50 }
    }
  });
  
  // Summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary:', 20, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Students: ${data.totalStudents}`, 20, finalY + 7);
  doc.text(`Present: ${data.presentCount}`, 20, finalY + 14);
  doc.text(`Absent: ${data.absentCount}`, 70, finalY + 14);
  doc.text(`Late: ${data.lateCount}`, 120, finalY + 14);
  doc.text(`Excused: ${data.excusedCount}`, 160, finalY + 14);
  
  const attendanceRate = data.totalStudents > 0 
    ? Math.round((data.presentCount / data.totalStudents) * 100)
    : 0;
  doc.text(`Attendance Rate: ${attendanceRate}%`, 20, finalY + 21);
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
  
  // Save
  const filename = `attendance_${data.className.replace(/\s+/g, '_')}_${data.date}.pdf`;
  doc.save(filename);
}

/**
 * Generate Weekly/Monthly Attendance Summary PDF
 */
export function generateAttendanceSummaryPDF(data: {
  schoolName: string;
  className: string;
  startDate: string;
  endDate: string;
  students: StudentAttendanceData[];
}): void {
  const doc = new jsPDF('landscape');
  
  // Header
  doc.setFontSize(18);
  doc.text(data.schoolName, 148, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Attendance Summary Report', 148, 30, { align: 'center' });
  
  // Details
  doc.setFontSize(10);
  doc.text(`Class: ${data.className}`, 20, 45);
  doc.text(`Period: ${data.startDate} to ${data.endDate}`, 20, 52);
  
  // Table
  const tableData = data.students.map((student, index) => [
    (index + 1).toString(),
    student.studentName,
    student.totalDays.toString(),
    student.present.toString(),
    student.absent.toString(),
    student.late.toString(),
    student.excused.toString(),
    `${student.percentage.toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    startY: 65,
    head: [['#', 'Student Name', 'Total Days', 'Present', 'Absent', 'Late', 'Excused', 'Attendance %']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 30, halign: 'center' }
    }
  });
  
  // Summary Statistics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const avgAttendance = data.students.length > 0
    ? data.students.reduce((sum, s) => sum + s.percentage, 0) / data.students.length
    : 0;
  
  doc.setFontSize(11);
  doc.setFont( 'bold');
  doc.text('Class Statistics:', 20, finalY);
  
  doc.setFont('normal');
  doc.setFontSize(10);
  doc.text(`Average Attendance: ${avgAttendance.toFixed(1)}%`, 20, finalY + 7);
  doc.text(`Total Students: ${data.students.length}`, 20, finalY + 14);
  
  const belowThreshold = data.students.filter(s => s.percentage < 75).length;
  if (belowThreshold > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`⚠ ${belowThreshold} student(s) below 75% attendance`, 20, finalY + 21);
    doc.setTextColor(0, 0, 0);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 148, 200, { align: 'center' });
  
  // Save
  const filename = `attendance_summary_${data.className.replace(/\s+/g, '_')}_${data.startDate}_to_${data.endDate}.pdf`;
  doc.save(filename);
}

/**
 * Generate Student Attendance Certificate PDF
 */
export function generateStudentCertificatePDF(data: {
  schoolName: string;
  studentName: string;
  className: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}): void {
  const doc = new jsPDF();
  
  // Border
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277);
  
  // Header
  doc.setFontSize(22);
  doc.setFont('bold');
  doc.text(data.schoolName, 105, 40, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('ATTENDANCE CERTIFICATE', 105, 55, { align: 'center' });
  
  // Decorative line
  doc.setLineWidth(0.3);
  doc.line(40, 65, 170, 65);
  
  // Certificate body
  doc.setFontSize(12);
  doc.setFont('normal');
  doc.text('This is to certify that', 105, 85, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont( 'bold');
  doc.text(data.studentName, 105, 100, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont( 'normal');
  doc.text(`of ${data.className}`, 105, 112, { align: 'center' });
  
  doc.text('has maintained the following attendance record:', 105, 127, { align: 'center' });
  
  // Attendance details box
  doc.setFillColor(248, 250, 252);
  doc.rect(40, 140, 130, 70, 'F');
  doc.setLineWidth(0.2);
  doc.rect(40, 140, 130, 70);
  
  doc.setFontSize(10);
  const leftX = 55;
  const rightX = 130;
  let currentY = 155;
  
  doc.text('Period:', leftX, currentY);
  doc.text(`${data.startDate} to ${data.endDate}`, rightX, currentY);
  
  currentY += 10;
  doc.text('Total Days:', leftX, currentY);
  doc.text(data.totalDays.toString(), rightX, currentY);
  
  currentY += 10;
  doc.text('Days Present:', leftX, currentY);
  doc.text(data.present.toString(), rightX, currentY);
  
  currentY += 10;
  doc.text('Days Absent:', leftX, currentY);
  doc.text(data.absent.toString(), rightX, currentY);
  
  currentY += 10;
  doc.text('Days Late:', leftX, currentY);
  doc.text(data.late.toString(), rightX, currentY);
  
  currentY += 10;
  doc.text('Days Excused:', leftX, currentY);
  doc.text(data.excused.toString(), rightX, currentY);
  
  // Attendance percentage - highlighted
  doc.setFillColor(59, 130, 246);
  doc.rect(40, 220, 130, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('bold');
  doc.text(`Attendance Rate: ${data.percentage.toFixed(1)}%`, 105, 232, { align: 'center' });
  
  // Status
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('normal');
  const status = getAttendanceStatus(data.percentage);
  doc.text(`Status: ${status}`, 105, 252, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Issued on ${new Date().toLocaleDateString()}`, 105, 270, { align: 'center' });
  
  // Save
  const filename = `attendance_certificate_${data.studentName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Generate Class Performance Comparison PDF
 */
export function generateClassPerformancePDF(data: {
  schoolName: string;
  startDate: string;
  endDate: string;
  classes: ClassAttendanceData[];
}): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text(data.schoolName, 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Class Attendance Performance Report', 105, 30, { align: 'center' });
  
  // Details
  doc.setFontSize(10);
  doc.text(`Period: ${data.startDate} to ${data.endDate}`, 105, 45, { align: 'center' });
  
  // Sort classes by attendance rate
  const sortedClasses = [...data.classes].sort((a, b) => b.attendanceRate - a.attendanceRate);
  
  // Table
  const tableData = sortedClasses.map((classItem, index) => [
    (index + 1).toString(),
    classItem.className,
    classItem.totalDays.toString(),
    classItem.totalPresent.toString(),
    classItem.totalAbsent.toString(),
    `${classItem.attendanceRate.toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    startY: 60,
    head: [['Rank', 'Class', 'Days', 'Total Present', 'Total Absent', 'Attendance Rate']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 35, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' }
    }
  });
  
  // Summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  if (sortedClasses.length > 0) {
    doc.setFontSize(12);
    doc.setFont('bold');
    doc.text('Summary:', 20, finalY);
    
    doc.setFont('normal');
    doc.setFontSize(10);
    
    const avgRate = sortedClasses.reduce((sum, c) => sum + c.attendanceRate, 0) / sortedClasses.length;
    doc.text(`Average Attendance Rate: ${avgRate.toFixed(1)}%`, 20, finalY + 8);
    
    const bestClass = sortedClasses[0];
    doc.setTextColor(34, 197, 94);
    doc.text(`🏆 Best Performing: ${bestClass.className} (${bestClass.attendanceRate.toFixed(1)}%)`, 20, finalY + 16);
    
    if (sortedClasses.length > 1) {
      const worstClass = sortedClasses[sortedClasses.length - 1];
      doc.setTextColor(239, 68, 68);
      doc.text(`⚠ Needs Attention: ${worstClass.className} (${worstClass.attendanceRate.toFixed(1)}%)`, 20, finalY + 24);
    }
    
    doc.setTextColor(0, 0, 0);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
  
  // Save
  const filename = `class_performance_${data.startDate}_to_${data.endDate}.pdf`;
  doc.save(filename);
}

/**
 * Generate Absentee Report PDF
 */
export function generateAbsenteeReportPDF(data: {
  schoolName: string;
  date: string;
  absentees: Array<{
    className: string;
    studentName: string;
    status: 'absent' | 'excused';
    remarks?: string;
  }>;
}): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text(data.schoolName, 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Absentee Report', 105, 30, { align: 'center' });
  
  // Details
  doc.setFontSize(10);
  doc.text(`Date: ${data.date}`, 105, 45, { align: 'center' });
  
  if (data.absentees.length === 0) {
    doc.setFontSize(12);
    doc.text('🎉 No students absent on this date!', 105, 70, { align: 'center' });
  } else {
    // Group by class
    const byClass = data.absentees.reduce((acc, student) => {
      if (!acc[student.className]) {
        acc[student.className] = [];
      }
      acc[student.className].push(student);
      return acc;
    }, {} as Record<string, typeof data.absentees>);
    
    let currentY = 60;
    
    Object.entries(byClass).forEach(([className, students]) => {
      // Class header
      doc.setFontSize(11);
      doc.setFont( 'bold');
      doc.text(`${className} (${students.length} absent)`, 20, currentY);
      currentY += 7;
      
      // Table for this class
      const tableData = students.map((student, index) => [
        (index + 1).toString(),
        student.studentName,
        student.status === 'excused' ? 'Excused' : 'Absent',
        student.remarks || '-'
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Student Name', 'Status', 'Remarks']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 65 }
        },
        margin: { left: 25 }
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 10;
      
      // Add new page if needed
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    });
    
    // Summary
    doc.setFontSize(11);
    doc.setFont('bold');
    doc.text(`Total Absentees: ${data.absentees.length}`, 20, currentY);
    
    const excusedCount = data.absentees.filter(a => a.status === 'excused').length;
    const unexcusedCount = data.absentees.length - excusedCount;
    
    doc.setFont( 'normal');
    doc.setFontSize(10);
    doc.text(`Excused: ${excusedCount}`, 20, currentY + 7);
    doc.text(`Unexcused: ${unexcusedCount}`, 70, currentY + 7);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
  
  // Save
  const filename = `absentee_report_${data.date}.pdf`;
  doc.save(filename);
}

/**
 * Helper functions
 */
function getStatusSymbol(status: string): string {
  switch (status) {
    case 'present': return '✓ Present';
    case 'absent': return '✗ Absent';
    case 'late': return '⏰ Late';
    case 'excused': return 'ⓘ Excused';
    default: return status;
  }
}

function getAttendanceStatus(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 75) return 'Good';
  if (percentage >= 60) return 'Satisfactory';
  return 'Needs Improvement';
}
