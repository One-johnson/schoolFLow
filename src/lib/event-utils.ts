// Event utility functions

export function getEventTypeColor(eventType: string): string {
  const colors: Record<string, string> = {
    holiday: '#10b981', // Green
    exam: '#ef4444', // Red
    sports: '#3b82f6', // Blue
    parent_meeting: '#f59e0b', // Amber
    assembly: '#8b5cf6', // Purple
    cultural: '#ec4899', // Pink
    field_trip: '#06b6d4', // Cyan
    workshop: '#84cc16', // Lime
    other: '#6b7280', // Gray
  };
  return colors[eventType] || colors.other;
}

export function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    holiday: 'Holiday',
    exam: 'Exam',
    sports: 'Sports Day',
    parent_meeting: 'Parent Meeting',
    assembly: 'Assembly',
    cultural: 'Cultural Event',
    field_trip: 'Field Trip',
    workshop: 'Workshop',
    other: 'Other',
  };
  return labels[eventType] || 'Other';
}

export function getVenueTypeLabel(venueType: string): string {
  const labels: Record<string, string> = {
    on_campus: 'On Campus',
    off_campus: 'Off Campus',
    virtual: 'Virtual',
  };
  return labels[venueType] || 'Unknown';
}

export function getAudienceTypeLabel(audienceType: string): string {
  const labels: Record<string, string> = {
    all_school: 'All School',
    specific_classes: 'Specific Classes',
    specific_departments: 'Specific Departments',
    staff_only: 'Staff Only',
    custom: 'Custom',
  };
  return labels[audienceType] || 'Unknown';
}

export function getDepartmentLabel(department: string): string {
  const labels: Record<string, string> = {
    creche: 'Creche',
    kindergarten: 'Kindergarten',
    primary: 'Primary',
    junior_high: 'Junior High',
  };
  return labels[department] || department;
}

export function formatEventDate(date: string, time?: string): string {
  const d = new Date(date);
  const formattedDate = d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (time) {
    return `${formattedDate} at ${time}`;
  }

  return formattedDate;
}

export function formatEventDateRange(startDate: string, endDate: string, isAllDay: boolean, startTime?: string, endTime?: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const isSameDay = start.toDateString() === end.toDateString();

  if (isSameDay) {
    const formattedDate = start.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (isAllDay) {
      return formattedDate;
    }

    return `${formattedDate}, ${startTime || ''} - ${endTime || ''}`;
  }

  const formattedStart = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const formattedEnd = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${formattedStart} - ${formattedEnd}`;
}

export function getRecurrencePatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    termly: 'Every Term',
    yearly: 'Yearly',
  };
  return labels[pattern] || 'Custom';
}

export function getDayLabel(day: string): string {
  const labels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };
  return labels[day] || day;
}

export function isEventUpcoming(startDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  return start > now;
}

export function isEventOngoing(startDate: string, endDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

export function isEventCompleted(endDate: string): boolean {
  const now = new Date();
  const end = new Date(endDate);
  return now > end;
}
