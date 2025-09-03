
"use client";

import Image from "next/image";
import { format } from 'date-fns';

type Student = { id: string; name: string, studentId: string, avatarUrl?: string, house?: string };
type Class = { id: string; name: string; };
type Term = { id: string; name: string, vacationDate?: string, reopeningDate?: string };
type Exam = { id: string; name: string; year: string; };
type Result = { subjectName: string; classScore: number; examScore: number; totalScore: number; positionInClass: string; grade: string; remarks: string; };
type TermlyPerformance = {
  [term: string]: {
    totalScore: number;
    rawScore: number;
  }
};

interface ReportCardProps {
  student: Student;
  class: Class;
  term: Term;
  exam: Exam;
  results: Result[];
  termlyPerformance: TermlyPerformance;
}

export function ReportCard({ student, class: studentClass, term, exam, results, termlyPerformance }: ReportCardProps) {

    const totalScore = results.reduce((acc, r) => acc + r.totalScore, 0);
    const rawScore = results.length * 100;

    const gradeInterpretation = [
        { score: "80 - 100", grade: 1, remarks: "Excellent" },
        { score: "70 - 79", grade: 2, remarks: "Very Good" },
        { score: "65 - 69", grade: 3, remarks: "Good" },
        { score: "60 - 64", grade: 4, remarks: "High Average" },
        { score: "55 - 59", grade: 5, remarks: "Average" },
        { score: "50 - 54", grade: 6, remarks: "Low Average" },
        { score: "45 - 49", grade: 7, remarks: "Pass" },
        { score: "40 - 44", grade: 8, remarks: "Pass" },
        { score: "0 - 39", grade: 9, remarks: "Fail" },
    ];

  return (
    <div className="bg-white text-black text-sm p-4 font-sans report-card" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="flex items-center space-x-2">
          <Image src="/logo.png" alt="School Logo" width={60} height={60} />
          <div className="text-xs">
            <h1 className="font-bold text-lg">EVANGELICAL PRESBYTERIAN CHURCH SCHOOL, ABEKA</h1>
            <p>P. O. BOX AN 5876, ACCRA NORTH, BOTWE LINK</p>
            <p>TEL: 024-470-1660 | EMAIL: epchurchschoolabeka@gmail.com</p>
          </div>
        </div>
        <div className="w-24 h-28 border border-black flex items-center justify-center">
            {student.avatarUrl ? <Image src={student.avatarUrl} alt="Student Photo" width={96} height={112} className="object-cover w-full h-full" /> : 'Photo'}
        </div>
      </div>

      {/* Report Title */}
      <h2 className="text-center font-bold bg-gray-300 my-2 py-1">STUDENT TERMINAL REPORT</h2>

      {/* Student Info */}
      <div className="grid grid-cols-4 gap-x-2 border-b border-black">
        <div className="col-span-3 border-r border-black p-1"><strong>Name:</strong> {student.name}</div>
        <div className="col-span-1 p-1"><strong>Class:</strong> {studentClass.name}</div>
      </div>
       <div className="grid grid-cols-4 gap-x-2 border-b border-black">
        <div className="col-span-1 border-r border-black p-1"><strong>Raw Score:</strong> {rawScore}</div>
        <div className="col-span-1 border-r border-black p-1"><strong>Total Score:</strong> {totalScore.toFixed(2)}</div>
        <div className="col-span-1 border-r border-black p-1"><strong>Year:</strong> {exam.year}</div>
        <div className="col-span-1 p-1"><strong>House:</strong> {student.house || 'N/A'}</div>
      </div>
      <div className="grid grid-cols-2 gap-x-2 border-b-2 border-black">
        <div className="border-r border-black p-1"><strong>Vacation Date:</strong> {term.vacationDate ? format(new Date(term.vacationDate), "dd/MM/yyyy") : 'N/A'}</div>
        <div className="p-1"><strong>Re-opening Date:</strong> {term.reopeningDate ? format(new Date(term.reopeningDate), "dd/MM/yyyy") : 'N/A'}</div>
      </div>

      {/* Results Table */}
      <table className="w-full my-2 border-collapse border border-black">
        <thead>
          <tr className="bg-gray-300 font-bold text-center">
            <td className="border border-black p-1">SUBJECTS</td>
            <td className="border border-black p-1">CLASS SCORE (%)</td>
            <td className="border border-black p-1">EXAMS SCORE (%)</td>
            <td className="border border-black p-1">TOTAL SCORE (%)</td>
            <td className="border border-black p-1">POSITION</td>
            <td className="border border-black p-1">GRADE</td>
            <td className="border border-black p-1">REMARKS</td>
          </tr>
        </thead>
        <tbody>
          {results.map((r, index) => (
            <tr key={index} className="text-center">
              <td className="border border-black p-1 text-left">{r.subjectName}</td>
              <td className="border border-black p-1">{r.classScore}</td>
              <td className="border border-black p-1">{r.examScore}</td>
              <td className="border border-black p-1">{r.totalScore}</td>
              <td className="border border-black p-1 text-red-500 font-bold">{r.positionInClass}</td>
              <td className="border border-black p-1">{r.grade}</td>
              <td className="border border-black p-1">{r.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Attendance & Conduct */}
      <div className="grid grid-cols-3 gap-x-2 border-y-2 border-black">
        <div className="border-r border-black p-1"><strong>Attendance:</strong> 54 <span className="ml-4">Out of: 56</span></div>
        <div className="col-span-2 p-1"><strong>Promoted To:</strong> BASIC 9</div>
      </div>
      <div className="border-b border-black p-1"><strong>Conduct:</strong> Punctual</div>
      <div className="border-b border-black p-1"><strong>Attitude:</strong> Persistent</div>
      <div className="border-b-2 border-black p-1"><strong>Interest:</strong> Art & Design</div>

      {/* Remarks & Signatures */}
      <div className="border-b-2 border-black p-1"><strong>Class Teacher's Remarks:</strong> Polite and respectful but needs to be more confident in class participation.</div>
      <div className="grid grid-cols-2 gap-x-2 border-b-2 border-black">
        <div className="border-r border-black p-1 h-16"><strong>Headmaster Sign:</strong></div>
        <div className="p-1 h-16"><strong>Class Teacher Sign:</strong> PJ</div>
      </div>

      {/* Grade Interpretation & Termly Performance */}
      <div className="flex mt-2">
        <div className="w-1/2 pr-1">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-300 font-bold text-center">
                <td colSpan={3} className="border border-black p-1">Grade Interpretation</td>
              </tr>
              <tr className="bg-yellow-400 font-bold text-center">
                <td className="border border-black p-1">Score (%)</td>
                <td className="border border-black p-1">Grade</td>
                <td className="border border-black p-1">Remarks</td>
              </tr>
            </thead>
            <tbody>
              {gradeInterpretation.map((g, i) => (
                <tr key={i} className="text-center">
                  <td className="border border-black p-1">{g.score}</td>
                  <td className="border border-black p-1">{g.grade}</td>
                  <td className="border border-black p-1">{g.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-1/2 pl-1">
          <table className="w-full border-collapse border border-black h-full">
             <thead>
              <tr className="bg-gray-300 font-bold text-center">
                <td colSpan={3} className="border-b border-black p-1">Termly Performance</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center font-bold bg-red-500 text-white">1st Term <br/> Total Score</td>
                <td className="border border-black p-1 text-center font-bold bg-green-500 text-white">2nd Term <br/> Total Score</td>
                <td className="border border-black p-1 text-center font-bold bg-blue-500 text-white">3rd Term <br/> Total Score</td>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center">
                <td className="border border-black p-1 h-full">
                    <div className="flex flex-col justify-around h-full">
                        <span className="text-lg font-bold">{termlyPerformance['1st']?.totalScore || 'N/A'}</span>
                        <span>OUT OF</span>
                        <span>{termlyPerformance['1st']?.rawScore || 'N/A'}</span>
                    </div>
                </td>
                <td className="border border-black p-1 h-full">
                    <div className="flex flex-col justify-around h-full">
                        <span className="text-lg font-bold">{termlyPerformance['2nd']?.totalScore || 'N/A'}</span>
                        <span>OUT OF</span>
                        <span>{termlyPerformance['2nd']?.rawScore || 'N/A'}</span>
                    </div>
                </td>
                <td className="border border-black p-1 h-full">
                   <div className="flex flex-col justify-around h-full">
                        <span className="text-lg font-bold">{totalScore.toFixed(0)}</span>
                        <span>OUT OF</span>
                        <span>{rawScore}</span>
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
