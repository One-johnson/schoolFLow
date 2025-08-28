import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Centralized Grading Logic
export const calculateGrade = (totalScore: number): { grade: string; remarks: string } => {
    if (totalScore >= 80) return { grade: "A1", remarks: "Excellent" };
    if (totalScore >= 75) return { grade: "B2", remarks: "Very Good" };
    if (totalScore >= 70) return { grade: "B3", remarks: "Good" };
    if (totalScore >= 65) return { grade: "C4", remarks: "Credit" };
    if (totalScore >= 60) return { grade: "C5", remarks: "Credit" };
    if (totalScore >= 55) return { grade: "C6", remarks: "Credit" };
    if (totalScore >= 50) return { grade: "D7", remarks: "Pass" };
    if (totalScore >= 45) return { grade: "E8", remarks: "Pass" };
    return { grade: "F9", remarks: "Fail" };
};

// Centralized ID Generation
export const generateStudentId = (): string => {
  const year = new Date().getFullYear().toString().slice(-2)
  const classType = 'S' // for Student
  const randomPart = Math.random().toString().slice(2, 8)
  return `${year}${classType}${randomPart}`
}

export const generateAdmissionNo = (): string => {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString().slice(2, 7); // 5 digits
  return `ADM-${year}-${randomPart}`;
};

export const generateTeacherId = (department: string): string => {
  const year = new Date().getFullYear().toString().slice(-2)
  const classType = 'T' // for Teacher
  const deptChar = department.length > 0 ? department.charAt(0).toUpperCase() : 'X'
  const randomPart = Math.random().toString().slice(2, 8)
  return `${year}${classType}${deptChar}${randomPart}`
}

export const generateClassId = (className: string): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const classType = 'C'; // for Class
    const nameChar = className.length > 0 ? className.charAt(0).toUpperCase() : 'X';
    const randomPart = Math.random().toString().slice(2, 8);
    return `${year}${classType}${nameChar}${randomPart}`;
};
