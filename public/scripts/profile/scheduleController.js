// scheduleController.js

class ScheduleController {
    constructor(availability = {}) {
        this.availability = availability; // { monday: [{ start: '09:00', end: '12:00' }, ...], ... }
        this.scheduledDates = []; // [{ date: '2025-05-23T10:00', notes: 'Meeting with John' }, ...]
    }

    setAvailability(availability) {
        this.availability = availability;
    }

    getAvailability() {
        return this.availability;
    }

    getHumanReadableAvailability() {
        return Object.entries(this.availability).map(([day, ranges]) => {
            const rangeText = ranges.map(r => `${r.start} - ${r.end}`).join(', ');
            return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${rangeText}`;
        }).join('\n');
    }

    isAvailable(dateTimeStr) {
        const date = new Date(dateTimeStr);
        const day = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const time = date.toTimeString().substring(0, 5); // 'HH:MM'

        const ranges = this.availability[day] || [];
        return ranges.some(r => r.start <= time && time < r.end);
    }

    schedule(dateTimeStr, notes = '') {
        if (!this.isAvailable(dateTimeStr)) {
            throw new Error('Selected time is not available');
        }
        this.scheduledDates.push({ date: dateTimeStr, notes });
        return true;
    }

    getScheduled() {
        return this.scheduledDates;
    }
}

module.exports = ScheduleController;