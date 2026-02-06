import { DateTime } from 'luxon';
import { BANGKOK_TZ } from '../lib/tz';
import { formatThaiBuddhistDate } from '../lib/date';
import { maxConcurrent, BookingWindow } from '../lib/availability';
import { segmentByDay } from '../lib/range';
import {
  Booking,
  CreateBookingInput,
  CreateBookingResult,
  CancelBookingResult,
  Department,
  Employee,
  Holiday,
  Office,
  Profile,
  Role,
  Seat,
  SessionInfo
} from './types';
import {
  sampleBookings,
  sampleDepartments,
  sampleEmployees,
  sampleHolidays,
  sampleOffices,
  sampleProfiles,
  sampleSeats
} from './sampleData';
import {
  buildBookingsPerDay,
  buildPeakTimes,
  buildPopularSeats,
  buildStatusSummary,
  buildUtilization
} from './reportBuilders';
import { overlaps } from '../lib/range';

const nowUtcIso = () => DateTime.now().toUTC().toISO()!;

type Listener = () => void;
type AuthListener = (session: SessionInfo | null) => void;
const DEMO_STORAGE_KEY = 'codesk_demo_state_v1';

type DemoState = {
  departments: Department[];
  employees: Employee[];
  holidays: Holiday[];
  bookings: Booking[];
};

const requireProfile = (session: SessionInfo | null, profiles: Profile[]) => {
  const profile = session ? profiles.find((p) => p.userId === session.userId) : null;
  if (!profile) throw new Error('UNAUTHORIZED');
  return profile;
};

export class SampleRepo {
  private offices: Office[] = [];
  private departments: Department[] = [];
  private seats: Seat[] = [];
  private employees: Employee[] = [];
  private profiles: Profile[] = [];
  private holidays: Holiday[] = [];
  private bookings: Booking[] = [];
  private session: SessionInfo | null = null;
  private listeners = new Set<Listener>();
  private authListeners = new Set<AuthListener>();
  private seatBookableBaseline = new Map<string, boolean>();

  constructor() {
    this.reset();
  }

  private loadState(): DemoState | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<DemoState>;
      if (!parsed) return null;
      return {
        departments: Array.isArray(parsed.departments) ? parsed.departments : [],
        employees: Array.isArray(parsed.employees) ? parsed.employees : [],
        holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : []
      };
    } catch {
      return null;
    }
  }

  private persistState() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const payload: DemoState = {
      departments: this.departments,
      employees: this.employees,
      holidays: this.holidays,
      bookings: this.bookings
    };
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payload));
  }

  reset() {
    const stored = this.loadState();
    this.offices = [...sampleOffices];
    this.seats = [...sampleSeats];
    this.seatBookableBaseline = new Map(this.seats.map((seat) => [seat.id, seat.isBookable]));
    this.departments = (stored?.departments?.length ? stored.departments : sampleDepartments).map((dept) => ({
      ...dept,
      dailyCapacity:
        dept.strategy === 'ASSIGNED'
          ? Math.max(1, Math.floor(dept.dailyCapacity ?? this.baseBookableCount(dept.id, dept.officeId)))
          : null
    }));
    this.employees = stored?.employees?.length ? stored.employees : [...sampleEmployees];
    this.profiles = [...sampleProfiles];
    this.holidays = stored?.holidays?.length ? stored.holidays : [...sampleHolidays];
    this.bookings = stored?.bookings?.length ? stored.bookings : [...sampleBookings];
    this.session = null;
    this.applySeatCapacities();
  }

  async init() {
    return true;
  }

  get isDemo() {
    return true as const;
  }

  onAuthStateChange(callback: (session: SessionInfo | null) => void) {
    this.authListeners.add(callback);
    callback(this.session);
    return () => {
      this.authListeners.delete(callback);
    };
  }

  async signIn(email: string, _password: string) {
    const profile = this.profiles.find((p) => p.email === email);
    if (!profile) {
      throw new Error('UNAUTHORIZED');
    }
    this.session = { userId: profile.userId, email };
    this.notifyAuth();
    return this.session;
  }

  async signOut() {
    this.session = null;
    this.notifyAuth();
  }

  async getSession() {
    return this.session;
  }

  async getProfile() {
    if (!this.session) return null;
    return this.profiles.find((p) => p.userId === this.session!.userId) ?? null;
  }

  async listOffices() {
    return this.offices;
  }

  async listDepartments() {
    return this.departments;
  }

  async listSeats() {
    return this.seats;
  }

  async listEmployees() {
    return this.employees;
  }

  async listHolidays() {
    return this.holidays;
  }

  async listBookings() {
    return this.bookings;
  }

  private baseBookableCount(departmentId: string, officeId: string) {
    return this.seats
      .filter((seat) => seat.departmentId === departmentId && seat.officeId === officeId)
      .filter((seat) => {
        const baseline = this.seatBookableBaseline.get(seat.id) ?? seat.isBookable;
        return baseline && seat.isActive;
      }).length;
  }

  private applySeatCapacity(dept: Department) {
    const deptSeats = this.seats.filter((seat) => seat.departmentId === dept.id && seat.officeId === dept.officeId);
    if (!deptSeats.length) return;

    if (dept.strategy !== 'ASSIGNED') {
      deptSeats.forEach((seat) => {
        seat.isBookable = this.seatBookableBaseline.get(seat.id) ?? seat.isBookable;
      });
      return;
    }

    const capacity = Math.max(0, Math.floor(dept.dailyCapacity ?? 0));
    const baseBookable = deptSeats
      .filter((seat) => (this.seatBookableBaseline.get(seat.id) ?? seat.isBookable) && seat.isActive)
      .sort((a, b) => a.seatCode.localeCompare(b.seatCode));

    const allowed = new Set(baseBookable.slice(0, capacity).map((seat) => seat.id));
    deptSeats.forEach((seat) => {
      const baseline = this.seatBookableBaseline.get(seat.id) ?? seat.isBookable;
      seat.isBookable = baseline && seat.isActive && allowed.has(seat.id);
    });
  }

  private applySeatCapacities() {
    this.departments.forEach((dept) => this.applySeatCapacity(dept));
  }

  private ensureHolidayRule(startAt: string, endAt: string, officeId: string) {
    const days = segmentByDay(startAt, endAt).map((s) => s.date);
    const closed = this.holidays.find(
      (h) => h.rule === 'CLOSED' && h.isActive && (h.officeId === null || h.officeId === officeId) && days.includes(h.holidayDate)
    );
    if (closed) throw new Error('HOLIDAY_CLOSED');
  }

  createBooking = async (input: CreateBookingInput) => {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role === 'employee' && profile.employeeId !== input.employeeId) {
      throw new Error('UNAUTHORIZED');
    }
    if (profile.role === 'hr' && profile.departmentId !== input.departmentId) {
      throw new Error('UNAUTHORIZED');
    }

    if (input.endAt <= input.startAt) throw new Error('INVALID_RANGE');
    if (input.bookingType === 'SINGLE_DAY') {
      const startDate = DateTime.fromISO(input.startAt, { zone: 'utc' }).setZone(BANGKOK_TZ).toISODate();
      const endDate = DateTime.fromISO(input.endAt, { zone: 'utc' }).setZone(BANGKOK_TZ).toISODate();
      if (startDate !== endDate) throw new Error('INVALID_RANGE');
    }

    const employee = this.employees.find((e) => e.id === input.employeeId && e.active);
    if (!employee) throw new Error('INACTIVE_EMPLOYEE');

    const dept = this.departments.find((d) => d.id === input.departmentId && d.isActive);
    if (!dept || dept.officeId !== input.officeId) throw new Error('DEPARTMENT_MISMATCH');

    if (dept.strategy === 'ASSIGNED') {
      if (!input.seatId) throw new Error('SEAT_REQUIRED');
      const seat = this.seats.find(
        (s) => s.id === input.seatId && s.departmentId === input.departmentId && s.officeId === input.officeId && s.isActive && s.isBookable
      );
      if (!seat) throw new Error('SEAT_NOT_ALLOWED');
      const conflict = this.bookings.find(
        (b) => b.seatId === input.seatId && b.status === 'CONFIRMED' && overlaps(b.startAt, b.endAt, input.startAt, input.endAt)
      );
      if (conflict) throw new Error('CONFLICT');
      if (typeof dept.dailyCapacity === 'number') {
        const days = segmentByDay(input.startAt, input.endAt).map((seg) => seg.date);
        const confirmed = this.bookings.filter(
          (b) => b.departmentId === input.departmentId && b.officeId === input.officeId && b.status === 'CONFIRMED'
        );
        for (const day of days) {
          const count = confirmed.filter((b) => segmentByDay(b.startAt, b.endAt).some((seg) => seg.date === day)).length;
          if (count + 1 > dept.dailyCapacity) throw new Error('OVER_CAPACITY');
        }
      }
    } else {
      if (input.seatId) throw new Error('SEAT_NOT_ALLOWED');
      const capacity = this.seats.filter(
        (s) => s.departmentId === input.departmentId && s.officeId === input.officeId && s.isActive && s.isBookable
      ).length;
      const windows: BookingWindow[] = this.bookings
        .filter((b) => b.departmentId === input.departmentId && b.officeId === input.officeId && b.status === 'CONFIRMED')
        .map((b) => ({ startAt: b.startAt, endAt: b.endAt }));
      const max = maxConcurrent(windows, input.startAt, input.endAt);
      if (max + 1 > capacity) throw new Error('OVER_CAPACITY');
    }

    this.ensureHolidayRule(input.startAt, input.endAt, input.officeId);

    const booking: Booking = {
      id: crypto.randomUUID(),
      officeId: input.officeId,
      departmentId: input.departmentId,
      employeeId: input.employeeId,
      seatId: input.seatId ?? null,
      bookingType: input.bookingType,
      status: 'CONFIRMED',
      startAt: input.startAt,
      endAt: input.endAt,
      createdAt: nowUtcIso(),
      updatedAt: nowUtcIso()
    };
    this.bookings.unshift(booking);
    this.persistState();
    this.notify();

    const result: CreateBookingResult = {
      booking_id: booking.id,
      status: booking.status,
      seat_id: booking.seatId,
      start_at: booking.startAt,
      end_at: booking.endAt,
      created_at: booking.createdAt
    };
    return result;
  };

  async cancelBooking(bookingId: string, reason?: string | null) {
    const profile = requireProfile(this.session, this.profiles);
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('NOT_FOUND');
    if (booking.status === 'CANCELLED') throw new Error('ALREADY_CANCELLED');
    if (profile.role === 'employee' && booking.employeeId !== profile.employeeId) throw new Error('UNAUTHORIZED');
    if (profile.role === 'hr' && booking.departmentId !== profile.departmentId) throw new Error('UNAUTHORIZED');

    booking.status = 'CANCELLED';
    booking.cancelReason = reason ?? null;
    booking.cancelledAt = nowUtcIso();
    booking.updatedAt = nowUtcIso();
    this.persistState();
    this.notify();

    const result: CancelBookingResult = {
      booking_id: booking.id,
      status: booking.status,
      cancelled_at: booking.cancelledAt!
    };
    return result;
  }

  async createDepartment(input: Omit<Department, 'id'>) {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role === 'employee') throw new Error('UNAUTHORIZED');
    const dept: Department = {
      ...input,
      dailyCapacity:
        input.strategy === 'ASSIGNED' ? Math.max(1, Math.floor(input.dailyCapacity ?? 1)) : null,
      id: crypto.randomUUID()
    };
    this.departments.push(dept);
    this.applySeatCapacity(dept);
    this.persistState();
    return dept;
  }

  async updateDepartment(id: string, input: Omit<Department, 'id'>) {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role === 'employee') throw new Error('UNAUTHORIZED');
    const idx = this.departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('NOT_FOUND');
    const dept: Department = {
      ...input,
      dailyCapacity:
        input.strategy === 'ASSIGNED'
          ? Math.max(1, Math.floor(input.dailyCapacity ?? this.departments[idx].dailyCapacity ?? 1))
          : null,
      id
    };
    this.departments[idx] = dept;
    this.applySeatCapacity(dept);
    this.persistState();
    return this.departments[idx];
  }

  async deleteDepartment(id: string) {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role !== 'admin') throw new Error('UNAUTHORIZED');
    this.departments = this.departments.filter((d) => d.id !== id);
    this.persistState();
  }

  createEmployee = async (input: Omit<Employee, 'id'>) => {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role === 'employee') throw new Error('UNAUTHORIZED');
    const emp: Employee = { ...input, id: crypto.randomUUID() };
    this.employees.push(emp);
    this.persistState();
    return emp;
  };

  async updateEmployee(id: string, input: Omit<Employee, 'id'>) {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role === 'employee') throw new Error('UNAUTHORIZED');
    const idx = this.employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('NOT_FOUND');
    this.employees[idx] = { ...input, id };
    this.persistState();
    return this.employees[idx];
  }

  async deleteEmployee(id: string) {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role !== 'admin') throw new Error('UNAUTHORIZED');
    this.employees = this.employees.filter((e) => e.id !== id);
    this.persistState();
  }

  createHoliday = async (input: Omit<Holiday, 'id'>) => {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role === 'employee') throw new Error('UNAUTHORIZED');
    const holiday: Holiday = { ...input, id: crypto.randomUUID() };
    this.holidays.push(holiday);
    this.persistState();
    return holiday;
  };

  async updateHoliday(id: string, input: Omit<Holiday, 'id'>) {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role === 'employee') throw new Error('UNAUTHORIZED');
    const idx = this.holidays.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error('NOT_FOUND');
    this.holidays[idx] = { ...input, id };
    this.persistState();
    return this.holidays[idx];
  }

  async deleteHoliday(id: string) {
    const profile = requireProfile(this.session, this.profiles);
    if (profile.role !== 'admin') throw new Error('UNAUTHORIZED');
    this.holidays = this.holidays.filter((h) => h.id !== id);
    this.persistState();
  }

  async reportBookingsPerDay() {
    return buildBookingsPerDay(this.bookings);
  }

  async reportUtilization() {
    return buildUtilization(this.bookings, this.seats);
  }

  async reportPopularSeats() {
    return buildPopularSeats(this.bookings, this.seats);
  }

  async reportStatusSummary() {
    return buildStatusSummary(this.bookings);
  }

  async reportPeakTimes() {
    return buildPeakTimes(this.bookings);
  }

  subscribeBookings(callback: Listener) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private notifyAuth() {
    this.authListeners.forEach((cb) => cb(this.session));
  }

  getDemoUsers() {
    return this.profiles.map((p) => ({ email: p.email, role: p.role, name: p.name }));
  }
}

export const buildHolidayWarning = (holidayDate: string) => {
  return `${formatThaiBuddhistDate(holidayDate)} วันหยุด`;
};
