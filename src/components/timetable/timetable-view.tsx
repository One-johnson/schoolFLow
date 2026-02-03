'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Check, X, UserPlus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '../../../convex/_generated/dataModel';
import { AssignTeacherDialog } from './assign-teacher-dialog';
import { ConflictBadge } from './conflict-badge';
import { convertTo12Hour } from '@/lib/timeUtils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core';

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface Timetable {
  _id: Id<'timetables'>;
  classId: string;
  className: string;
  schoolId: string;
}

interface Period {
  _id: Id<'periods'>;
  timetableId: Id<'timetables'>;
  day: Day;
  periodName: string;
  startTime: string;
  endTime: string;
  periodType: 'class' | 'break';
  duration: number;
}

interface Assignment {
  _id: Id<'timetableAssignments'>;
  periodId: Id<'periods'>;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  subjectColor?: string;
}

interface Teacher {
  _id: Id<'teachers'>;
  teacherId: string;
  firstName: string;
  lastName: string;
}

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

interface TimetableViewProps {
  timetables: Timetable[];
  classId: string;
  className: string;
  schoolId: string;
  teachers: Teacher[];
  onDelete: (timetableId: Id<'timetables'>) => void;
}

export function TimetableView({
  timetables,
  classId,
  className,
  schoolId,
  teachers,
  onDelete,
}: TimetableViewProps): React.JSX.Element {
  const updatePeriod = useMutation(api.timetables.updatePeriod);
  const removeAssignment = useMutation(api.timetables.removeAssignment);
  const swapPeriods = useMutation(api.timetables.swapPeriodAssignments);

  const [editingPeriod, setEditingPeriod] = useState<Id<'periods'> | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [showAssignDialog, setShowAssignDialog] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedTimetableId, setSelectedTimetableId] = useState<Id<'timetables'> | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [activePeriodId, setActivePeriodId] = useState<Id<'periods'> | null>(null);
  const [draggedAssignment, setDraggedAssignment] = useState<Assignment | null>(null);

  // Get the first (and only) timetable for this class
  const timetable = timetables[0];

  // Load periods and assignments
  const timetableDataResponse = useQuery(
    api.timetables.getTimetable,
    timetable ? { timetableId: timetable._id } : 'skip'
  );
  const assignmentsData = useQuery(
    api.timetables.getAssignments,
    timetable ? { timetableId: timetable._id } : 'skip'
  );

  // Load conflicts
  const conflicts = useQuery(
    api.timetableConflicts.checkTimetableConflicts,
    timetable ? { timetableId: timetable._id, schoolId } : 'skip'
  ) as Conflict[] | undefined;

  const periodsByDay = timetableDataResponse?.periodsByDay;
  const assignments = assignmentsData || [];

  // Get unique period names (rows) from Monday's schedule
  const periodRows = useMemo(() => {
    if (!periodsByDay?.monday) return [];
    
    // Sort by start time
    return [...periodsByDay.monday].sort((a, b) => {
      const aTime = parseInt(a.startTime.replace(':', ''));
      const bTime = parseInt(b.startTime.replace(':', ''));
      return aTime - bTime;
    });
  }, [periodsByDay]);

  // Days of week in order
  const daysOfWeek: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  const handleEditPeriod = (period: Period): void => {
    setEditingPeriod(period._id);
    setEditStartTime(period.startTime);
    setEditEndTime(period.endTime);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingPeriod) return;

    try {
      await updatePeriod({
        periodId: editingPeriod,
        startTime: editStartTime,
        endTime: editEndTime,
      });

      toast.success('Period time updated successfully');
      setEditingPeriod(null);
    } catch (error) {
      toast.error('Failed to update period time');
      console.error('Update period error:', error);
    }
  };

  const handleCancelEdit = (): void => {
    setEditingPeriod(null);
    setEditStartTime('');
    setEditEndTime('');
  };

  const handleAssignTeacher = (period: Period, timetableId: Id<'timetables'>, day: Day): void => {
    setSelectedPeriod(period);
    setSelectedTimetableId(timetableId);
    setSelectedDay(day);
    setShowAssignDialog(true);
  };

  const handleRemoveAssignment = async (periodId: Id<'periods'>): Promise<void> => {
    try {
      await removeAssignment({ periodId });
      toast.success('Teacher assignment removed');
    } catch (error) {
      toast.error('Failed to remove assignment');
      console.error('Remove assignment error:', error);
    }
  };

  const getAssignmentForPeriod = (periodId: Id<'periods'>): Assignment | undefined => {
    return assignments.find(a => a.periodId === periodId);
  };

  const getPeriodForDayAndName = (day: Day, periodName: string): Period | undefined => {
    return periodsByDay?.[day]?.find(p => p.periodName === periodName);
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent): void => {
    const periodId = event.active.id as Id<'periods'>;
    setActivePeriodId(periodId);
    
    const assignment = getAssignmentForPeriod(periodId);
    if (assignment) {
      setDraggedAssignment(assignment);
    }
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    
    setActivePeriodId(null);
    setDraggedAssignment(null);

    if (!over || active.id === over.id) return;

    const sourcePeriodId = active.id as Id<'periods'>;
    const targetPeriodId = over.id as Id<'periods'>;

    try {
      await swapPeriods({
        periodId1: sourcePeriodId,
        periodId2: targetPeriodId,
      });
      toast.success('Assignments swapped successfully');
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Failed to swap assignments');
    }
  };

  if (!timetable || !periodsByDay) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-medium">Weekly Schedule</h4>
          {conflicts && conflicts.length > 0 && (
            <ConflictBadge conflicts={conflicts} />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(timetable._id)}
        >
          <Trash2 className="h-4 w-4 text-destructive mr-2" />
          Delete Timetable
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-md border overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-50 font-bold">Period / Time</TableHead>
              {daysOfWeek.map((day) => (
                <TableHead key={day} className="text-center font-bold capitalize min-w-45">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {periodRows.map((mondayPeriod) => {
              const isBreak = mondayPeriod.periodType === 'break';
              const isEditing = editingPeriod === mondayPeriod._id;

              return (
                <TableRow key={mondayPeriod.periodName}>
                  {/* Period Name & Time Column */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>{mondayPeriod.periodName}</span>
                        {isBreak && (
                          <Badge variant="outline" className="text-xs">
                            Break
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              type="time"
                              value={editStartTime}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditStartTime(e.target.value)}
                              className="h-7 w-24 text-xs"
                            />
                            <Input
                              type="time"
                              value={editEndTime}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditEndTime(e.target.value)}
                              className="h-7 w-24 text-xs"
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                                className="h-6 px-2"
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="h-6 px-2"
                              >
                                <X className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{convertTo12Hour(mondayPeriod.startTime)} - {convertTo12Hour(mondayPeriod.endTime)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPeriod(mondayPeriod)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Day Columns */}
                  {daysOfWeek.map((day) => {
                    const period = getPeriodForDayAndName(day, mondayPeriod.periodName);
                    if (!period) {
                      return <TableCell key={day} className="text-center">-</TableCell>;
                    }

                    const assignment = getAssignmentForPeriod(period._id);

                    if (isBreak) {
                      return (
                        <TableCell key={day} className="text-center bg-muted/30">
                          <span className="text-xs text-muted-foreground">-</span>
                        </TableCell>
                      );
                    }

                    // Helper function to lighten a color for better contrast
                    const lightenColor = (color: string | undefined): string => {
                      if (!color) return 'transparent';
                      // Convert hex to RGB and lighten by 40%
                      const hex = color.replace('#', '');
                      const r = parseInt(hex.substring(0, 2), 16);
                      const g = parseInt(hex.substring(2, 4), 16);
                      const b = parseInt(hex.substring(4, 6), 16);
                      const lightenAmount = 0.6;
                      const newR = Math.round(r + (255 - r) * lightenAmount);
                      const newG = Math.round(g + (255 - g) * lightenAmount);
                      const newB = Math.round(b + (255 - b) * lightenAmount);
                      return `rgb(${newR}, ${newG}, ${newB})`;
                    };

                    return (
                      <TableCell 
                        key={day} 
                        className="p-2"
                        style={{
                          backgroundColor: assignment?.subjectColor ? lightenColor(assignment.subjectColor) : 'transparent',
                        }}
                      >
                        {assignment ? (
                          <div 
                            className="flex flex-col gap-1 cursor-move hover:ring-2 hover:ring-primary/50 rounded p-1"
                            draggable
                            onDragStart={() => {
                              setActivePeriodId(period._id);
                              setDraggedAssignment(assignment);
                            }}
                            onDragEnd={() => {
                              setActivePeriodId(null);
                              setDraggedAssignment(null);
                            }}
                            onDragOver={(e: React.DragEvent) => e.preventDefault()}
                            onDrop={async (e: React.DragEvent) => {
                              e.preventDefault();
                              if (activePeriodId && activePeriodId !== period._id) {
                                try {
                                  await swapPeriods({
                                    periodId1: activePeriodId,
                                    periodId2: period._id,
                                  });
                                  toast.success('Assignments swapped');
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                } catch (error) {
                                  toast.error('Failed to swap');
                                }
                              }
                            }}
                          >
                            <div className="text-sm font-medium flex items-center gap-2">
                              <GripVertical className="h-3 w-3 text-muted-foreground" />
                              {assignment.subjectColor && (
                                <div 
                                  className="w-3 h-3 rounded-full border border-gray-300" 
                                  style={{ backgroundColor: assignment.subjectColor }}
                                />
                              )}
                              {assignment.subjectName}
                            </div>
                            <div className="text-xs text-muted-foreground">{assignment.teacherName}</div>
                            <div className="flex gap-1 mt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAssignTeacher(period, timetable._id, day)}
                                className="h-6 text-xs px-2"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(period._id)}
                                className="h-6 px-2"
                              >
                                <X className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignTeacher(period, timetable._id, day)}
                            className="w-full h-auto py-2"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>

        <DragOverlay>
          {draggedAssignment && (
            <div className="bg-white border-2 border-primary rounded p-2 shadow-lg">
              <div className="text-sm font-medium">{draggedAssignment.subjectName}</div>
              <div className="text-xs text-muted-foreground">{draggedAssignment.teacherName}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Assign Teacher Dialog */}
      {selectedPeriod && selectedTimetableId && selectedDay && (
        <AssignTeacherDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          period={selectedPeriod}
          timetableId={selectedTimetableId}
          classId={classId}
          className={className}
          day={selectedDay}
          schoolId={schoolId}
          teachers={teachers}
        />
      )}
    </div>
  );
}
