// Global daily rows are keyed by UTC day, whatever timezone the process runs in
export const utcDay = (date: Date): string => new Date(date).toISOString().slice(0, 10);
