/**
 * Convert datetime-local string to ISO string in Thailand timezone
 * datetime-local format: "2026-02-11T14:30" (no timezone info)
 * Returns ISO string that represents the same moment in Thailand time
 */
export function convertLocalToThailandISO(datetimeLocal: string): string {
    // Parse the datetime-local string
    // Important: We interpret this as Thailand time, not UTC
    const [datePart, timePart] = datetimeLocal.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)

    // Create date object with Thailand timezone
    // We'll create the date in UTC then subtract 7 hours
    // So Thailand 14:00 becomes 07:00 UTC
    const date = new Date(Date.UTC(year, month - 1, day, hour - 7, minute))

    return date.toISOString()
}

/**
 * Format timestamp to Thai date-time string
 */
export function formatThaiDateTime(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

    return date.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }) + ' น.'
}
