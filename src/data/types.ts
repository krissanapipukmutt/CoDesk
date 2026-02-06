export type Role = 'employee' | 'hr' | 'admin';
export type DepartmentStrategy = 'ASSIGNED' | 'UNASSIGNED';
export type BookingType = 'SINGLE_DAY' | 'DATE_RANGE';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
export type HolidayRule = 'CLOSED' | 'WARNING';

export type Office = {
  id: string;
  code: string;
  name: string;
  tz: string;
  isActive: boolean;
};

export type Department = {
  id: string;
  officeId: string;
  name: string;
  strategy: DepartmentStrategy;
  isActive: boolean;
  dailyCapacity?: number | null;
};

export type Seat = {
  id: string;
  officeId: string;
  departmentId: string;
  seatCode: string;
  seatName?: string | null;
  isActive: boolean;
  isBookable: boolean;
};

export type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  departmentId: string;
  startDate: string;
  active: boolean;
};

export type Profile = {
  userId: string;
  employeeId: string;
  role: Role;
  departmentId: string;
  officeId: string;
  email: string;
  name: string;
};

export type Holiday = {
  id: string;
  officeId: string | null;
  holidayDate: string; // ISO date
  name: string;
  rule: HolidayRule;
  isActive: boolean;
};

export type Booking = {
  id: string;
  officeId: string;
  departmentId: string;
  employeeId: string;
  seatId: string | null;
  bookingType: BookingType;
  status: BookingStatus;
  startAt: string; // UTC ISO
  endAt: string; // UTC ISO
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
};

export type BookingWithEmployee = Booking & {
  employeeName?: string;
};

export type ReportBookingsPerDay = {
  office_id: string;
  department_id: string;
  local_date: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
};

export type ReportUtilization = {
  office_id: string;
  department_id: string;
  local_date: string;
  booked_minutes: number;
  capacity_minutes: number;
  utilization_pct: number;
};

export type ReportPopularSeats = {
  office_id: string;
  department_id: string;
  local_date: string;
  seat_id: string;
  seat_code: string;
  booking_count: number;
  booked_minutes: number;
};

export type ReportStatusSummary = {
  office_id: string;
  department_id: string;
  local_date: string;
  status: BookingStatus;
  booking_count: number;
};

export type ReportPeakTimes = {
  office_id: string;
  department_id: string;
  local_date: string;
  slot_start_local: string;
  slot_end_local: string;
  concurrent_bookings: number;
};

export type SessionInfo = {
  userId: string;
  email: string;
};

export type CreateBookingInput = {
  employeeId: string;
  departmentId: string;
  officeId: string;
  seatId?: string | null;
  bookingType: BookingType;
  startAt: string;
  endAt: string;
};

export type CreateBookingResult = {
  booking_id: string;
  status: BookingStatus;
  seat_id: string | null;
  start_at: string;
  end_at: string;
  created_at: string;
};

export type CancelBookingResult = {
  booking_id: string;
  status: BookingStatus;
  cancelled_at: string;
};
