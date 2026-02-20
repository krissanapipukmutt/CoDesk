import { Booking, Department, Employee, Holiday, Office, Profile, Seat } from './types';

export const sampleOffices: Office[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'BKK-01',
    name: 'Bangkok HQ',
    tz: 'Asia/Bangkok',
    isActive: true
  }
];

export const sampleDepartments: Department[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    officeId: '11111111-1111-1111-1111-111111111111',
    name: 'Engineering',
    strategy: 'ASSIGNED',
    isActive: true,
    dailyCapacity: 3
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    officeId: '11111111-1111-1111-1111-111111111111',
    name: 'Support',
    strategy: 'UNASSIGNED',
    isActive: true,
    dailyCapacity: null
  }
];

export const sampleSeats: Seat[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    officeId: '11111111-1111-1111-1111-111111111111',
    departmentId: '22222222-2222-2222-2222-222222222222',
    seatCode: 'ENG-A1',
    seatName: 'Eng Seat A1',
    isActive: true,
    isBookable: true
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    officeId: '11111111-1111-1111-1111-111111111111',
    departmentId: '22222222-2222-2222-2222-222222222222',
    seatCode: 'ENG-A2',
    seatName: 'Eng Seat A2',
    isActive: true,
    isBookable: true
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    officeId: '11111111-1111-1111-1111-111111111111',
    departmentId: '33333333-3333-3333-3333-333333333333',
    seatCode: 'SUP-U1',
    seatName: 'Support Seat U1',
    isActive: true,
    isBookable: true
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    officeId: '11111111-1111-1111-1111-111111111111',
    departmentId: '33333333-3333-3333-3333-333333333333',
    seatCode: 'SUP-U2',
    seatName: 'Support Seat U2',
    isActive: true,
    isBookable: true
  }
];

export const sampleEmployees: Employee[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    employeeCode: 'ENG-001',
    name: 'Alice Eng',
    email: 'alice.eng@codesk.example',
    departmentId: '22222222-2222-2222-2222-222222222222',
    startDate: '2025-01-10',
    active: true
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    employeeCode: 'ENG-002',
    name: 'Bob Eng',
    email: 'bob.eng@codesk.example',
    departmentId: '22222222-2222-2222-2222-222222222222',
    startDate: '2025-02-01',
    active: true
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    employeeCode: 'SUP-001',
    name: 'Nok Support',
    email: 'nok.sup@codesk.example',
    departmentId: '33333333-3333-3333-3333-333333333333',
    startDate: '2025-02-01',
    active: true
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    employeeCode: 'SUP-002',
    name: 'Ploy Support',
    email: 'ploy.sup@codesk.example',
    departmentId: '33333333-3333-3333-3333-333333333333',
    startDate: '2025-02-01',
    active: true
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    employeeCode: 'ADM-001',
    name: 'Admin User',
    email: 'admin@codesk.example',
    departmentId: '22222222-2222-2222-2222-222222222222',
    startDate: '2025-01-01',
    active: true
  }
];

export const sampleProfiles: Profile[] = [
  {
    userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    employeeId: '44444444-4444-4444-4444-444444444444',
    role: 'employee',
    departmentId: '22222222-2222-2222-2222-222222222222',
    officeId: '11111111-1111-1111-1111-111111111111',
    email: 'alice.eng@codesk.example',
    name: 'Alice Eng'
  },
  {
    userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    employeeId: '66666666-6666-6666-6666-666666666666',
    role: 'employee',
    departmentId: '33333333-3333-3333-3333-333333333333',
    officeId: '11111111-1111-1111-1111-111111111111',
    email: 'nok.sup@codesk.example',
    name: 'Nok Support'
  },
  {
    userId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    employeeId: '77777777-7777-7777-7777-777777777777',
    role: 'hr',
    departmentId: '33333333-3333-3333-3333-333333333333',
    officeId: '11111111-1111-1111-1111-111111111111',
    email: 'ploy.sup@codesk.example',
    name: 'Ploy Support'
  },
  {
    userId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    employeeId: '88888888-8888-8888-8888-888888888888',
    role: 'admin',
    departmentId: '22222222-2222-2222-2222-222222222222',
    officeId: '11111111-1111-1111-1111-111111111111',
    email: 'admin@codesk.example',
    name: 'Admin User'
  }
];

export const sampleHolidays: Holiday[] = [
  {
    id: '99999999-9999-9999-9999-999999999991',
    officeId: '11111111-1111-1111-1111-111111111111',
    holidayDate: '2026-02-12',
    name: 'Makha Bucha',
    rule: 'CLOSED',
    isActive: true
  },
  {
    id: '99999999-9999-9999-9999-999999999992',
    officeId: '11111111-1111-1111-1111-111111111111',
    holidayDate: '2026-02-13',
    name: 'Company Event',
    rule: 'WARNING',
    isActive: true
  }
];

export const sampleBookings: Booking[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    officeId: '11111111-1111-1111-1111-111111111111',
    departmentId: '22222222-2222-2222-2222-222222222222',
    employeeId: '44444444-4444-4444-4444-444444444444',
    seatId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    bookingType: 'SINGLE_DAY',
    status: 'CONFIRMED',
    startAt: '2026-02-10T02:00:00.000Z',
    endAt: '2026-02-10T05:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z'
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    officeId: '11111111-1111-1111-1111-111111111111',
    departmentId: '33333333-3333-3333-3333-333333333333',
    employeeId: '66666666-6666-6666-6666-666666666666',
    seatId: null,
    bookingType: 'SINGLE_DAY',
    status: 'CONFIRMED',
    startAt: '2026-02-10T02:00:00.000Z',
    endAt: '2026-02-10T05:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z'
  },
  {
    id: 'f0000000-0000-0000-0000-000000000005',
    officeId: '11111111-1111-1111-1111-111111111111',
    departmentId: '33333333-3333-3333-3333-333333333333',
    employeeId: '77777777-7777-7777-7777-777777777777',
    seatId: null,
    bookingType: 'SINGLE_DAY',
    status: 'CONFIRMED',
    startAt: '2026-02-10T02:30:00.000Z',
    endAt: '2026-02-10T04:30:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z'
  }
];
