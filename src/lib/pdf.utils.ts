// PDF Export Utilities for Report Cards

export function exportReportCardToPDF(reportCard: any): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups for this site to download PDF');
    return;
  }

  // Parse subjects and attendance
  const subjects = reportCard.subjects ? JSON.parse(reportCard.subjects) : [];
  const attendance = reportCard.attendance ? JSON.parse(reportCard.attendance) : null;

  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Report Card - ${reportCard.studentName}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
        }
        .report-card {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid black;
          padding: 20px;
        }
        .header {
          text-center;
          border-bottom: 2px solid black;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          margin: 5px 0;
        }
        .header p {
          margin: 3px 0;
          font-size: 12px;
        }
        .header h2 {
          font-size: 18px;
          margin-top: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .info-grid p {
          margin: 5px 0;
        }
        .info-grid strong {
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 11px;
        }
        th, td {
          border: 1px solid black;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: 600;
          text-align: center;
        }
        td {
          text-align: center;
        }
        td:first-child {
          text-align: left;
        }
        .grading-scale {
          border: 2px solid black;
          padding: 15px;
          margin: 20px 0;
        }
        .grading-scale h3 {
          font-size: 14px;
          margin: 0 0 10px 0;
        }
        .grading-scale-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          font-size: 10px;
        }
        .comments {
          margin: 20px 0;
        }
        .comment-box {
          border: 1px solid black;
          padding: 10px;
          margin: 10px 0;
          font-size: 12px;
        }
        .comment-box strong {
          display: block;
          margin-bottom: 5px;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
        }
        .signature-line {
          border-top: 1px solid black;
          padding-top: 5px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="report-card">
        <div class="header">
          <h1>${reportCard.schoolName || 'SCHOOL NAME'}</h1>
          <p>${reportCard.schoolAddress || 'Address not available'}</p>
          <p>Tel: ${reportCard.schoolPhone || 'N/A'}</p>
          <h2>PUPILS TERMLY REPORT</h2>
        </div>

        <div class="info-grid">
          <div>
            <p><strong>Name:</strong> ${reportCard.studentName}</p>
            <p><strong>Class:</strong> ${reportCard.className}</p>
          </div>
          <div>
            <p><strong>Year:</strong> ${reportCard.academicYearName || reportCard.academicYearId || 'N/A'}</p>
            <p><strong>Term:</strong> ${reportCard.termName || reportCard.termId || 'N/A'}</p>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <p><strong>Raw Score:</strong> ${reportCard.rawScore.toFixed(1)}</p>
            <p><strong>Total Score:</strong> ${reportCard.totalScore.toFixed(1)}</p>
          </div>
          <div>
            <p><strong>Overall Percentage:</strong> ${reportCard.percentage.toFixed(1)}%</p>
            <p><strong>Overall Grade:</strong> ${reportCard.overallGrade}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SUBJECT</th>
              <th>CLASS SCORE (%)</th>
              <th>EXAMS SCORE (%)</th>
              <th>TOTAL SCORE (%)</th>
              <th>POSITION</th>
              <th>GRADE</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map((subject: any) => `
              <tr>
                <td>${subject.subjectName}</td>
                <td>${subject.classScore}</td>
                <td>${subject.examScore}</td>
                <td><strong>${subject.totalScore}</strong></td>
                <td>${subject.position}</td>
                <td><strong>${subject.grade}</strong></td>
                <td>${subject.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="grading-scale">
          <h3>GRADING SCALE${reportCard.gradingScaleName ? ` (${reportCard.gradingScaleName})` : ''}</h3>
          <div class="grading-scale-grid">
            <div>80-100: Grade 1 - Excellent</div>
            <div>70-79: Grade 2 - Very Good</div>
            <div>65-69: Grade 3 - Good</div>
            <div>60-64: Grade 4 - High Average</div>
            <div>55-59: Grade 5 - Average</div>
            <div>50-54: Grade 6 - Low Average</div>
            <div>45-49: Grade 7 - Pass</div>
            <div>40-44: Grade 8 - Pass</div>
            <div>0-39: Grade 9 - Fail</div>
          </div>
        </div>

        <div class="info-grid">
          <div>
            ${attendance ? `<p><strong>Attendance:</strong> ${attendance.present} / ${attendance.total}</p>` : ''}
            ${reportCard.promotionStatus ? `<p><strong>Promoted To:</strong> ${reportCard.promotionStatus}</p>` : ''}
            ${reportCard.position ? `<p><strong>Position:</strong> ${reportCard.position} / ${reportCard.totalStudents}</p>` : ''}
          </div>
        </div>

        ${reportCard.teacherComment || reportCard.headTeacherComment ? `
          <div class="comments">
            ${reportCard.teacherComment ? `
              <div class="comment-box">
                <strong>Class Teacher's Remarks:</strong>
                ${reportCard.teacherComment}
              </div>
            ` : ''}
            ${reportCard.headTeacherComment ? `
              <div class="comment-box">
                <strong>Headmaster's Remarks:</strong>
                ${reportCard.headTeacherComment}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="signatures">
          <div>
            <div class="signature-line">Class Teacher's Sign</div>
          </div>
          <div>
            <div class="signature-line">Headmaster's Sign</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function bulkExportReportCardsToPDF(reportCards: any[]): void {
  if (reportCards.length === 0) {
    alert('No report cards to export');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups for this site to download PDF');
    return;
  }

  // Generate HTML for all report cards
  const reportsHTML = reportCards.map((reportCard) => {
    const subjects = reportCard.subjects ? JSON.parse(reportCard.subjects) : [];
    const attendance = reportCard.attendance ? JSON.parse(reportCard.attendance) : null;

    return `
      <div class="report-card" style="page-break-after: always;">
        <div class="header">
          <h1>${reportCard.schoolName || 'SCHOOL NAME'}</h1>
          <p>${reportCard.schoolAddress || 'Address not available'}</p>
          <p>Tel: ${reportCard.schoolPhone || 'N/A'}</p>
          <h2>PUPILS TERMLY REPORT</h2>
        </div>

        <div class="info-grid">
          <div>
            <p><strong>Name:</strong> ${reportCard.studentName}</p>
            <p><strong>Class:</strong> ${reportCard.className}</p>
          </div>
          <div>
            <p><strong>Year:</strong> ${reportCard.academicYearName || reportCard.academicYearId || 'N/A'}</p>
            <p><strong>Term:</strong> ${reportCard.termName || reportCard.termId || 'N/A'}</p>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <p><strong>Raw Score:</strong> ${reportCard.rawScore.toFixed(1)}</p>
            <p><strong>Total Score:</strong> ${reportCard.totalScore.toFixed(1)}</p>
          </div>
          <div>
            <p><strong>Overall Percentage:</strong> ${reportCard.percentage.toFixed(1)}%</p>
            <p><strong>Overall Grade:</strong> ${reportCard.overallGrade}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SUBJECT</th>
              <th>CLASS SCORE</th>
              <th>EXAMS SCORE</th>
              <th>TOTAL SCORE</th>
              <th>POSITION</th>
              <th>GRADE</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map((subject: any) => `
              <tr>
                <td>${subject.subjectName}</td>
                <td>${subject.classScore}</td>
                <td>${subject.examScore}</td>
                <td><strong>${subject.totalScore}</strong></td>
                <td>${subject.position}</td>
                <td><strong>${subject.grade}</strong></td>
                <td>${subject.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="grading-scale">
          <h3>GRADING SCALE${reportCard.gradingScaleName ? ` (${reportCard.gradingScaleName})` : ''}</h3>
          <div class="grading-scale-grid">
            <div>80-100: Grade 1 - Excellent</div>
            <div>70-79: Grade 2 - Very Good</div>
            <div>65-69: Grade 3 - Good</div>
            <div>60-64: Grade 4 - High Average</div>
            <div>55-59: Grade 5 - Average</div>
            <div>50-54: Grade 6 - Low Average</div>
            <div>45-49: Grade 7 - Pass</div>
            <div>40-44: Grade 8 - Pass</div>
            <div>0-39: Grade 9 - Fail</div>
          </div>
        </div>

        ${reportCard.teacherComment || reportCard.headTeacherComment ? `
          <div class="comments">
            ${reportCard.teacherComment ? `
              <div class="comment-box">
                <strong>Class Teacher's Remarks:</strong>
                ${reportCard.teacherComment}
              </div>
            ` : ''}
            ${reportCard.headTeacherComment ? `
              <div class="comment-box">
                <strong>Headmaster's Remarks:</strong>
                ${reportCard.headTeacherComment}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="signatures">
          <div>
            <div class="signature-line">Class Teacher's Sign</div>
          </div>
          <div>
            <div class="signature-line">Headmaster's Sign</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Report Cards - Bulk Export</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          color: black;
        }
        .report-card {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid black;
          padding: 20px;
        }
        .header {
          text-center;
          border-bottom: 2px solid black;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          margin: 5px 0;
        }
        .header p {
          margin: 3px 0;
          font-size: 12px;
        }
        .header h2 {
          font-size: 18px;
          margin-top: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .info-grid p {
          margin: 5px 0;
        }
        .info-grid strong {
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 11px;
        }
        th, td {
          border: 1px solid black;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: 600;
          text-align: center;
        }
        td {
          text-align: center;
        }
        td:first-child {
          text-align: left;
        }
        .grading-scale {
          border: 2px solid black;
          padding: 15px;
          margin: 20px 0;
        }
        .grading-scale h3 {
          font-size: 14px;
          margin: 0 0 10px 0;
        }
        .grading-scale-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          font-size: 10px;
        }
        .comments {
          margin: 20px 0;
        }
        .comment-box {
          border: 1px solid black;
          padding: 10px;
          margin: 10px 0;
          font-size: 12px;
        }
        .comment-box strong {
          display: block;
          margin-bottom: 5px;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
        }
        .signature-line {
          border-top: 1px solid black;
          padding-top: 5px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      ${reportsHTML}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
