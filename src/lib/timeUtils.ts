/**
 * Time utility functions for converting between 24-hour and 12-hour formats
 */

/**
 * Converts 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "14:30")
 * @returns Time in 12-hour format (e.g., "2:30 PM")
 */
export function convertTo12Hour(time24: string): string {
  const [hours24, minutes] = time24.split(':').map(Number);
  
  if (isNaN(hours24) || isNaN(minutes)) {
    return time24;
  }
  
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Converts 12-hour time format to 24-hour format
 * @param time12 - Time in 12-hour format (e.g., "2:30 PM")
 * @returns Time in 24-hour format (e.g., "14:30")
 */
export function convertTo24Hour(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  
  if (!match) {
    return time12;
  }
  
  const [, hoursStr, minutesStr, period] = match;
  let hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr);
  
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats a time range in 12-hour format
 * @param startTime24 - Start time in 24-hour format
 * @param endTime24 - End time in 24-hour format
 * @returns Formatted time range (e.g., "8:00 AM - 9:10 AM")
 */
export function formatTimeRange(startTime24: string, endTime24: string): string {
  return `${convertTo12Hour(startTime24)} - ${convertTo12Hour(endTime24)}`;
}
