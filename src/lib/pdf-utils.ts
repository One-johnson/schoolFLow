// PDF Export Utilities for Report Cards using jsPDF and jspdf-autotable
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PrintLayoutOptions {
  includePhoto: boolean;
  includeChart: boolean;
  includeGradingScale: boolean;
  includeAttendance: boolean;
  includePosition: boolean;
  includeConduct: boolean;
  includeAttitude: boolean;
  includeInterest: boolean;
  includeComments: boolean;
  includeSignatures: boolean;
}

interface ReportCardData {
  studentName: string;
  className: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  academicYearName?: string;
  academicYearId?: string;
  termName?: string;
  termId?: string;
  rawScore: number;
  totalScore: number;
  percentage: number;
  overallGrade: string;
  subjects: string;
  attendance?: string;
  position?: number;
  totalStudents?: number;
  promotionStatus?: string;
  classTeacherComment?: string;
  headmasterComment?: string;
  gradingScaleName?: string;
  gradingScaleData?: string; // JSON string of the grading scale
  conduct?: string;
  attitude?: string;
  interest?: string;
  photoUrl?: string;
}

interface GradingScaleGrade {
  grade: string | number;
  minPercent: number;
  maxPercent: number;
  remark: string;
}

/**
 * Generate a single report card PDF
 */
export function exportReportCardToPDF(reportCard: ReportCardData, options?: PrintLayoutOptions): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Default options if not provided
  const layoutOptions: PrintLayoutOptions = options || {
    includePhoto: true,
    includeChart: false,
    includeGradingScale: true,
    includeAttendance: true,
    includePosition: true,
    includeConduct: true,
    includeAttitude: true,
    includeInterest: true,
    includeComments: true,
    includeSignatures: true,
  };
  
  generateReportCardPage(doc, reportCard, 0, layoutOptions);
  
  // Open PDF in new tab
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

/**
 * Generate multiple report cards in a single PDF
 */
export function bulkExportReportCardsToPDF(reportCards: ReportCardData[], options?: PrintLayoutOptions): void {
  if (reportCards.length === 0) {
    alert('No report cards to export');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Default options if not provided
  const layoutOptions: PrintLayoutOptions = options || {
    includePhoto: true,
    includeChart: false,
    includeGradingScale: true,
    includeAttendance: true,
    includePosition: true,
    includeConduct: true,
    includeAttitude: true,
    includeInterest: true,
    includeComments: true,
    includeSignatures: true,
  };
  
  reportCards.forEach((reportCard, index) => {
    if (index > 0) {
      doc.addPage();
    }
    generateReportCardPage(doc, reportCard, index, layoutOptions);
  });
  
  // Open PDF in new tab
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

/**
 * Generate a single report card page in the PDF
 */
function generateReportCardPage(doc: jsPDF, reportCard: ReportCardData, pageIndex: number, options: PrintLayoutOptions): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 7;
  const contentWidth = pageWidth - (2 * margin);
  let yPos = margin;

  // Border around the entire report card
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, doc.internal.pageSize.getHeight() - (2 * margin));

  // Header Section with optional student photo
  const photoSize = 25; // Size of photo in mm
  const photoX = pageWidth - margin - photoSize - 5;
  const photoY = yPos + 5;
  
  // Add student photo if available and option is enabled
  if (options.includePhoto && reportCard.photoUrl) {
    try {
      doc.addImage(reportCard.photoUrl, 'JPEG', photoX, photoY, photoSize, photoSize);
      doc.rect(photoX, photoY, photoSize, photoSize); // Border around photo
    } catch (error) {
      console.error('Error adding photo to PDF:', error);
    }
  }
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const schoolName = reportCard.schoolName || 'SCHOOL NAME';
  doc.text(schoolName, pageWidth / 2, yPos + 10, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.schoolAddress || 'Address not available', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Tel: ${reportCard.schoolPhone || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PUPILS TERMLY REPORT', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  // Line separator
  doc.setLineWidth(0.3);
  doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
  
  yPos += 8;

  // Student Information Grid (3 columns)
  doc.setFontSize(10);
  const col1X = margin + 5;
  const col2X = margin + 5 + (contentWidth / 3);
  const col3X = margin + 5 + (2 * contentWidth / 3);
  
  // Row 1: Name, Class, Year
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.studentName, col1X + 20, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Class:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.className, col2X + 20, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Year:', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.academicYearName || reportCard.academicYearId || 'N/A', col3X + 20, yPos);
  
  // Row 2: Term
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Term:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.termName || reportCard.termId || 'N/A', col1X + 20, yPos);
  
  yPos += 8;

  // Performance Summary (3 columns)
  // Row 1: Raw Score, Total Score, Overall Percentage
  doc.setFont('helvetica', 'bold');
  doc.text('Raw Score:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.rawScore.toFixed(1), col1X + 25, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Score:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.totalScore.toFixed(1), col2X + 27, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Overall %:', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportCard.percentage.toFixed(1)}%`, col3X + 25, yPos);
  
  // Row 2: Overall Grade
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Grade:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(reportCard.overallGrade, col1X + 30, yPos);
  
  yPos += 8;

  // Subjects Table
  const subjects = reportCard.subjects ? JSON.parse(reportCard.subjects) : [];
  const tableData = subjects.map((subject: {
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    position: number;
    grade: string;
    remarks: string;
  }) => [
    subject.subjectName,
    subject.classScore.toString(),
    subject.examScore.toString(),
    subject.totalScore.toString(),
    subject.position.toString(),
    subject.grade,
    subject.remarks,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['SUBJECT', 'CLASS SCORE (%)', 'EXAM SCORE (%)', 'TOTAL SCORE (%)', 'POSITION', 'GRADE', 'REMARKS']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 35 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'center', cellWidth: 'auto' },
    },
    margin: { left: margin + 5, right: margin + 5 },
  });

  // Update yPos after table
  const finalY = (doc as any).lastAutoTable.finalY;
  yPos = finalY + 8;

  // Grading Scale Section (optional)
  if (!options.includeGradingScale) {
    // Skip grading scale
  } else {
  doc.setLineWidth(0.3);
  doc.rect(margin + 5, yPos, contentWidth - 10, 30);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const gradingScaleTitle = reportCard.gradingScaleName 
    ? `GRADING SCALE (${reportCard.gradingScaleName})`
    : 'GRADING SCALE';
  doc.text(gradingScaleTitle, margin + 8, yPos);
  
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Parse grading scale if available
  let gradingScaleGrades: GradingScaleGrade[] = [];
  if (reportCard.gradingScaleData) {
    try {
      gradingScaleGrades = JSON.parse(reportCard.gradingScaleData);
    } catch (e) {
      // Use default scale
    }
  }
  
  if (gradingScaleGrades.length === 0) {
    // Default grading scale
    gradingScaleGrades = [
      { grade: '1', minPercent: 80, maxPercent: 100, remark: 'Excellent' },
      { grade: '2', minPercent: 70, maxPercent: 79, remark: 'Very Good' },
      { grade: '3', minPercent: 65, maxPercent: 69, remark: 'Good' },
      { grade: '4', minPercent: 60, maxPercent: 64, remark: 'High Average' },
      { grade: '5', minPercent: 55, maxPercent: 59, remark: 'Average' },
      { grade: '6', minPercent: 50, maxPercent: 54, remark: 'Low Average' },
      { grade: '7', minPercent: 45, maxPercent: 49, remark: 'Pass' },
      { grade: '8', minPercent: 40, maxPercent: 44, remark: 'Pass' },
      { grade: '9', minPercent: 0, maxPercent: 39, remark: 'Fail' },
    ];
  }
  
  // Display grading scale in 3 columns
  const colWidth = (contentWidth - 20) / 3;
  let col = 0;
  let row = 0;
  
  gradingScaleGrades.forEach((grade, index) => {
    const xPos = margin + 8 + (col * colWidth);
    const currentYPos = yPos + (row * 4);
    doc.text(`${grade.minPercent}-${grade.maxPercent}: Grade ${grade.grade} - ${grade.remark}`, xPos, currentYPos);
    
    col++;
    if (col >= 3) {
      col = 0;
      row++;
    }
  });
  
  }
  
  yPos += options.includeGradingScale ? 28 : 0;

  // Additional Information (3 columns)
  const attendance = reportCard.attendance ? JSON.parse(reportCard.attendance) : null;
  
  const shouldShowAdditionalInfo = (
    (options.includeAttendance && attendance) ||
    (options.includePosition && reportCard.position && reportCard.totalStudents) ||
    reportCard.promotionStatus ||
    (options.includeConduct && reportCard.conduct) ||
    (options.includeAttitude && reportCard.attitude) ||
    (options.includeInterest && reportCard.interest)
  );
  
  if (shouldShowAdditionalInfo) {
    yPos += 5;
    doc.setFontSize(10);
    
    // Row 1: Attendance, Position, Promoted To
    let hasRow1 = false;
    if (options.includeAttendance && attendance) {
      doc.setFont('helvetica', 'bold');
      doc.text('Attendance:', col1X, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${attendance.present} / ${attendance.total}`, col1X + 27, yPos);
      hasRow1 = true;
    }
    
    if (options.includePosition && reportCard.position && reportCard.totalStudents) {
      doc.setFont('helvetica', 'bold');
      doc.text('Position:', col2X, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${reportCard.position} / ${reportCard.totalStudents}`, col2X + 22, yPos);
      hasRow1 = true;
    }
    
    if (reportCard.promotionStatus) {
      doc.setFont('helvetica', 'bold');
      doc.text('Promoted To:', col3X, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(reportCard.promotionStatus, col3X + 28, yPos);
      hasRow1 = true;
    }
    
    // Row 2: Conduct, Attitude, Interest
    const hasRow2 = (options.includeConduct && reportCard.conduct) || 
                    (options.includeAttitude && reportCard.attitude) || 
                    (options.includeInterest && reportCard.interest);
    
    if (hasRow2) {
      if (hasRow1) yPos += 6;
      
      if (options.includeConduct && reportCard.conduct) {
        doc.setFont('helvetica', 'bold');
        doc.text('Conduct:', col1X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(reportCard.conduct, col1X + 22, yPos);
      }
      
      if (options.includeAttitude && reportCard.attitude) {
        doc.setFont('helvetica', 'bold');
        doc.text('Attitude:', col2X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(reportCard.attitude, col2X + 22, yPos);
      }
      
      if (options.includeInterest && reportCard.interest) {
        doc.setFont('helvetica', 'bold');
        doc.text('Interest:', col3X, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(reportCard.interest, col3X + 20, yPos);
      }
    }
    
    yPos += 8;
  }

  // Comments Section (no borders) - optional
  if (options.includeComments && (reportCard.classTeacherComment || reportCard.headmasterComment)) {
    yPos += 3;
    
    if (reportCard.classTeacherComment) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Class Teacher's Comment:", margin + 5, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const commentLines = doc.splitTextToSize(reportCard.classTeacherComment, contentWidth - 10);
      doc.text(commentLines, margin + 5, yPos);
      yPos += (commentLines.length * 4) + 3;
    }
    
    if (reportCard.headmasterComment) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Headmaster's Comment:", margin + 5, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const commentLines = doc.splitTextToSize(reportCard.headmasterComment, contentWidth - 10);
      doc.text(commentLines, margin + 5, yPos);
      yPos += (commentLines.length * 4) + 3;
    }
  }

  // Signatures Section - optional
  if (options.includeSignatures) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const signatureY = Math.max(yPos + 10, pageHeight - 30);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Class Teacher Signature
    doc.line(margin + 10, signatureY, margin + 60, signatureY);
    doc.text("Class Teacher's Sign", margin + 25, signatureY + 5);
    
    // Headmaster Signature
    doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin - 10, signatureY);
    doc.text("Headmaster's Sign", pageWidth - margin - 50, signatureY + 5);
  }
}
