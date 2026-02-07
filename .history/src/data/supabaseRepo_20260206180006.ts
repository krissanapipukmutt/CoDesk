import { supabase, hasSupabaseEnv } from './supabaseClient';
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
  Seat,
  SessionInfo
} from './types';

const client = supabase;
const sb = () => {
  if (!client) throw new Error('UNAUTHORIZED');
  return client.schema('codesk');
};


export class SupabaseRepo {
  async init() {
    if (!hasSupabaseEnv || !client) return false;
    try {
      const { error } = await client.auth.getSession();
      if (!error) return true;
      const message = `${error.message ?? ''}`.toLowerCase();
      if (message.includes('failed to fetch') || message.includes('network')) return false;
      return true;
    } catch (err) {
      const message = `${err ?? ''}`.toLowerCase();
      if (message.includes('failed to fetch') || message.includes('network')) return false;
      return true;
    }
  }

  get isDemo() {
    return false as const;
  }

  onAuthStateChange(callback: (session: SessionInfo | null) => void) {
    if (!client) return () => void 0;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({ userId: session.user.id, email: session.user.email ?? '' });
      } else {
        callback(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }

  async signIn(email: string, password: string) {
    if (!client) throw new Error('UNAUTHORIZED');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error('UNAUTHORIZED');
    return { userId: data.user.id, email: data.user.email ?? '' };
  }

  async signOut() {
    if (!client) return;
    await client.auth.signOut();
  }

  async getSession() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    if (!data.session?.user) return null;
    return { userId: data.session.user.id, email: data.session.user.email ?? '' };
  }

  async getProfile() {
    if (!client) return null;
    const { data, error } = await client.schema('codesk').rpc('current_profile');
    if (error || !data || data.length === 0) return null;
    const profile = data[0];
    const { data: emp } = await client
      .schema('codesk')
      .from('employees')
      .select('email,name')
      .eq('id', profile.employee_id)
      .single();
    return {
      userId: profile.user_id,
      employeeId: profile.employee_id,
      role: profile.role,
      departmentId: profile.department_id,
      officeId: profile.office_id,
      email: emp?.email ?? '',
      name: emp?.name ?? ''
    } as Profile;
  }
  async listOffices(): Promise<Office[]> {
    const { data, error } = await sb().from('offices').select('*');
    if (error) throw error;
    return data.map((o) => ({
      id: o.id,
      code: o.code,
      name: o.name,
      tz: o.tz,
      isActive: o.is_active
    }));
  }

  async listDepartments(): Promise<Department[]> {
    const { data, error } = await sb().from('departments').select('*');
    if (error) throw error;
    return data.map((d) => ({
      id: d.id,
      officeId: d.office_id,
      name: d.name,
      strategy: d.strategy,
      isActive: d.is_active
    }));
  }

  async listSeats(): Promise<Seat[]> {
    const { data, error } = await sb().from('seats').select('*');
    if (error) throw error;
    return data.map((s) => ({
      id: s.id,
      officeId: s.office_id,
      departmentId: s.department_id,
      seatCode: s.seat_code,
      seatName: s.seat_name,
      isActive: s.is_active,
      isBookable: s.is_bookable
    }));
  }

  async listEmployees(): Promise<Employee[]> {
    const { data, error } = await sb().from('employees').select('*');
    if (error) throw error;
    return data.map((e) => ({
      id: e.id,
      employeeCode: e.employee_code,
      name: e.name,
      email: e.email,
      departmentId: e.department_id,
      startDate: e.start_date,
      active: e.active
    }));
  }

  async listHolidays(): Promise<Holiday[]> {
    const { data, error } = await sb().from('holidays').select('*');
    if (error) throw error;
    return data.map((h) => ({
      id: h.id,
      officeId: h.office_id,
      holidayDate: h.holiday_date,
      name: h.name,
      rule: h.rule,
      isActive: h.is_active
    }));
  }

  async listBookings(): Promise<Booking[]> {
    const { data, error } = await sb()
      .from('bookings')
      .select('id, office_id, department_id, employee_id, seat_id, booking_type, status, start_at, end_at, created_at, updated_at, cancelled_at, cancel_reason');
    if (error) throw error;
    return data.map((b) => ({
      id: b.id,
      officeId: b.office_id,
      departmentId: b.department_id,
      employeeId: b.employee_id,
      seatId: b.seat_id,
      bookingType: b.booking_type,
      status: b.status,
      startAt: b.start_at,
      endAt: b.end_at,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
      cancelledAt: b.cancelled_at,
      cancelReason: b.cancel_reason
    }));
  }

  async createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
    const { data, error } = await sb().rpc('create_booking', {
      p_employee_id: input.employeeId,
      p_department_id: input.departmentId,
      p_office_id: input.officeId,
      p_seat_id: input.seatId ?? null,
      p_booking_type: input.bookingType,
      p_start_at: input.startAt,
      p_end_at: input.endAt
    });
    if (error) throw error;
    return data[0] as CreateBookingResult;
  }

  async cancelBooking(bookingId: string, reason?: string | null): Promise<CancelBookingResult> {
    const { data, error } = await sb().rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_reason: reason ?? null
    });
    if (error) throw error;
    return data[0] as CancelBookingResult;
  }

  async createDepartment(input: Omit<Department, 'id'>) {
    const { data, error } = await sb()
      .from('departments')
      .insert({
        office_id: input.officeId,
        name: input.name,
        strategy: input.strategy,
        is_active: input.isActive
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      officeId: data.office_id,
      name: data.name,
      strategy: data.strategy,
      isActive: data.is_active
    } as Department;
  }

  async updateDepartment(id: string, input: Omit<Department, 'id'>) {
    const { data, error } = await sb()
      .from('departments')
      .update({
        office_id: input.officeId,
        name: input.name,
        strategy: input.strategy,
        is_active: input.isActive
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      officeId: data.office_id,
      name: data.name,
      strategy: data.strategy,
      isActive: data.is_active
    } as Department;
  }

  async deleteDepartment(id: string) {
    const { error } = await sb().from('departments').delete().eq('id', id);
    if (error) throw error;
  }

  async createEmployee(input: Omit<Employee, 'id'>) {
    const { data, error } = await sb()
      .from('employees')
      .insert({
        employee_code: input.employeeCode,
        name: input.name,
        email: input.email,
        department_id: input.departmentId,
        start_date: input.startDate,
        active: input.active
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      employeeCode: data.employee_code,
      name: data.name,
      email: data.email,
      departmentId: data.department_id,
      startDate: data.start_date,
      active: data.active
    } as Employee;
  }

  async updateEmployee(id: string, input: Omit<Employee, 'id'>) {
    const { data, error } = await sb()
      .from('employees')
      .update({
        employee_code: input.employeeCode,
        name: input.name,
        email: input.email,
        department_id: input.departmentId,
        start_date: input.startDate,
        active: input.active
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      employeeCode: data.employee_code,
      name: data.name,
      email: data.email,
      departmentId: data.department_id,
      startDate: data.start_date,
      active: data.active
    } as Employee;
  }

  async deleteEmployee(id: string) {
    const { error } = await sb().from('employees').delete().eq('id', id);
    if (error) throw error;
  }

  async createHoliday(input: Omit<Holiday, 'id'>) {
    const { data, error } = await sb()
      .from('holidays')
      .insert({
        office_id: input.officeId,
        holiday_date: input.holidayDate,
        name: input.name,
        rule: input.rule,
        is_active: input.isActive
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      officeId: data.office_id,
      holidayDate: data.holiday_date,
      name: data.name,
      rule: data.rule,
      isActive: data.is_active
    } as Holiday;
  }

  async updateHoliday(id: string, input: Omit<Holiday, 'id'>) {
    const { data, error } = await sb()
      .from('holidays')
      .update({
        office_id: input.officeId,
        holiday_date: input.holidayDate,
        name: input.name,
        rule: input.rule,
        is_active: input.isActive
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      officeId: data.office_id,
      holidayDate: data.holiday_date,
      name: data.name,
      rule: data.rule,
      isActive: data.is_active
    } as Holiday;
  }

  async deleteHoliday(id: string) {
    const { error } = await sb().from('holidays').delete().eq('id', id);
    if (error) throw error;
  }

  async reportBookingsPerDay() {
    const { data, error } = await sb().from('v_bookings_per_day').select('*');
    if (error) throw error;
    return data;
  }

  async reportUtilization() {
    const { data, error } = await sb().from('v_utilization_by_department').select('*');
    if (error) throw error;
    return data;
  }

  async reportPopularSeats() {
    const { data, error } = await sb().from('v_popular_seats').select('*');
    if (error) throw error;
    return data;
  }

  async reportStatusSummary() {
    const { data, error } = await sb().from('v_booking_status_summary').select('*');
    if (error) throw error;
    return data;
  }

  async reportPeakTimes() {
    const { data, error } = await sb().from('v_peak_times').select('*');
    if (error) throw error;
    return data;
  }

  async listAdminUsers() {
    const { data, error } = await sb()
      .from('profiles')
      .select('user_id, role, created_at, employee:employee_id (id, employee_code, name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      user_id: row.user_id,
      role: row.role,
      created_at: row.created_at,
      employee_id: row.employee_id,
      employee_code: row.employee?.employee_code ?? '',
      name: row.employee?.name ?? '',
      email: row.employee?.email ?? ''
    }));
  }

  async adminCreateUser(input: {
    employee_id: string;
    email: string;
    password: string;
    role: 'employee' | 'hr' | 'admin';
  }) {
    if (!client) throw new Error('UNAUTHORIZED');
    const { data, error } = await client.functions.invoke('admin_create_user', {
      body: input
    });
    if (error) throw error;
    if (data?.error?.code) {
      throw new Error(data.error.code);
    }
    return data;
  }

  subscribeBookings(callback: () => void) {
    if (!client) return () => void 0;
    const channel = client
      .channel('codesk-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'codesk', table: 'bookings' },
        () => callback()
      )
      .subscribe();
    return () => {
      void client?.removeChannel(channel);
    };
  }
}
