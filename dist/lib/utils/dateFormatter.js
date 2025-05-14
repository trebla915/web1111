"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToMountainTime = convertToMountainTime;
exports.formatDate = formatDate;
exports.formatToMMDDYYYY = formatToMMDDYYYY;
exports.getDayOfWeek = getDayOfWeek;
exports.isDateInFuture = isDateInFuture;
exports.filterFutureEvents = filterFutureEvents;
exports.sortEventsByDate = sortEventsByDate;
/**
 * Convert UTC date string to Mountain Time
 * @param dateStr Date string in ISO format
 * @returns Date object in Mountain Time
 */
function convertToMountainTime(dateStr) {
    const utcDate = new Date(dateStr);
    return new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/Denver' }));
}
/**
 * Format date string to display format
 * @param dateStr Date string in ISO format
 * @returns Formatted date string
 */
function formatDate(dateStr) {
    if (!dateStr)
        return 'Date TBA';
    try {
        // Parse the ISO string directly
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Create date object using the parsed components
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime()))
            return 'Invalid date';
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}
/**
 * Format date string to MM/DD/YYYY format
 * @param dateStr Date string in ISO format
 * @returns Formatted date string
 */
function formatToMMDDYYYY(dateStr) {
    if (!dateStr)
        return 'Date TBA';
    try {
        // Parse the ISO string directly
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Create date object using the parsed components
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime()))
            return 'Invalid date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    }
    catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}
/**
 * Get day of week from date string
 * @param dateStr Date string in ISO format
 * @returns Day of week
 */
function getDayOfWeek(dateStr) {
    if (!dateStr)
        return 'TBA';
    try {
        // Parse the ISO string directly
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Create date object using the parsed components
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime()))
            return 'Invalid date';
        return date.toLocaleString('en-US', {
            weekday: 'long'
        });
    }
    catch (error) {
        console.error('Error getting day of week:', error);
        return 'Invalid date';
    }
}
/**
 * Check if date is in the future
 * @param dateStr Date string in ISO format
 * @returns Boolean indicating if date is in the future
 */
function isDateInFuture(dateStr) {
    try {
        if (!dateStr)
            return false;
        // Parse the ISO string directly
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Create date object using the parsed components
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime()))
            return false;
        const now = new Date();
        // Set time to start of day for comparison
        now.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date >= now; // Changed to >= to include today's events
    }
    catch (error) {
        console.error('Error checking if date is in future:', error);
        return false;
    }
}
/**
 * Filter an array of events to include only future events
 * @param events Array of events with date properties
 * @returns Filtered array with only future events
 */
function filterFutureEvents(events) {
    return events.filter(event => {
        if (!event.date)
            return false;
        return isDateInFuture(event.date);
    });
}
/**
 * Sort events by date in ascending order (closest upcoming dates first)
 * @param events Array of events with date properties
 * @returns Sorted array with closest upcoming events first
 */
function sortEventsByDate(events) {
    return [...events].sort((a, b) => {
        if (!a.date)
            return 1;
        if (!b.date)
            return -1;
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
    });
}
