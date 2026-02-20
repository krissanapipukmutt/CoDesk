import { DateTime } from 'luxon';
import { BANGKOK_TZ } from '../lib/tz';
import { segmentByDay } from '../lib/range';
import {
  Booking,
  ReportBookingsPerDay,
  ReportPeakTimes,
  ReportPopularSeats,
  ReportStatusSummary,
  ReportUtilization,
  Seat
} from './types';

const toLocalDate = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(BANGKOK_TZ).toISODate()!;

export const buildBookingsPerDay = (bookings: Booking[]): ReportBookingsPerDay[] => {
  const map = new Map<string, ReportBookingsPerDay>();
  bookings.forEach((b) => {
    const days = segmentByDay(b.startAt, b.endAt).map((s) => s.date);
    days.forEach((d) => {
      const key = `${b.officeId}:${b.departmentId}:${d}`;
      const row = map.get(key) ?? {
        office_id: b.officeId,
        department_id: b.departmentId,
        local_date: d,
        total_bookings: 0,
        confirmed_bookings: 0,
        cancelled_bookings: 0
      };
      row.total_bookings += 1;
      if (b.status === 'CONFIRMED') row.confirmed_bookings += 1;
      if (b.status === 'CANCELLED') row.cancelled_bookings += 1;
      map.set(key, row);
    });
  });
  return [...map.values()];
};

export const buildStatusSummary = (bookings: Booking[]): ReportStatusSummary[] => {
  const map = new Map<string, ReportStatusSummary>();
  bookings.forEach((b) => {
    const days = segmentByDay(b.startAt, b.endAt).map((s) => s.date);
    days.forEach((d) => {
      const key = `${b.officeId}:${b.departmentId}:${d}:${b.status}`;
      const row = map.get(key) ?? {
        office_id: b.officeId,
        department_id: b.departmentId,
        local_date: d,
        status: b.status,
        booking_count: 0
      };
      row.booking_count += 1;
      map.set(key, row);
    });
  });
  return [...map.values()];
};

export const buildPopularSeats = (bookings: Booking[], seats: Seat[]): ReportPopularSeats[] => {
  const map = new Map<string, ReportPopularSeats>();
  const seatMap = new Map(seats.map((s) => [s.id, s]));

  bookings
    .filter((b) => b.status === 'CONFIRMED' && b.seatId)
    .forEach((b) => {
      const segments = segmentByDay(b.startAt, b.endAt);
      segments.forEach((seg) => {
        const key = `${b.officeId}:${b.departmentId}:${seg.date}:${b.seatId}`;
        const row = map.get(key) ?? {
          office_id: b.officeId,
          department_id: b.departmentId,
          local_date: seg.date,
          seat_id: b.seatId!,
          seat_code: seatMap.get(b.seatId!)?.seatCode ?? '-',
          booking_count: 0,
          booked_minutes: 0
        };
        row.booking_count += 1;
        row.booked_minutes += seg.end.diff(seg.start, 'minutes').minutes;
        map.set(key, row);
      });
    });

  return [...map.values()];
};

export const buildUtilization = (bookings: Booking[], seats: Seat[]): ReportUtilization[] => {
  const seatCountMap = new Map<string, number>();
  seats
    .filter((s) => s.isActive && s.isBookable)
    .forEach((s) => {
      const key = `${s.officeId}:${s.departmentId}`;
      seatCountMap.set(key, (seatCountMap.get(key) ?? 0) + 1);
    });

  const map = new Map<string, ReportUtilization>();
  bookings
    .filter((b) => b.status === 'CONFIRMED')
    .forEach((b) => {
      segmentByDay(b.startAt, b.endAt).forEach((seg) => {
        const key = `${b.officeId}:${b.departmentId}:${seg.date}`;
        const seatCount = seatCountMap.get(`${b.officeId}:${b.departmentId}`) ?? 0;
        const row = map.get(key) ?? {
          office_id: b.officeId,
          department_id: b.departmentId,
        local_date: seg.date,
        booked_minutes: 0,
        capacity_minutes: seatCount * 1440,
        utilization_pct: 0
      };
        row.booked_minutes += seg.end.diff(seg.start, 'minutes').minutes;
        row.utilization_pct = row.capacity_minutes
          ? Math.round((row.booked_minutes / row.capacity_minutes) * 10000) / 100
          : 0;
        map.set(key, row);
      });
    });

  return [...map.values()];
};

export const buildPeakTimes = (bookings: Booking[]): ReportPeakTimes[] => {
  const rows: ReportPeakTimes[] = [];
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
  confirmed.forEach((b) => {
    const start = DateTime.fromISO(b.startAt, { zone: 'utc' }).setZone(BANGKOK_TZ).startOf('day');
    const end = DateTime.fromISO(b.endAt, { zone: 'utc' }).setZone(BANGKOK_TZ).endOf('day');
    let cursor = start;
    while (cursor <= end) {
      const slotStart = cursor;
      const slotEnd = cursor.plus({ minutes: 30 });
      const slotStartUtc = slotStart.toUTC().toISO()!;
      const slotEndUtc = slotEnd.toUTC().toISO()!;
      const concurrent = confirmed.filter((bb) => bb.startAt < slotEndUtc && bb.endAt > slotStartUtc).length;
      rows.push({
        office_id: b.officeId,
        department_id: b.departmentId,
        local_date: slotStart.toISODate()!,
        slot_start_local: slotStart.toISO() ?? '',
        slot_end_local: slotEnd.toISO() ?? '',
        concurrent_bookings: concurrent
      });
      cursor = cursor.plus({ minutes: 30 });
    }
  });
  return rows;
};
