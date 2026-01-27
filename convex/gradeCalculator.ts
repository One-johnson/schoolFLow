// Helper function to calculate grade from percentage using custom grading scale

interface GradeRange {
  grade: number | string;
  minPercent: number;
  maxPercent: number;
  remark: string;
}

interface GradeResult {
  grade: string;
  remark: string;
}

export function calculateGradeFromScale(
  percentage: number,
  gradingScale: { grades: string }
): GradeResult {
  try {
    const grades: GradeRange[] = JSON.parse(gradingScale.grades);
    
    // Find the matching grade range
    for (const gradeRange of grades) {
      if (percentage >= gradeRange.minPercent && percentage <= gradeRange.maxPercent) {
        return {
          grade: String(gradeRange.grade),
          remark: gradeRange.remark,
        };
      }
    }
    
    // Fallback to lowest grade if no match
    const lowestGrade = grades[grades.length - 1];
    return {
      grade: String(lowestGrade.grade),
      remark: lowestGrade.remark,
    };
  } catch (error) {
    // Fallback to default grading if parsing fails
    return getDefaultGrade(percentage);
  }
}

// Fallback default grading system
function getDefaultGrade(percentage: number): GradeResult {
  if (percentage >= 80) return { grade: '1', remark: 'Excellent' };
  if (percentage >= 70) return { grade: '2', remark: 'Very Good' };
  if (percentage >= 65) return { grade: '3', remark: 'Good' };
  if (percentage >= 60) return { grade: '4', remark: 'High Average' };
  if (percentage >= 55) return { grade: '5', remark: 'Average' };
  if (percentage >= 50) return { grade: '6', remark: 'Low Average' };
  if (percentage >= 45) return { grade: '7', remark: 'Pass' };
  if (percentage >= 40) return { grade: '8', remark: 'Pass' };
  return { grade: '9', remark: 'Fail' };
}
