export type ErrorCode =
  | 'INVALID_RANGE'
  | 'UNAUTHORIZED'
  | 'INACTIVE_EMPLOYEE'
  | 'DEPARTMENT_MISMATCH'
  | 'SEAT_REQUIRED'
  | 'SEAT_NOT_ALLOWED'
  | 'HOLIDAY_CLOSED'
  | 'OVER_CAPACITY'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'ALREADY_CANCELLED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export const mapErrorCodeToMessage = (code: ErrorCode) => {
  switch (code) {
    case 'INVALID_RANGE':
      return 'ช่วงเวลาไม่ถูกต้อง';
    case 'UNAUTHORIZED':
      return 'ไม่มีสิทธิ์ดำเนินการ';
    case 'INACTIVE_EMPLOYEE':
      return 'พนักงานนี้ถูกปิดใช้งาน';
    case 'DEPARTMENT_MISMATCH':
      return 'ฝ่าย/ออฟฟิศไม่ตรงกับพนักงาน';
    case 'SEAT_REQUIRED':
      return 'ต้องเลือกที่นั่งสำหรับฝ่ายแบบ Seat Assigned';
    case 'SEAT_NOT_ALLOWED':
      return 'ที่นั่งไม่ถูกต้องสำหรับฝ่ายนี้';
    case 'HOLIDAY_CLOSED':
      return 'วันดังกล่าวปิดการจอง';
    case 'OVER_CAPACITY':
      return 'จำนวนที่นั่งเต็มแล้วในช่วงเวลานี้';
    case 'CONFLICT':
      return 'ที่นั่งถูกจองซ้ำในช่วงเวลาเดียวกัน';
    case 'NOT_FOUND':
      return 'ไม่พบรายการ';
    case 'ALREADY_CANCELLED':
      return 'รายการนี้ถูกยกเลิกแล้ว';
    case 'SERVICE_UNAVAILABLE':
      return 'ระบบ Supabase ไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่';
    default:
      return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  }
};

export const parseErrorCode = (message?: string | number) => {
  if (!message) return 'UNKNOWN' as const;
  const msg = String(message).toUpperCase();
  const known = [
    'INVALID_RANGE',
    'UNAUTHORIZED',
    'INACTIVE_EMPLOYEE',
    'DEPARTMENT_MISMATCH',
    'SEAT_REQUIRED',
    'SEAT_NOT_ALLOWED',
    'HOLIDAY_CLOSED',
    'OVER_CAPACITY',
    'CONFLICT',
    'NOT_FOUND',
    'ALREADY_CANCELLED'
  ];
  const match = known.find((k) => msg.includes(k));
  if (match) return match as ErrorCode;

  const svcDownSignals = ['503', 'SERVICE UNAVAILABLE', 'MAX_LOCKS_PER_TRANSACTION', 'OUT OF SHARED MEMORY', '53200'];
  if (svcDownSignals.some((sig) => msg.includes(sig))) return 'SERVICE_UNAVAILABLE';

  return 'UNKNOWN' as ErrorCode;
};
