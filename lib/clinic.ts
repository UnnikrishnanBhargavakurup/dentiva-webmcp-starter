export const CLINIC_TIMEZONE = "Europe/London";
export const BOOKING_WINDOW_DAYS = 28;

export const services = [
  {
    id: "checkup",
    name: "Routine check-up",
    duration: 30,
    description:
      "A fresh start for your smile. A simple visit to get to know your teeth.",
    tag: "A good place to start",
    icon: "tooth",
  },
  {
    id: "cleaning",
    name: "Clean & polish",
    duration: 60,
    description:
      "A little refresh. Give your teeth that just-cleaned, ready-to-smile feeling.",
    tag: "Your smile, refreshed",
    icon: "sparkle",
  },
  {
    id: "consultation",
    name: "Smile consultation",
    duration: 45,
    description:
      "Let's talk about your smile. Time for your questions and a plan that fits.",
    tag: "Let's make a plan",
    icon: "smile",
  },
] as const;

export type ServiceId = (typeof services)[number]["id"];
export type Slot = { time: string; label: string };
export type Booking = {
  id: string;
  reference: string;
  serviceId: ServiceId;
  date: string;
  time: string;
  name: string;
  email: string;
  createdAt: string;
};
export type BookingInput = {
  serviceId: ServiceId;
  date: string;
  time: string;
  name: string;
  email: string;
  operationId: string;
};
export type Availability = {
  date: string;
  serviceId: ServiceId;
  slots: Slot[];
  timezone: string;
  today: string;
  lastDate: string;
};

export function getService(id: string) {
  return services.find((service) => service.id === id);
}

export function clinicToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

export function isBookableDate(date: string, today: string): boolean {
  return (
    validDate(date) &&
    date >= today &&
    date <= addDays(today, BOOKING_WINDOW_DAYS) &&
    new Date(`${date}T12:00:00Z`).getUTCDay() !== 0
  );
}

export function firstBookingDate(today: string): string {
  const tomorrow = addDays(today, 1);
  return new Date(`${tomorrow}T12:00:00Z`).getUTCDay() === 0
    ? addDays(tomorrow, 1)
    : tomorrow;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function candidateTimes(
  date: string,
  serviceId: ServiceId,
  now = new Date(),
): string[] {
  const today = clinicToday(now);
  const service = getService(serviceId);
  if (!service || !isBookableDate(date, today)) return [];
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const currentMinute =
    Number(parts.find((p) => p.type === "hour")!.value) * 60 +
    Number(parts.find((p) => p.type === "minute")!.value);
  const times: string[] = [];
  for (let start = 9 * 60; start + service.duration <= 17 * 60; start += 30) {
    if (start < 13 * 60 + 30 && start + service.duration > 12 * 60 + 30)
      continue;
    if (date === today && start <= currentMinute) continue;
    times.push(
      `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`,
    );
  }
  return times;
}

export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
