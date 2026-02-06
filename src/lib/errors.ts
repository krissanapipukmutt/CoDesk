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
    default:
      return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  }
};

export const parseErrorCode = (message?: string) => {
  if (!message) return 'UNKNOWN' as const;
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
  const match = known.find((k) => message.includes(k));
  return (match ?? 'UNKNOWN') as ErrorCode;
};
