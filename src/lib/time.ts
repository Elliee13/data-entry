import { endOfWeek, startOfWeek, subWeeks } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE, BUSINESS_WEEK_STARTS_ON } from "@/lib/constants";

type BusinessWeek = {
  weekKey: string;
  weekStartsAt: Date;
  weekEndsAt: Date;
  weekStartLabel: string;
  weekEndLabel: string;
};

function zonedDateFromLocalDate(dateString: string) {
  return toZonedTime(fromZonedTime(`${dateString}T12:00:00`, APP_TIMEZONE), APP_TIMEZONE);
}

export function formatDateForDisplay(date: Date | string) {
  const target = typeof date === "string" ? fromZonedTime(`${date}T12:00:00`, APP_TIMEZONE) : date;
  return formatInTimeZone(target, APP_TIMEZONE, "MMM d, yyyy");
}

export function getCurrentBusinessDateKey(now = new Date()) {
  return formatInTimeZone(now, APP_TIMEZONE, "yyyy-MM-dd");
}

export function getBusinessWeekForDate(input: Date | string): BusinessWeek {
  const zonedDate = typeof input === "string" ? zonedDateFromLocalDate(input) : toZonedTime(input, APP_TIMEZONE);
  const weekStartLocal = startOfWeek(zonedDate, { weekStartsOn: BUSINESS_WEEK_STARTS_ON });
  const weekEndLocal = endOfWeek(zonedDate, { weekStartsOn: BUSINESS_WEEK_STARTS_ON });

  const weekStartWallClock = new Date(weekStartLocal);
  weekStartWallClock.setHours(0, 0, 0, 0);

  const weekEndWallClock = new Date(weekEndLocal);
  weekEndWallClock.setHours(23, 59, 59, 999);

  const weekStartsAt = fromZonedTime(weekStartWallClock, APP_TIMEZONE);
  const weekEndsAt = fromZonedTime(weekEndWallClock, APP_TIMEZONE);

  return {
    weekKey: formatInTimeZone(weekStartsAt, APP_TIMEZONE, "yyyy-MM-dd"),
    weekStartsAt,
    weekEndsAt,
    weekStartLabel: formatInTimeZone(weekStartsAt, APP_TIMEZONE, "MMM d, yyyy"),
    weekEndLabel: formatInTimeZone(weekEndsAt, APP_TIMEZONE, "MMM d, yyyy"),
  };
}

export function getCurrentBusinessWeek(now = new Date()) {
  return getBusinessWeekForDate(now);
}

export function getPreviousBusinessWeek(now = new Date()) {
  const currentLocal = toZonedTime(now, APP_TIMEZONE);
  return getBusinessWeekForDate(subWeeks(currentLocal, 1));
}

export function isCurrentBusinessWeek(dateString: string, now = new Date()) {
  return getBusinessWeekForDate(dateString).weekKey === getCurrentBusinessWeek(now).weekKey;
}

export function isCronDue(now = new Date()) {
  return formatInTimeZone(now, APP_TIMEZONE, "i") === "1";
}

export function getWeeklyReportEmailSubject(week: BusinessWeek) {
  return `Weekly Report: ${week.weekStartLabel} - ${week.weekEndLabel}`;
}
