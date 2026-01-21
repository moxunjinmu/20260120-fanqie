export const pad = (value: number) => value.toString().padStart(2, "0");

export const formatSeconds = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${pad(mins)}:${pad(secs)}`;
};

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, offset: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + offset);
  return copy;
};

export const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const minutesToSeconds = (minutes: number) => Math.max(0, Math.round(minutes * 60));
