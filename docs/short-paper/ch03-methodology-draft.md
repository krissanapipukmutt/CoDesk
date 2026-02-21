# บทที่ 3 วิธีดำเนินการ

## 3.1 วิธีการดำเนินการเพื่อแก้ปัญหา
การดำเนินโครงการ `co_desk` ในระยะนี้ใช้แนวทาง Database-first เป็นแกนกลาง โดยเริ่มจากการนิยามโครงสร้างข้อมูล กติกาทางธุรกิจ และสิทธิ์การเข้าถึงที่ระดับฐานข้อมูลก่อนการลงมือพัฒนาเชิง implementation ทั้งนี้สอดคล้องกับปัญหาหลักที่ระบุในบทที่ 1 คือการจองซ้อน ความเสี่ยง over-capacity ของฝ่ายงาน ความแตกต่างของสิทธิ์ผู้ใช้ และความต้องการข้อมูลรายงานเพื่อการบริหาร แนวทางดังกล่าวช่วยให้ระบบมีความถูกต้องตั้งแต่ชั้นข้อมูล ลดความกำกวมของกติกา และเอื้อต่อการตรวจสอบย้อนกลับเมื่อระบบเข้าสู่ระยะพัฒนาเต็มรูปแบบ

## 3.2 ความต้องการโดยคร่าวของผู้ใช้ระบบ (Owner/Stakeholder Needs)
ในมุมของผู้บริหารและเจ้าของระบบ ความต้องการหลักคือการมีระบบจองที่นั่งที่ตรวจสอบได้จริง ควบคุมความจุได้ตามนโยบายแต่ละฝ่าย และสรุปผลเชิงรายงานได้อย่างน้อย 5 มุมมองจากฐานข้อมูลแบบ views เพื่อใช้ตัดสินใจด้านการบริหารพื้นที่สำนักงาน ขณะที่ผู้ใช้งานกลุ่ม `employee` ต้องการความชัดเจนในการจองของตนเองและการมองเห็นปฏิทินเฉพาะบริบทฝ่ายเดียวกัน ส่วน `hr` ต้องการสิทธิ์ในการจัดการข้อมูลพนักงานและฝ่ายงาน รวมถึงการดูรายงาน โดยยังคงข้อจำกัดว่าจองแทนผู้อื่นไม่ได้ และ `admin` ต้องเป็นบทบาทที่ควบคุมภาพรวมได้ทั้งหมด รวมถึงการสร้างผู้ใช้และกำหนดบทบาท การออกแบบจึงต้องผสานทั้ง usability และ governance ภายใต้เงื่อนไข `Supabase Auth + RLS` อย่างชัดเจน

## 3.3 กระบวนการวิเคราะห์และออกแบบระบบ
กระบวนการในบทนี้เริ่มจากการแปลง requirement ดิบให้เป็น Requirement IDs เพื่อให้ตรวจสอบความครบถ้วนได้ ต่อจากนั้นจึงจัดกลุ่ม requirement ตามมิติการแก้ปัญหา ได้แก่ ขอบเขตฟังก์ชัน บทบาทผู้ใช้ กติกาข้อมูล และข้อกำหนดด้านเทคโนโลยี แล้วจึงนำผลวิเคราะห์เข้าสู่การออกแบบโมเดลข้อมูลใน schema `co_desk` โดยระบุ entities, attributes, relationships และ constraints พร้อมกันตั้งแต่ต้นทาง เพื่อให้ความต้องการสำคัญ เช่น booking conflict, capacity, holiday warning และ role-based visibility ถูกตรึงไว้ในแบบจำลองก่อนออกแบบหน้าจอหรือ API รายละเอียด

เมื่อได้แบบจำลองข้อมูลแล้ว จึงกำหนดกระบวนการใช้งานหลักเป็น flow ระดับแนวคิด ได้แก่ การสร้าง/แก้ไข/ยกเลิกการจอง การตรวจสอบความซ้อนทับและความจุ การแจ้งเตือนวันหยุด และการเผยแพร่ข้อมูลผ่าน views สำหรับรายงาน วิธีดำเนินการลักษณะนี้ทำให้บทที่ 3 สามารถเชื่อมโยงต่อไปสู่การพัฒนา backend และ frontend ได้โดยไม่สูญเสียเจตนารมณ์ของ requirement เดิม

## 3.4 วิธีการออกแบบฐานข้อมูลแบบ Database-first
การออกแบบฐานข้อมูลยึด schema `co_desk` และกำหนด core entities ให้ครอบคลุมเงื่อนไขทางธุรกิจโดยตรง พร้อมระบุ attributes สำคัญอย่างน้อย 6 รายการต่อ entity ดังตารางต่อไปนี้

| Entity (Schema `co_desk`) | บทบาทของข้อมูล | Attributes หลัก |
|---|---|---|
| `roles` | นิยามบทบาทมาตรฐานของระบบ | `role_id`, `role_code`, `role_name`, `role_description`, `can_manage_users`, `can_manage_departments`, `can_view_reports`, `is_system_role`, `created_at`, `updated_at` |
| `departments` | เก็บข้อมูลฝ่ายงานและนโยบายความจุระดับหน่วยงาน | `department_id`, `department_code`, `department_name`, `capacity_mode`, `default_capacity_per_day`, `is_active`, `effective_timezone`, `created_by_profile_id`, `created_at`, `updated_at` |
| `profiles` | โปรไฟล์ผู้ใช้ที่ผูกกับ Supabase Auth และฝ่ายงาน | `profile_id` (อ้างอิง `auth.users.id`), `employee_code`, `full_name`, `email`, `department_id`, `role_id`, `is_active`, `timezone_name`, `created_at`, `updated_at` |
| `department_capacity_policies` | นโยบายความจุที่มีช่วงเวลาบังคับใช้ | `policy_id`, `department_id`, `effective_start_date`, `effective_end_date`, `capacity_mode`, `capacity_per_day`, `note_text`, `is_active`, `created_at`, `updated_at` |
| `bookings` | ธุรกรรมการจองที่นั่งเข้าออฟฟิศ | `booking_id`, `booked_for_profile_id`, `booked_by_profile_id`, `department_id`, `booking_mode`, `booking_date_start`, `booking_date_end`, `start_hour_24`, `end_hour_24`, `holiday_warning_acknowledged`, `status_code`, `created_at`, `updated_at` |
| `holidays` | ข้อมูลวันหยุดเพื่อใช้เตือนก่อนยืนยันการจอง | `holiday_id`, `holiday_date`, `holiday_name`, `holiday_description`, `is_active`, `created_by_profile_id`, `created_at`, `updated_at` |
| `booking_audit_logs` | ประวัติการเปลี่ยนแปลงการจองเพื่อการตรวจสอบ | `audit_log_id`, `booking_id`, `action_code`, `actor_profile_id`, `actor_role_code`, `action_reason`, `old_values_json`, `new_values_json`, `action_at`, `request_id` |

แบบจำลองดังกล่าวตั้งใจแยก data domain ที่เป็นแกนธุรกิจออกจากชั้นนำเสนอ โดยไม่ใช้ seat master รายตัวตาม requirement ของโครงการ แต่ใช้แนวคิดนับจำนวนการจองเทียบกับความจุของฝ่ายงานในแต่ละวันหรือช่วงเวลาแทน เพื่อให้โครงสร้างข้อมูลตรงกับกติกาการใช้งานจริง

## 3.5 คำอธิบาย ERD และแผนภาพกระบวนการ
ความสัมพันธ์หลักของโมเดลกำหนดให้ `roles` 1:N `profiles`, `departments` 1:N `profiles`, `departments` 1:N `department_capacity_policies`, `profiles` 1:N `bookings` (ทั้งผู้จองและผู้ถูกจอง), `departments` 1:N `bookings`, และ `bookings` 1:N `booking_audit_logs` ซึ่งเมื่อพิจารณาในมุมกลับจะได้ความสัมพันธ์ N:1 เช่น `bookings` N:1 `departments` และ `profiles` N:1 `roles` ขณะที่ `holidays` เชื่อมกับ `bookings` ในลักษณะเชิงเงื่อนไขตามวันที่จอง โดย optionality ของ `bookings` ต่อ `holidays` เป็น 0..N (บางรายการไม่ทับวันหยุด และบางรายการอาจทับมากกว่า 1 วันหยุด)

[Figure 3.1 Placeholder] ERD ของ schema `co_desk` (Core Entities: `roles`, `profiles`, `departments`, `department_capacity_policies`, `bookings`, `holidays`, `booking_audit_logs`)

*คำบรรยายรูปที่ 3.1: แผนภาพความสัมพันธ์ข้อมูลระดับ conceptual-logical สำหรับระบบจองที่นั่งเข้าออฟฟิศ*

[Figure 3.2 Placeholder] Process Flow: Booking Request -> Conflict/Capacity Validation -> Holiday Warning/Confirm -> Persist Booking -> Audit Log -> Reporting Views

*คำบรรยายรูปที่ 3.2: แผนภาพลำดับกระบวนการตรวจสอบกติกาธุรกิจก่อนบันทึกการจอง*

## 3.6 การออกแบบการตรวจสอบข้อมูลและกติกาทางธุรกิจ
การตรวจสอบข้อมูลถูกออกแบบให้ทำงานสองชั้น คือชั้นธุรกิจของระบบและชั้นฐานข้อมูล เพื่อให้ลดโอกาสข้อมูลผิดกติกาในกรณีมีการใช้งานพร้อมกัน กติกาสำคัญข้อแรกคือการป้องกันผู้ใช้เดิมจองช่วงเวลาซ้อนกัน โดยตีความช่วงเวลาการจองจาก `booking_date_start/booking_date_end` และ `start_hour_24/end_hour_24` (กรณี `single_day` ให้ถือเป็นทั้งวัน) แล้วตรวจ overlap ก่อนบันทึกทุกครั้ง พร้อมยกเว้นรายการที่ถูกยกเลิกแล้วเท่านั้น

กติกาข้อที่สองคือการควบคุมความจุของฝ่ายงานแบบ `limited/unlimited` หากฝ่ายอยู่ในโหมด `limited` ระบบต้องตรวจจำนวนการจองที่ active ของฝ่ายนั้นในวันหรือช่วงเวลาเดียวกันว่าไม่เกิน `capacity_per_day` ตามนโยบายที่มีผลบังคับใช้ หากอยู่ในโหมด `unlimited` ให้ข้ามการจำกัดจำนวนแต่ยังคงตรวจ booking overlap รายบุคคลตามปกติ กติกาข้อที่สามคือการจองตรงวันหยุด ซึ่งอนุญาตให้จองได้ แต่ต้องมีสถานะยืนยันคำเตือน (`holiday_warning_acknowledged = true`) ก่อนบันทึกจริง ข้อสุดท้ายคือการมองเห็นข้อมูลปฏิทินและรายงาน ต้องยึด role และฝ่ายงานตาม requirement โดยไม่อนุญาตให้ผู้ใช้ข้ามขอบเขตข้อมูลของตน

## 3.7 การออกแบบการควบคุมสิทธิ์ (Role + Database Level)
การควบคุมสิทธิ์ใช้แนวทางผสาน RBAC และ RLS โดย RBAC กำหนดขอบเขตฟังก์ชันที่ผู้ใช้เห็นบนระบบ ส่วน RLS กำหนดขอบเขตข้อมูลที่อนุญาตให้เข้าถึงได้จริงในระดับแถวข้อมูล บทบาท `employee` และ `hr` จะเห็นข้อมูลปฏิทินเฉพาะฝ่ายเดียวกัน โดย `hr` มีสิทธิ์จัดการข้อมูลฝ่ายและพนักงานรวมถึงดูรายงานได้ แต่จองแทนผู้อื่นไม่ได้ ขณะที่ `admin` สามารถจอง แก้ไข ยกเลิก และมองเห็นข้อมูลทุกฝ่าย รวมถึงสร้างผู้ใช้และกำหนดบทบาทได้

ในระดับฐานข้อมูล การออกแบบ policy เน้นเงื่อนไขการอนุญาตตามตัวตนผู้ใช้ที่มาจาก Supabase Auth และความสัมพันธ์ในตาราง `profiles` เพื่อบังคับใช้กติกาเดียวกับภาคธุรกิจ ลดความเสี่ยงจากการเรียกข้อมูลโดยข้าม business layer และรักษาความสอดคล้องของสิทธิ์ระหว่างหน้าจอ API และฐานข้อมูล

## 3.8 การออกแบบรายงานด้วย Database Views
เพื่อรองรับงานบริหาร ระบบกำหนดรายงานจาก database views อย่างน้อย 5 มุมมอง และจำกัดการเข้าถึงไว้ที่ `hr` กับ `admin` โดยตัวอย่าง views ที่วางแผนไว้มีดังนี้

| View | วัตถุประสงค์ | กลุ่มผู้ใช้ที่เห็น |
|---|---|---|
| `co_desk.vw_department_daily_utilization` | สรุปจำนวนจองเทียบความจุรายฝ่ายต่อวัน | `hr`, `admin` |
| `co_desk.vw_booking_calendar_monthly` | สรุปรายการจองรายเดือนสำหรับปฏิทิน | `hr`, `admin` |
| `co_desk.vw_user_booking_history` | ติดตามประวัติการจองรายบุคคล | `hr`, `admin` |
| `co_desk.vw_holiday_booking_summary` | สรุปการจองที่ตรงวันหยุดและสถานะการยืนยัน | `hr`, `admin` |
| `co_desk.vw_booking_audit_trail` | ติดตามการแก้ไข/ยกเลิกย้อนหลังจาก audit logs | `hr`, `admin` |

การออกแบบ views ในลักษณะนี้ช่วยให้การสร้างแดชบอร์ดรายงานทำได้เป็นระบบ และสอดคล้องกับ requirement ที่ต้องรองรับการกรองข้อมูลเชิงคอลัมน์ในภายหลัง โดยไม่ต้องทำให้โครงสร้างธุรกรรมหลักซับซ้อนเกินความจำเป็น

## 3.9 ตารางสรุป Requirement ID -> Entity/Rule/Process Mapping

| Requirement ID | Entity ที่เกี่ยวข้อง | Rule/Constraint ที่รองรับ | Process ที่รองรับ |
|---|---|---|---|
| `SB-02`, `SB-05`, `CLR-03` | `bookings` | รองรับ `single_day` และ `time_range` โดยไม่ลงนาที | สร้างรายการจอง |
| `SB-03`, `CLR-02` | `bookings`, `profiles` | อนุญาตย้อนหลัง/ล่วงหน้า ภายใต้ role | ตรวจสิทธิ์ก่อนบันทึก |
| `SB-04` | `bookings` | ห้าม user เดิมจองช่วงเวลาซ้อน | Conflict validation |
| `SB-06`, `ROLE-01`, `ROLE-02`, `ROLE-03` | `profiles`, `roles`, `bookings` | จำกัดการจองตามบทบาท (admin จองแทนได้, hr/employee จองตนเอง) | Booking authorization |
| `SB-08` | `bookings`, `booking_audit_logs` | สิทธิ์แก้ไข/ยกเลิกตามเจ้าของหรือ admin | Edit/Cancel workflow |
| `SB-09`, `DEP-03`, `DEP-03A`, `DEP-03B`, `CLR-05` | `departments`, `department_capacity_policies`, `bookings` | ตรวจ capacity limited/unlimited และไม่ให้เกินความจุ | Capacity validation |
| `SB-10`, `FMT-01` | `profiles`, `departments`, `bookings` | บังคับ `Asia/Bangkok`, 24 ชั่วโมง, แสดงผลวันที่ `YYYY-MM-DD` | Date-time normalization |
| `CAL-03`, `REP-02`, `UR-02` | `profiles`, `roles`, reporting views | จำกัดการมองเห็นตาม role และฝ่าย | Calendar/Report access control |
| `HOL-03` | `holidays`, `bookings` | เตือนและยืนยันเมื่อจองตรงวันหยุด | Holiday confirmation flow |
| `REP-01`, `CLR-01` | reporting views ทั้งชุด | ต้องมีอย่างน้อย 5 views | Reporting dashboard pipeline |
| `AUTH-01`, `SEC-01` | `profiles` + Supabase Auth | RBAC + RLS ระดับฐานข้อมูล | AuthN/AuthZ enforcement |
| `UR-04` | `roles`, `profiles` | จำกัดการสร้างผู้ใช้ให้ admin | User provisioning |

## 3.10 สรุปบท
บทนี้เสนอวิธีดำเนินการที่เชื่อมโยงปัญหาธุรกิจเข้ากับการออกแบบระบบแบบ Database-first โดยกำหนดโครงสร้างข้อมูล ความสัมพันธ์ กติกาธุรกิจ และการควบคุมสิทธิ์ไว้ตั้งแต่ต้นทาง เพื่อให้สามารถพัฒนาระบบต่อได้อย่างมีทิศทางเดียวกันและตรวจสอบย้อนกลับกับ requirement ได้ชัดเจน โดยเฉพาะกติกาวิกฤต ได้แก่ การป้องกันจองซ้อน การควบคุมความจุแผนก การยืนยันการจองวันหยุด และการมองเห็นข้อมูลตามบทบาทภายใต้ Supabase Auth/RLS ทั้งนี้มาตรฐานวันเวลา `YYYY-MM-DD` และ `Asia/Bangkok` ถูกยืนยันเป็น baseline กลางสำหรับทุกโมดูลในระยะพัฒนาถัดไป
