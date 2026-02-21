# Reporting Views Design (co_desk)

## 1) ขอบเขตเอกสาร
เอกสารนี้สรุปการออกแบบ reporting layer ระดับฐานข้อมูลสำหรับโครงการ `co_desk` เพื่อรองรับบทที่ 1–3 ใน short paper โดยเน้นว่าเฟสปัจจุบันคือ “design/DDL + planned reporting layer” และการพัฒนา UI dashboard จริงจะดำเนินการใน phase implementation ถัดไป

การมองเห็นรายงานตาม requirement กำหนดให้ `hr` และ `admin` เป็นผู้ใช้งานหลัก ส่วนการบังคับสิทธิ์ละเอียดด้วย RLS/policies และ API authorization จะทำต่อในเฟสพัฒนา

## 2) สรุป Views ที่สร้าง
| View Name | วัตถุประสงค์รายงาน | ตารางต้นทาง | ฟิลด์สำคัญ | ผู้ใช้งานที่เกี่ยวข้อง | หมายเหตุการ filter |
|---|---|---|---|---|---|
| `co_desk.vw_daily_booking_summary_by_department` | สรุปจำนวนจองรายวันต่อแผนก | `bookings`, `departments` | `booking_date`, `department_code`, `booking_count`, `unique_employee_count` | `hr`, `admin` | รองรับ filter ตามวันที่/แผนกที่ชั้น UI |
| `co_desk.vw_department_capacity_utilization` | วิเคราะห์อัตราการใช้ความจุเทียบ policy | `bookings`, `departments`, `department_capacity_policies` | `booking_date`, `effective_capacity_mode`, `effective_capacity_per_day`, `booked_count`, `utilization_percent` | `hr`, `admin` | ใช้สำหรับ monitor over-capacity risk |
| `co_desk.vw_employee_booking_frequency` | ดูความถี่การจองรายพนักงานรายเดือน | `bookings`, `profiles`, `departments` | `booking_month`, `employee_code`, `booked_count`, `cancelled_count`, `latest_booked_at` | `hr`, `admin` | ใช้ filter ตามเดือน/แผนก/พนักงาน |
| `co_desk.vw_holiday_bookings_detail` | ตรวจรายการจองที่ทับวันหยุดและสถานะยืนยัน | `bookings`, `holidays`, `profiles`, `departments` | `booking_id`, `holiday_date`, `holiday_name`, `holiday_warning_acknowledged`, `status_code` | `hr`, `admin` | ใช้ตรวจ compliance ของ holiday warning |
| `co_desk.vw_booking_cancellations_summary` | ติดตามแนวโน้มการยกเลิกจองรายเดือน/แผนก | `bookings`, `departments` | `cancellation_month`, `department_code`, `cancellation_count`, `unique_cancelled_users` | `hr`, `admin` | เหมาะกับ dashboard trend |
| `co_desk.vw_peak_usage_by_day_hour` | วิเคราะห์ช่วงเวลาที่ใช้งานหนาแน่น | `bookings`, `departments` | `iso_weekday`, `hour_24`, `occupied_slot_count`, `department_code` | `hr`, `admin` | ใช้เพื่อวางแผน capacity และ policy |

## 3) คำอธิบายเชิงออกแบบ
1. View แต่ละตัวถูกออกแบบให้ตอบ business question ชัดเจน และโยงกับ requirement reporting (อย่างน้อย 5 views)
2. โครงสร้าง query ใช้ข้อมูลธุรกรรมจาก `bookings` เป็นแกนกลาง แล้ว join กับ dimension tables เช่น `departments`, `profiles`, `holidays`
3. รายงานบางตัวใช้การแตกช่วงวัน/ชั่วโมง (`generate_series`) เพื่อรองรับการวิเคราะห์รายวันและ peak usage
4. การกรองแบบ Excel-like column filtering (`REP-03`) อยู่ที่ application layer โดยใช้ TanStack Table ไม่ได้บังคับที่ SQL view โดยตรง

## 4) ความเชื่อมโยงกับบทที่ 1–3
- บทที่ 1: รองรับแรงจูงใจด้านการบริหารทรัพยากรและการตัดสินใจจากข้อมูล
- บทที่ 2: สะท้อนการใช้แนวคิด relational views และ RBAC/RLS
- บทที่ 3: เป็นหลักฐานการออกแบบ reporting dashboard ฝั่งฐานข้อมูลที่พร้อมต่อยอด implementation

## 5) ข้อจำกัดในเฟสนี้
1. Views ชุดนี้เป็น design baseline ไม่ใช่ final production tuning
2. Policy บังคับสิทธิ์การอ่านระดับแถว (RLS) ยังไม่ประกาศในไฟล์นี้ และต้องสร้างเพิ่มใน phase ถัดไป
3. Dashboard UI interaction (sorting/filter/export) ยังอยู่นอกขอบเขตเอกสาร SQL ชุดนี้
