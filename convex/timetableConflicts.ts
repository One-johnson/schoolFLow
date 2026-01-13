import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Id } from './_generated/dataModel';

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface Conflict {
  type: 'teacher_double_booking' | 'teacher_consecutive' | 'teacher_overload' | 'subject_clustering';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details: {
    teacherId?: string;
    teacherName?: string;
    day?: Day;
    periods?: string[];
    classNames?: string[];
    subjectName?: string;
  };
}

// Check for conflicts in a timetable
export const checkTimetableConflicts = query({
  args: { 
    timetableId: v.id('timetables'),
    schoolId: v.string(),
  },
  handler: async (ctx, args): Promise<Conflict[]> => {
    const conflicts: Conflict[] = [];

    // Get all assignments for this timetable
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_timetable', (q) => q.eq('timetableId', args.timetableId))
      .collect();

    if (assignments.length === 0) {
      return conflicts;
    }

    // Get all assignments for the school to check for teacher conflicts
    const allSchoolAssignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    // Check for teacher double-booking (same teacher, same day, same time, different classes)
    const teacherSchedules: Record<string, Record<string, typeof assignments>> = {};

    allSchoolAssignments.forEach((assignment) => {
      if (!teacherSchedules[assignment.teacherId]) {
        teacherSchedules[assignment.teacherId] = {};
      }
      if (!teacherSchedules[assignment.teacherId][assignment.day]) {
        teacherSchedules[assignment.teacherId][assignment.day] = [];
      }
      teacherSchedules[assignment.teacherId][assignment.day].push(assignment);
    });

    // Check each teacher's schedule
    Object.entries(teacherSchedules).forEach(([teacherId, schedule]) => {
      Object.entries(schedule).forEach(([day, dayAssignments]) => {
        // Sort by start time
        const sorted = [...dayAssignments].sort((a, b) => {
          return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });

        // Check for overlaps
        for (let i = 0; i < sorted.length; i++) {
          for (let j = i + 1; j < sorted.length; j++) {
            const a1 = sorted[i];
            const a2 = sorted[j];

            // Check if times overlap
            if (timesOverlap(a1.startTime, a1.endTime, a2.startTime, a2.endTime)) {
              // Only report if one of them is in the current timetable
              if (a1.timetableId === args.timetableId || a2.timetableId === args.timetableId) {
                conflicts.push({
                  type: 'teacher_double_booking',
                  severity: 'error',
                  message: `${a1.teacherName} is double-booked on ${day} (${a1.startTime}-${a1.endTime})`,
                  details: {
                    teacherId,
                    teacherName: a1.teacherName,
                    day: day as Day,
                    periods: [a1.startTime, a2.startTime],
                    classNames: [a1.className, a2.className],
                  },
                });
              }
            }
          }
        }

        // Check for consecutive periods (3+ in a row)
        let consecutiveCount = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const curr = sorted[i];

          // Check if current starts when previous ends (consecutive)
          if (curr.startTime === prev.endTime) {
            consecutiveCount++;
            if (consecutiveCount >= 3) {
              // Only report if in current timetable
              if (sorted.slice(i - consecutiveCount + 1, i + 1).some(a => a.timetableId === args.timetableId)) {
                conflicts.push({
                  type: 'teacher_consecutive',
                  severity: 'warning',
                  message: `${curr.teacherName} has ${consecutiveCount} consecutive periods on ${day}`,
                  details: {
                    teacherId,
                    teacherName: curr.teacherName,
                    day: day as Day,
                    periods: sorted.slice(i - consecutiveCount + 1, i + 1).map(a => a.startTime),
                  },
                });
              }
            }
          } else {
            consecutiveCount = 1;
          }
        }

        // Check for teacher overload (6+ periods in a day)
        if (sorted.length >= 6) {
          const inCurrentTimetable = sorted.some(a => a.timetableId === args.timetableId);
          if (inCurrentTimetable) {
            conflicts.push({
              type: 'teacher_overload',
              severity: 'warning',
              message: `${sorted[0].teacherName} has ${sorted.length} periods on ${day}`,
              details: {
                teacherId,
                teacherName: sorted[0].teacherName,
                day: day as Day,
                periods: sorted.map(a => a.startTime),
              },
            });
          }
        }
      });
    });

    // Check for subject clustering (same subject multiple times on same day)
    const subjectsByDay: Record<string, Record<string, typeof assignments>> = {};

    assignments.forEach((assignment) => {
      if (!subjectsByDay[assignment.day]) {
        subjectsByDay[assignment.day] = {};
      }
      if (!subjectsByDay[assignment.day][assignment.subjectName]) {
        subjectsByDay[assignment.day][assignment.subjectName] = [];
      }
      subjectsByDay[assignment.day][assignment.subjectName].push(assignment);
    });

    Object.entries(subjectsByDay).forEach(([day, subjects]) => {
      Object.entries(subjects).forEach(([subjectName, subjectAssignments]) => {
        if (subjectAssignments.length >= 2) {
          conflicts.push({
            type: 'subject_clustering',
            severity: 'info',
            message: `${subjectName} appears ${subjectAssignments.length} times on ${day}`,
            details: {
              day: day as Day,
              subjectName,
              periods: subjectAssignments.map(a => a.startTime),
            },
          });
        }
      });
    });

    return conflicts;
  },
});

// Helper function to convert time to minutes
function timeToMinutes(time: string): number {
  const [hour, min] = time.split(':').map(Number);
  return hour * 60 + min;
}

// Helper function to check if two time ranges overlap
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}
