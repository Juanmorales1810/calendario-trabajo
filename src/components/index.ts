'use client';

// Component exports
export { AgendaView } from './agenda-view';
export { CalendarDndProvider, useCalendarDnd } from './calendar-dnd-context';
export { EventGap, EventHeight, WeekCellsHeight, AgendaDaysToShow } from './constants';
export { DayView } from './day-view';
export { DraggableEvent } from './draggable-event';
export { DroppableCell } from './droppable-cell';
export { EventCalendar } from './event-calendar';
export { EventDialog } from './event-dialog';
export { EventItem } from './event-item';
export { EventsPopup } from './events-popup';
// Hook exports
export { useCurrentTimeIndicator } from './use-current-time-indicator';
export { useEventVisibility } from './use-event-visibility';
export { MonthView } from './month-view';
// Type exports
export type { CalendarEvent, CalendarView, EventColor } from './types';
export { addHoursToDate, getEventColorClasses } from './utils';
export { WeekView } from './week-view';
