import { z } from 'zod';

export const bookingSchema = z.object({
  employeeId: z.string().uuid(),
  departmentId: z.string().uuid(),
  officeId: z.string().uuid(),
  seatId: z.string().uuid().optional().nullable(),
  bookingType: z.enum(['SINGLE_DAY', 'DATE_RANGE']),
  startDate: z.string().min(1),
  startTime: z.string().min(1),
  endDate: z.string().min(1),
  endTime: z.string().min(1)
});

export const departmentSchema = z.object({
  officeId: z.string().uuid(),
  name: z.string().min(2),
  strategy: z.enum(['ASSIGNED', 'UNASSIGNED']),
  isActive: z.boolean()
});

export const employeeSchema = z.object({
  employeeCode: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  departmentId: z.string().uuid(),
  startDate: z.string().min(1),
  active: z.boolean()
});

export const holidaySchema = z.object({
  officeId: z.string().uuid().optional().nullable(),
  holidayDate: z.string().min(1),
  name: z.string().min(2),
  rule: z.enum(['CLOSED', 'WARNING']),
  isActive: z.boolean()
});
