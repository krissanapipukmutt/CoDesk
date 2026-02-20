import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import Calendar from '../components/Calendar';
import { EmptyState, LoadingState } from '../components/State';
import { useRepo } from '../data/repo';
import { Booking, BookingType, DepartmentStrategy, Employee, CreateBookingInput } from '../data/types';
import { bookingSchema } from '../lib/validators';
import { parseLocalDateTimeToUtc } from '../lib/tz';
import { mapErrorCodeToMessage, parseErrorCode } from '../lib/errors';
import { remainingCapacityForDay } from '../lib/availability';
import { segmentByDay } from '../lib/range';
import {
  formatThaiBuddhistDate,
  formatThaiTime24,
  splitLocalDateTime,
  toLocalDateTimeInput,
  toLocalDateTimeInputFromUtc
} from '../lib/date';

const BookingPage = () => {
  const { repo, profile } = useRepo();
  const { data: offices = [], isLoading: loadingOffices } = useQuery({
    queryKey: ['offices'],
    queryFn: () => repo.listOffices()
  });
  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => repo.listDepartments()
  });
  const { data: seats = [], isLoading: loadingSeats } = useQuery({
    queryKey: ['seats'],
    queryFn: () => repo.listSeats()
  });
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => repo.listEmployees()
  });
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => repo.listBookings()
  });
  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => repo.listHolidays()
  });

  const todayIso = DateTime.now().setZone('Asia/Bangkok').toISODate()!;
  const defaultStartTime = '09:00';
  const defaultEndTime = '18:00';
  const [officeId, setOfficeId] = useState(profile?.officeId ?? '');
  const [departmentId, setDepartmentId] = useState(profile?.departmentId ?? '');
  const bookingType: BookingType = 'SINGLE_DAY';
  const [startDateTimeLocal, setStartDateTimeLocal] = useState(
    toLocalDateTimeInput(todayIso, defaultStartTime)
  );
  const [endDateTimeLocal, setEndDateTimeLocal] = useState(
    toLocalDateTimeInput(todayIso, defaultEndTime)
  );
  const [employeeId, setEmployeeId] = useState(profile?.employeeId ?? '');
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [calendarMonthIso, setCalendarMonthIso] = useState(
    DateTime.fromISO(todayIso, { zone: 'Asia/Bangkok' }).startOf('month').toISODate()!
  );
  const calendarMonthLabel = DateTime.fromISO(calendarMonthIso, { zone: 'Asia/Bangkok' }).toFormat('LLLL yyyy');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [message, setMessage] = useState('');
  const isEmployee = profile?.role === 'employee';
  const isAdmin = profile?.role === 'admin';
  const shouldScope = !isAdmin && !!profile;
  const scopedOfficeId = shouldScope ? profile!.officeId : officeId;
  const scopedDepartmentId = shouldScope ? profile!.departmentId : departmentId;
  const department = departments.find((d) => d.id === scopedDepartmentId);
  const strategy: DepartmentStrategy | undefined = department?.strategy;

  useEffect(() => {
    if (bookingType === 'SINGLE_DAY') {
      const startParts = splitLocalDateTime(startDateTimeLocal);
      if (startParts) {
        const endTime = splitLocalDateTime(endDateTimeLocal)?.time ?? defaultEndTime;
        setEndDateTimeLocal(toLocalDateTimeInput(startParts.date, endTime));
      }
    }
  }, [startDateTimeLocal, endDateTimeLocal]);

  useEffect(() => {
    const startParts = splitLocalDateTime(startDateTimeLocal);
    const endParts = splitLocalDateTime(endDateTimeLocal);
    if (!startParts || !endParts) return;
    const startDateObj = DateTime.fromISO(startParts.date, { zone: 'Asia/Bangkok' });
    const endDateObj = DateTime.fromISO(endParts.date, { zone: 'Asia/Bangkok' });
    const needsAlign =
      (bookingType === 'SINGLE_DAY' && startParts.date !== endParts.date) ||
      endDateObj < startDateObj ||
      endDateObj.year !== startDateObj.year;
    if (needsAlign) {
      const next = toLocalDateTimeInput(startParts.date, endParts.time);
      if (next !== endDateTimeLocal) {
        setEndDateTimeLocal(next);
      }
    }
  }, [startDateTimeLocal, endDateTimeLocal]);

useEffect(() => {
}, [strategy]);

useEffect(() => {
  if (!profile) return;
  if (profile.role === 'employee' || profile.role === 'hr') {
    setOfficeId(profile.officeId);
    setDepartmentId(profile.departmentId);
  }
  if (profile.employeeId) {
    setEmployeeId(profile.employeeId);
  }
}, [profile]);

useEffect(() => {
  if (!isAdmin) return;
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp) return;
  const dept = departments.find((d) => d.id === emp.departmentId);
  if (dept) {
    setDepartmentId(dept.id);
    setOfficeId(dept.officeId);
  }
}, [employeeId, isAdmin, employees, departments]);

  const visibleOffices = shouldScope ? offices.filter((o) => o.id === scopedOfficeId) : offices;
  const visibleDepartments = shouldScope ? departments.filter((d) => d.id === scopedDepartmentId) : departments;
  const filteredSeats = seats.filter((s) => s.departmentId === scopedDepartmentId && s.officeId === scopedOfficeId);
  const seatId: null = null;
  const deptEmployees = employees.filter((e) => e.departmentId === scopedDepartmentId);
  const filteredEmployees = isAdmin ? employees : deptEmployees.filter((e) => e.id === profile?.employeeId);

  const filteredBookings = useMemo(() => {
    if (profile?.role === 'employee' || profile?.role === 'hr') {
      return bookings.filter(
        (b) => b.departmentId === profile.departmentId && b.officeId === profile.officeId
      );
    }
    if (scopedDepartmentId) {
      return bookings.filter((b) => b.departmentId === scopedDepartmentId && b.officeId === scopedOfficeId);
    }
    return bookings;
  }, [bookings, profile, scopedDepartmentId, scopedOfficeId]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);
  const showNamesInCalendar = true;

  const availabilityMap = useMemo(() => {
    const map: Record<string, { date: string; bookings: number; remaining?: number; tooltip?: string; isMine?: boolean }> =
      {};
    const seatCount = filteredSeats.filter((s) => s.isActive && s.isBookable).length;
    const departmentCapacity =
      departments.find((d) => d.id === scopedDepartmentId)?.dailyCapacity ?? null;
    const capacityBase = departmentCapacity && departmentCapacity > 0 ? departmentCapacity : seatCount;
    const confirmed = filteredBookings.filter((b) => b.status === 'CONFIRMED');

    confirmed.forEach((b) => {
      segmentByDay(b.startAt, b.endAt).forEach((seg) => {
        const key = seg.date;
        const isMine = profile?.employeeId === b.employeeId;
        map[key] = map[key] ?? { date: key, bookings: 0, tooltip: '', isMine: false };
        map[key].bookings += 1;
        if (showNamesInCalendar) {
          const name = employeeMap.get(b.employeeId)?.name ?? '';
          map[key].tooltip = [map[key].tooltip, name].filter(Boolean).join(', ');
        }
        if (isMine) map[key].isMine = true;
      });
    });

    Object.keys(map).forEach((date) => {
      const remaining = remainingCapacityForDay(
        confirmed.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
        capacityBase,
        date
      );
      map[date].remaining = remaining;
    });

    return map;
  }, [filteredBookings, filteredSeats, strategy, employeeMap, showNamesInCalendar, departments, scopedDepartmentId]);

  const bookingMutation = useMutation<unknown, Error, CreateBookingInput>({
    mutationFn: (input) => repo.createBooking(input),
    onSuccess: () => {
      setMessage('บันทึกการจองเรียบร้อย');
      setEditing(null);
    },
    onError: (err: any) => {
      const code = parseErrorCode(err?.message ?? err?.details ?? err?.error_description);
      setMessage(mapErrorCodeToMessage(code));
    }
  });

  const cancelMutation = useMutation<unknown, Error, { id: string; reason?: string | null }>({
    mutationFn: ({ id, reason }) => repo.cancelBooking(id, reason),
    onSuccess: () => setMessage('ยกเลิกการจองเรียบร้อย'),
    onError: (err: any) => {
      const code = parseErrorCode(err?.message ?? err?.details ?? err?.error_description);
      setMessage(mapErrorCodeToMessage(code));
    }
  });

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setMessage('');
    const effectiveOfficeId = isAdmin ? officeId : profile?.officeId ?? officeId;
    const effectiveDepartmentId = isAdmin ? departmentId : profile?.departmentId ?? departmentId;
    const effectiveEmployeeId = isEmployee ? profile?.employeeId ?? employeeId : employeeId;
    const startParts = splitLocalDateTime(startDateTimeLocal);
    const endParts = splitLocalDateTime(endDateTimeLocal);
    if (!startParts || !endParts) {
      setMessage('กรุณาระบุวันเวลาให้ครบถ้วน');
      return;
    }
    const daySpan =
      DateTime.fromISO(endParts.date, { zone: 'Asia/Bangkok' })
        .diff(DateTime.fromISO(startParts.date, { zone: 'Asia/Bangkok' }), 'days')
        .days + 1;
    if (daySpan > 60) {
      setMessage('ช่วงวันยาวเกิน 60 วัน กรุณาแบ่งการจองเป็นช่วงที่สั้นลง');
      return;
    }

    // Pre-check capacity per day using daily_capacity (or seat count fallback)
    const departmentCapacity =
      departments.find((d) => d.id === effectiveDepartmentId)?.dailyCapacity ?? null;
    const seatCount = filteredSeats.filter((s) => s.isActive && s.isBookable).length;
    const capacityBase = departmentCapacity && departmentCapacity > 0 ? departmentCapacity : seatCount;
    const confirmed = filteredBookings.filter((b) => b.status === 'CONFIRMED');
    const days = segmentByDay(startParts.date + 'T00:00:00', endParts.date + 'T23:59:59').map((seg) => seg.date);
    const overFull = days.some((d) => {
      const rem = remainingCapacityForDay(
        confirmed.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
        capacityBase,
        d
      );
      return rem <= 0;
    });
    if (overFull) {
      setMessage('วันดังกล่าวเต็มตามความจุที่ตั้งไว้');
      return;
    }
    const parsed = bookingSchema.safeParse({
      employeeId: effectiveEmployeeId,
      departmentId: effectiveDepartmentId,
      officeId: effectiveOfficeId,
      seatId: null,
      bookingType,
      startDate: startParts.date,
      startTime: startParts.time,
      endDate: endParts.date,
      endTime: endParts.time
    });
    if (!parsed.success) {
      setMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(startParts.time) || !timePattern.test(endParts.time)) {
      setMessage('กรุณาระบุเวลาเป็นรูปแบบ 24 ชั่วโมง (HH:mm)');
      return;
    }
    const startAt = parseLocalDateTimeToUtc(startParts.date, startParts.time);
    const endAt = parseLocalDateTimeToUtc(endParts.date, endParts.time);
    if (!startAt || !endAt) {
      setMessage('วันเวลาไม่ถูกต้อง');
      return;
    }
    try {
      if (editing) {
        await cancelMutation.mutateAsync({ id: editing.id, reason: 'แก้ไขการจอง' });
      }
      await bookingMutation.mutateAsync({
        employeeId: effectiveEmployeeId,
        departmentId: effectiveDepartmentId,
        officeId: effectiveOfficeId,
        seatId: null,
        bookingType,
        startAt,
        endAt
      });
    } catch (err: any) {
      const code = parseErrorCode(err?.message ?? err?.details ?? err?.error_description);
      setMessage(mapErrorCodeToMessage(code));
    }
  };

  const bookingForSelectedDate = filteredBookings.filter((b) =>
    segmentByDay(b.startAt, b.endAt).some((seg) => seg.date === selectedDate)
  );

  const holidayWarning = holidays.find((h) => h.holidayDate === selectedDate && h.isActive);

  if (loadingOffices || loadingDepartments || loadingSeats || loadingEmployees || loadingBookings) {
    return <LoadingState />;
  }

  if (!offices.length || !departments.length) {
    return <EmptyState label="ยังไม่มีสำนักงานหรือฝ่ายงาน" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="text-lg font-display mb-4">ฟอร์มจองเข้าออฟฟิศ</h2>
          {message && <div className="mb-4 rounded-xl bg-indigo/10 px-4 py-2 text-indigo text-sm">{message}</div>}
          {holidayWarning && holidayWarning.rule === 'WARNING' && (
            <div className="mb-4 rounded-xl bg-amber-100 px-4 py-2 text-amber-600 text-sm">
              {holidayWarning.name} (เตือนวันหยุด)
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="employeeId" className="text-sm text-slate-600">พนักงาน</label>
                <select
                  id="employeeId"
                  className="select"
                  value={isEmployee ? profile?.employeeId ?? employeeId : employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={isEmployee}
                >
                  {filteredEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">รูปแบบการจอง</label>
                <div className="select text-slate-500 bg-slate-50">Single Day</div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="text-sm text-slate-600">วันที่เริ่มต้น</label>
                <input
                  id="startDate"
                  className="input"
                  type="datetime-local"
                  value={startDateTimeLocal}
                  onChange={(e) => setStartDateTimeLocal(e.target.value)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  {formatThaiBuddhistDate(startDateTimeLocal)} {formatThaiTime24(startDateTimeLocal)}
                </div>
              </div>
              <div>
                <label htmlFor="officeId" className="text-sm text-slate-600">ออฟฟิศ</label>
                <select
                  id="officeId"
                  className="select"
                  value={scopedOfficeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  disabled
                >
                  {visibleOffices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="endDate" className="text-sm text-slate-600">วันที่สิ้นสุด</label>
                <input
                  id="endDate"
                  className="input"
                  type="datetime-local"
                  value={endDateTimeLocal}
                  onChange={(e) => setEndDateTimeLocal(e.target.value)}
                />
                <div className="text-xs text-slate-500 mt-1">
                  {formatThaiBuddhistDate(endDateTimeLocal)} {formatThaiTime24(endDateTimeLocal)}
                </div>
              </div>
              <div>
                <label htmlFor="departmentId" className="text-sm text-slate-600">ฝ่ายงาน</label>
                <select
                  id="departmentId"
                  className="select"
                  value={scopedDepartmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={true}
                >
                  {visibleDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary" type="submit" disabled={bookingMutation.isPending}>
                {editing ? 'อัปเดตการจอง' : 'บันทึกการจอง'}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setEditing(null);
                }}
              >
                ล้างฟอร์ม
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-display">Availability</h3>
                <p className="text-sm text-slate-500">
                  {strategy === 'UNASSIGNED'
                    ? 'แสดงจำนวนที่นั่งคงเหลือแบบ capacity-based'
                    : 'แสดงจำนวนที่นั่งที่ยังว่างในวันนั้น'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    className="btn-secondary w-full sm:w-auto"
                    onClick={() => {
                      const next = DateTime.fromISO(calendarMonthIso, { zone: 'Asia/Bangkok' })
                        .minus({ months: 1 })
                        .startOf('month');
                      setCalendarMonthIso(next.toISODate()!);
                      setSelectedDate(next.toISODate()!);
                    }}
                  >
                    ‹
                  </button>
                  <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center px-2">
                    {calendarMonthLabel}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary w-full sm:w-auto"
                    onClick={() => {
                      const next = DateTime.fromISO(calendarMonthIso, { zone: 'Asia/Bangkok' })
                        .plus({ months: 1 })
                        .startOf('month');
                      setCalendarMonthIso(next.toISODate()!);
                      setSelectedDate(next.toISODate()!);
                    }}
                  >
                    ›
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-secondary border border-indigo text-indigo bg-white"
                  onClick={() => {
                    const current = DateTime.fromISO(todayIso, { zone: 'Asia/Bangkok' }).startOf('month');
                    setCalendarMonthIso(current.toISODate()!);
                    setSelectedDate(todayIso);
                  }}
                >
                  เดือนปัจจุบัน
                </button>
              </div>
            </div>
            <div className="mt-6">
              <Calendar
                month={DateTime.fromISO(calendarMonthIso, { zone: 'Asia/Bangkok' })}
                dayInfo={availabilityMap}
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCalendarMonthIso(
                    DateTime.fromISO(date, { zone: 'Asia/Bangkok' }).startOf('month').toISODate()!
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-display mb-4">รายการจองวันที่ {formatThaiBuddhistDate(selectedDate)}</h3>
        {bookingForSelectedDate.length === 0 ? (
          <EmptyState label="ยังไม่มีการจอง" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>พนักงาน</th>
                <th>เวลา</th>
                <th>ที่นั่ง</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {bookingForSelectedDate.map((b) => (
                <tr key={b.id}>
                  <td>{employeeMap.get(b.employeeId)?.name ?? '-'}</td>
                  <td>
                    {formatThaiTime24(b.startAt)} - {formatThaiTime24(b.endAt)}
                  </td>
                  <td>-</td>
                  <td>
                    <span className={`badge ${b.status === 'CONFIRMED' ? 'bg-mint/20 text-mint' : 'bg-rose/20 text-rose'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="flex gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditing(b);
                        setEmployeeId(b.employeeId);
                        const startLocal = toLocalDateTimeInputFromUtc(b.startAt);
                        const endLocal = toLocalDateTimeInputFromUtc(b.endAt);
                        setStartDateTimeLocal(startLocal);
                        setEndDateTimeLocal(endLocal);
                      }}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => cancelMutation.mutate({ id: b.id })}
                      disabled={cancelMutation.isPending}
                    >
                      ยกเลิก
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
