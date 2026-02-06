import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import Calendar from '../components/Calendar';
import { EmptyState, LoadingState } from '../components/State';
import { useRepo } from '../data/repo';
import { Booking, BookingType, DepartmentStrategy, Employee } from '../data/types';
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
  const [bookingType, setBookingType] = useState<BookingType>('SINGLE_DAY');
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [startDateTimeLocal, setStartDateTimeLocal] = useState(
    toLocalDateTimeInput(todayIso, defaultStartTime)
  );
  const [endDateTimeLocal, setEndDateTimeLocal] = useState(
    toLocalDateTimeInput(todayIso, defaultEndTime)
  );
  const [seatId, setSeatId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState(profile?.employeeId ?? '');
  const [selectedDate, setSelectedDate] = useState(todayIso);
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
        setEndDate(startParts.date);
        setEndDateTimeLocal(toLocalDateTimeInput(startParts.date, endTime));
      }
    }
  }, [bookingType, startDateTimeLocal, endTime]);

  useEffect(() => {
    if (strategy === 'UNASSIGNED') {
      setSeatId(null);
    }
  }, [strategy]);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'employee' || profile.role === 'hr') {
      setOfficeId(profile.officeId);
      setDepartmentId(profile.departmentId);
    }
    if (profile.role === 'employee') {
      setEmployeeId(profile.employeeId);
    }
  }, [profile]);

  useEffect(() => {
    const parts = splitLocalDateTime(startDateTimeLocal);
    if (parts) {
      setStartDate(parts.date);
      setStartTime(parts.time);
    }
  }, [startDateTimeLocal]);

  useEffect(() => {
    const parts = splitLocalDateTime(endDateTimeLocal);
    if (parts) {
      setEndDate(parts.date);
      setEndTime(parts.time);
    }
  }, [endDateTimeLocal]);

  const visibleOffices = shouldScope ? offices.filter((o) => o.id === scopedOfficeId) : offices;
  const visibleDepartments = shouldScope ? departments.filter((d) => d.id === scopedDepartmentId) : departments;
  const filteredSeats = seats.filter((s) => s.departmentId === scopedDepartmentId && s.officeId === scopedOfficeId);
  const deptEmployees = employees.filter((e) => e.departmentId === scopedDepartmentId);
  const filteredEmployees = isEmployee ? deptEmployees.filter((e) => e.id === profile?.employeeId) : deptEmployees;
  const filteredBookings = bookings.filter(
    (b) => b.departmentId === scopedDepartmentId && b.officeId === scopedOfficeId
  );

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);
  const showNamesInCalendar = profile?.role !== 'employee';

  const availabilityMap = useMemo(() => {
    const map: Record<string, { bookings: number; remaining?: number; tooltip?: string }> = {};
    const seatCount = filteredSeats.filter((s) => s.isActive && s.isBookable).length;
    const confirmed = filteredBookings.filter((b) => b.status === 'CONFIRMED');

    confirmed.forEach((b) => {
      segmentByDay(b.startAt, b.endAt).forEach((seg) => {
        const key = seg.date;
        map[key] = map[key] ?? { bookings: 0, tooltip: '' };
        map[key].bookings += 1;
        if (showNamesInCalendar) {
          const name = employeeMap.get(b.employeeId)?.name ?? '';
          map[key].tooltip = [map[key].tooltip, name].filter(Boolean).join(', ');
        }
      });
    });

    Object.keys(map).forEach((date) => {
      if (strategy === 'UNASSIGNED') {
        const remaining = remainingCapacityForDay(
          confirmed.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
          seatCount,
          date
        );
        map[date].remaining = remaining;
      }
      if (strategy === 'ASSIGNED') {
        const usedSeats = new Set(
          confirmed
            .filter((b) => b.seatId)
            .filter((b) => segmentByDay(b.startAt, b.endAt).some((seg) => seg.date === date))
            .map((b) => b.seatId)
        );
        map[date].remaining = Math.max(seatCount - usedSeats.size, 0);
      }
    });

    return map;
  }, [filteredBookings, filteredSeats, strategy, employeeMap, showNamesInCalendar]);

  const bookingMutation = useMutation({
    mutationFn: (input: any) => repo.createBooking(input),
    onSuccess: () => {
      setMessage('บันทึกการจองเรียบร้อย');
      setEditing(null);
    },
    onError: (err: any) => {
      const code = parseErrorCode(err?.message ?? err?.details ?? err?.error_description);
      setMessage(mapErrorCodeToMessage(code));
    }
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => repo.cancelBooking(id, reason),
    onSuccess: () => setMessage('ยกเลิกการจองเรียบร้อย'),
    onError: (err: any) => {
      const code = parseErrorCode(err?.message ?? err?.details ?? err?.error_description);
      setMessage(mapErrorCodeToMessage(code));
    }
  });

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setMessage('');
    const normalizedSeatId = seatId && seatId.length > 0 ? seatId : null;
    const effectiveOfficeId = isAdmin ? officeId : profile?.officeId ?? officeId;
    const effectiveDepartmentId = isAdmin ? departmentId : profile?.departmentId ?? departmentId;
    const effectiveEmployeeId = isEmployee ? profile?.employeeId ?? employeeId : employeeId;
    const startParts = splitLocalDateTime(startDateTimeLocal);
    const endParts = splitLocalDateTime(endDateTimeLocal);
    if (!startParts || !endParts) {
      setMessage('กรุณาระบุวันเวลาให้ครบถ้วน');
      return;
    }
    const parsed = bookingSchema.safeParse({
      employeeId: effectiveEmployeeId,
      departmentId: effectiveDepartmentId,
      officeId: effectiveOfficeId,
      seatId: normalizedSeatId,
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
    if (editing) {
      await cancelMutation.mutateAsync({ id: editing.id, reason: 'แก้ไขการจอง' });
    }
    await bookingMutation.mutateAsync({
      employeeId: effectiveEmployeeId,
      departmentId: effectiveDepartmentId,
      officeId: effectiveOfficeId,
      seatId: normalizedSeatId,
      bookingType,
      startAt,
      endAt
    });
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
                <label htmlFor="bookingType" className="text-sm text-slate-600">รูปแบบการจอง</label>
                <select
                  id="bookingType"
                  className="select"
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as BookingType)}
                >
                  <option value="SINGLE_DAY">Single Day</option>
                  <option value="DATE_RANGE">Date Range</option>
                </select>
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
                <label htmlFor="startTime" className="text-sm text-slate-600">เวลาเริ่มต้น</label>
                <input
                  id="startTime"
                  className="input"
                  type="text"
                  inputMode="numeric"
                  placeholder="HH:mm"
                  value={startTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStartTime(value);
                    setStartDateTimeLocal(toLocalDateTimeInput(startDate, value));
                  }}
                />
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
                <label htmlFor="endTime" className="text-sm text-slate-600">เวลาสิ้นสุด</label>
                <input
                  id="endTime"
                  className="input"
                  type="text"
                  inputMode="numeric"
                  placeholder="HH:mm"
                  value={endTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEndTime(value);
                    setEndDateTimeLocal(toLocalDateTimeInput(endDate, value));
                  }}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="officeId" className="text-sm text-slate-600">ออฟฟิศ</label>
                <select
                  id="officeId"
                  className="select"
                  value={isAdmin ? officeId : scopedOfficeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  disabled={isEmployee}
                >
                  {visibleOffices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="departmentId" className="text-sm text-slate-600">ฝ่ายงาน</label>
                <select
                  id="departmentId"
                  className="select"
                  value={isAdmin ? departmentId : scopedDepartmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={isEmployee}
                >
                  {visibleDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {strategy === 'ASSIGNED' && (
              <div>
                <label htmlFor="seatId" className="text-sm text-slate-600">ที่นั่ง</label>
                <select
                  id="seatId"
                  className="select"
                  value={seatId ?? ''}
                  onChange={(e) => setSeatId(e.target.value || null)}
                >
                  <option value="">เลือกที่นั่ง</option>
                  {filteredSeats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.seatCode}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn-primary" type="submit" disabled={bookingMutation.isPending}>
                {editing ? 'อัปเดตการจอง' : 'บันทึกการจอง'}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setSeatId(null);
                }}
              >
                ล้างฟอร์ม
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-display">Availability</h3>
            <p className="text-sm text-slate-500">
              {strategy === 'UNASSIGNED'
                ? 'แสดงจำนวนที่นั่งคงเหลือแบบ capacity-based'
                : 'แสดงจำนวนที่นั่งที่ยังว่างในวันนั้น'}
            </p>
          </div>
          <Calendar
            month={DateTime.fromISO(selectedDate, { zone: 'Asia/Bangkok' })}
            dayInfo={availabilityMap}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
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
                  <td>{filteredSeats.find((s) => s.id === b.seatId)?.seatCode ?? '-'}</td>
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
                        setSeatId(b.seatId);
                        setEmployeeId(b.employeeId);
                        const startLocal = toLocalDateTimeInputFromUtc(b.startAt);
                        const endLocal = toLocalDateTimeInputFromUtc(b.endAt);
                        setStartDateTimeLocal(startLocal);
                        setEndDateTimeLocal(endLocal);
                        const startParts = splitLocalDateTime(startLocal);
                        const endParts = splitLocalDateTime(endLocal);
                        if (startParts) {
                          setStartDate(startParts.date);
                          setStartTime(startParts.time);
                        }
                        if (endParts) {
                          setEndDate(endParts.date);
                          setEndTime(endParts.time);
                        }
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





