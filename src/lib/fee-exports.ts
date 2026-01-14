import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  studentName: string;
  studentId: string;
  className: string;
  categoryName: string;
  amountDue: number;
  amountPaid: number;
  remainingBalance: number;
  paymentMethod: string;
  transactionReference?: string;
  paidBy?: string;
  collectedByName: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
}

export function generateFeeReceipt(receipt: ReceiptData): void {
  const doc = new jsPDF();
  
  // School Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(String(receipt.schoolName), 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(String(receipt.schoolAddress), 14, 27);
  doc.text(`Phone: ${String(receipt.schoolPhone)}`, 14, 32);
  
  // Receipt Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE PAYMENT RECEIPT', 105, 45, { align: 'center' });
  
  // Receipt Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const startY = 55;
  const lineHeight = 7;
  let currentY = startY;
  
  // Receipt Information
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Number:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(receipt.receiptNumber), 60, currentY);
  
  currentY += lineHeight;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Date:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(receipt.paymentDate).toLocaleDateString(), 60, currentY);
  
  currentY += lineHeight * 1.5;
  
  // Student Information
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information:', 14, currentY);
  currentY += lineHeight;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${String(receipt.studentName)}`, 20, currentY);
  currentY += lineHeight;
  doc.text(`Student ID: ${String(receipt.studentId)}`, 20, currentY);
  currentY += lineHeight;
  doc.text(`Class: ${String(receipt.className)}`, 20, currentY);
  currentY += lineHeight * 1.5;
  
  // Payment Details Table
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details:', 14, currentY);
  currentY += lineHeight;
  
  autoTable(doc, {
    startY: currentY,
    head: [['Description', 'Amount']],
    body: [
      ['Fee Category', String(receipt.categoryName)],
      ['Amount Due', `GHS ${receipt.amountDue.toFixed(2)}`],
      ['Amount Paid', `GHS ${receipt.amountPaid.toFixed(2)}`],
      ['Remaining Balance', `GHS ${receipt.remainingBalance.toFixed(2)}`],
      ['Payment Method', String(receipt.paymentMethod).replace('_', ' ').toUpperCase()],
      ...(receipt.transactionReference 
        ? [['Transaction Reference', String(receipt.transactionReference)]] 
        : []
      ),
      ...(receipt.paidBy 
        ? [['Paid By', String(receipt.paidBy)]] 
        : []
      ),
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Collected By: ${String(receipt.collectedByName)}`, 14, finalY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt and does not require a signature.', 105, finalY + 10, { align: 'center' });
  doc.text('Please keep this receipt for your records.', 105, finalY + 15, { align: 'center' });
  
  // Border
  doc.setDrawColor(200, 200, 200);
  doc.rect(10, 10, 190, 277);
  
  // Save PDF
  doc.save(`receipt_${receipt.receiptNumber}.pdf`);
}

interface OutstandingFeesData {
  studentName: string;
  studentId: string;
  className: string;
  categoryName: string;
  amountDue: number;
  amountPaid: number;
  remainingBalance: number;
  paymentDate: string;
}

export function exportOutstandingFeesPDF(
  fees: OutstandingFeesData[],
  schoolName: string
): void {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(schoolName), 14, 20);
  
  doc.setFontSize(14);
  doc.text('Outstanding Fees Report', 14, 30);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 37);
  
  autoTable(doc, {
    startY: 45,
    head: [['Student Name', 'Student ID', 'Class', 'Fee Category', 'Amount Due', 'Amount Paid', 'Balance']],
    body: fees.map(fee => [
      String(fee.studentName),
      String(fee.studentId),
      String(fee.className),
      String(fee.categoryName),
      `GHS ${fee.amountDue.toFixed(2)}`,
      `GHS ${fee.amountPaid.toFixed(2)}`,
      `GHS ${fee.remainingBalance.toFixed(2)}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    foot: [[
      'TOTAL',
      '',
      '',
      '',
      `GHS ${fees.reduce((sum, f) => sum + f.amountDue, 0).toFixed(2)}`,
      `GHS ${fees.reduce((sum, f) => sum + f.amountPaid, 0).toFixed(2)}`,
      `GHS ${fees.reduce((sum, f) => sum + f.remainingBalance, 0).toFixed(2)}`,
    ]],
    footStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
  });
  
  doc.save('outstanding_fees_report.pdf');
}
