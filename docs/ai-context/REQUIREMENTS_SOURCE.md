# REQUIREMENTS_SOURCE

## Raw Requirement (Verbatim) - 2026-02-21 (Phase Setup)

```text
คุณคือ Senior Full-Stack Engineer, Database Architect และ Technical Writing Assistant

เป้าหมายปัจจุบัน (ลำดับความสำคัญสูงสุด):
จัดเตรียม deliverables สำหรับ Short Paper บทที่ 1–3 ก่อน (บทนำ, ทฤษฎี/หลักการที่เกี่ยวข้อง, วิธีดำเนินการ) ก่อนการพัฒนาระบบเต็มรูปแบบ

ข้อมูลโครงการ:
- ชื่อโครงการ: co_desk
- ชื่อ schema ใน PostgreSQL: co_desk

Tech stack (ยึดตามนี้):
- Frontend: React + TypeScript
- Backend: ASP.NET Core Web API (.NET 10)
- Database/Auth: Supabase PostgreSQL + Supabase Auth + RLS
- UI: Tailwind CSS + shadcn/ui
- Calendar: FullCalendar
- Reporting Table: TanStack Table
- Charts: Recharts
- Date/Time: dayjs + timezone plugin (Asia/Bangkok)

ข้อกำหนดบังคับ:
- ปฏิบัติตามแนวทาง best practice จากไฟล์ `skills.sh` ภายในโปรเจกต์ (ถูก import ไว้แล้ว) และถือเป็นข้อบังคับ
- ห้ามข้าม requirement เชิงธุรกิจที่ให้มา แต่ใน phase นี้ให้โฟกัสเฉพาะ deliverables ที่จำเป็นต่อบทที่ 1–3
- ต้องบันทึก context ทั้งหมดลงใน repo เพื่อให้ทำงานต่อข้ามเครื่องได้
- ในขั้นตอนนี้ยังไม่ต้องเขียน implementation code เว้นแต่สั่งโดยตรง

สำหรับ phase นี้ ให้สร้างผลลัพธ์ดังนี้:
1) เอกสารช่วยเขียนบทที่ 1–3 (ภาษาไทย, โทนวิชาการ)
2) artifacts ฝั่งฐานข้อมูลแบบ database-first (ERD-ready schema design, entities, attributes, relationships)
3) requirement traceability สำหรับบทที่ 1–3
4) บันทึกรายละเอียดที่ต่อยอดไป implementation ได้ภายหลัง

สร้าง/อัปเดตไฟล์ต่อไปนี้:
- docs/ai-context/MASTER_CONTEXT.md
- docs/ai-context/SESSION_LOG.md
- docs/ai-context/HANDOFF.md
- docs/ai-context/PROMPT_HISTORY.md
- docs/ai-context/REQUIREMENTS_SOURCE.md
- docs/short-paper/ch01-introduction-draft.md
- docs/short-paper/ch02-related-theory-draft.md
- docs/short-paper/ch03-methodology-draft.md
- docs/short-paper/requirements-for-paper.md
- docs/short-paper/erd-design-notes.md
- docs/short-paper/glossary.md

เริ่มต้นโดย:
1) อ่าน/ตรวจสอบ best pactics จาก skills ตามpath /Users/krissanap/Document/KMUTT/Short Paper/CoDesk/.agents ที่คุณlist มาให้ก่อนหน้านี้และสรุปแนวปฏิบัติที่ต้องใช้
2) สร้างไฟล์ docs/ai-context/*
3) เตรียมพร้อมรับ requirements เต็มใน prompt ถัดไป
4) เมื่อได้รับ requirements แล้ว ให้เก็บลง REQUIREMENTS_SOURCE.md แบบ verbatim (ไม่ย่อ)
```

## Raw Requirement (Verbatim) - 2026-02-21 (Business Requirements Set)

```text
Functional Features (ฟีเจอร์เชิงธุรกิจ/ผู้ใช้ใช้งานได้)
1)	ระบบจองที่นั่ง (Seat Booking)
•	ฟอร์มจองเข้าออฟฟิศ
•	รองรับการจองแบบ รายวัน (Single Day) และ ช่วงวัน/ช่วงเวลา
•	สามารถจองข้ามวัน จองย้อนหลัง จองล่วงหน้าได้ ไม่จำกัด
•	User แต่ละ user ไม่สามารถจองซ้ำซ้อนได้ ในช่วงเวลาเดียวกัน(แจ้งว่ามีการจองไปแล้ว)
•	Single Day คือ ทั้งวัน
•	เลือกพนักงาน / ฝ่ายงาน(default ตามuser นั้นๆ) จองได้เฉพาะuserตัวเอง แต่role admin สามารถจองให้ใครก็ได้ มีให้เลือกว่าจะจองให้user ไหน แต่ default user ตัวเอง และมี dropdown ให้เลือก user
•	บันทึกการจอง / ล้างฟอร์ม
•	ยกเลิกการจอง/แก้ไขการจอง ทำได้เฉพาะ User ตัวเอง ยกเว้นadmin สามารถ ยกเลิก/แก้ไข ได้ทุกuser
•	ตรวจสอบช่วงเวลาซ้อนทับ (conflict) และ over-capacity ตามกติกาแผนก
•	Timezone Asia/Bangkok 24 ชั่วโมงเท่านั้น
2)	Availability Calendar / ปฏิทินการใช้งาน
•	แสดงปฏิทินรายนเดือนเพื่อดูความพร้อมใช้งานของที่นั่ง
•	เห็นการจองในแต่ละวัน
•	มีข้อกำหนดตาม role/ฝ่าย (เช่น hr และ employeesเห็นเฉพาะคนในฝ่ายเดียวกันและเห็นชื่อคนจองด้วยแต่adminสามารถเห็นปฏิทินของทุกฝ่าย)
•	เปลี่ยนเดือนปฏิทินได้
3)	จัดการฝ่ายงาน (Department Management)
เห็นเฉพาะ Role Hr และ Admin เท่านั้น
•	เพิ่ม/แก้ไข/ลบฝ่ายงาน
•	กำหนดความจุ/จำนวนที่นั่งต่อวัน (capacity)  จองแล้วนับจำนวนคนในฝ่าย/วัน/ช่วงเวลาเทียบ capacity ไม่มี seat master รายตัว
o	limited seat จำกัดจำนวนที่นั่งในฝ่ายต่อวัน
o	unlimited seat ไม่จำกัดจำนวนที่นั่งในฝ่ายต่อวัน
•	เปิด/ปิดใช้งานฝ่าย 
4)	จัดการพนักงาน (Employee Management)
menu นี้ใช้ได้เฉพาะ Role Hr และ Admin เท่านั้น
•	เพิ่ม/แก้ไข/ลบพนักงาน 
•	กำหนดรหัสพนักงาน / ชื่อ / ฝ่ายงาน / สถานะใช้งาน
•	แสดงรายการพนักงานเป็นตาราง
5)	จัดการวันหยุด (Holiday Management)
•	เพิ่ม/แก้ไข/ลบวันหยุด
•	ระบุชื่อวันหยุด / รายละเอียด / 
•	สามารถจองตรงกับวันหยุดได้ แต่ต้องแจ้งเตือนด้วยว่าวันที่จองเป็นวัน หยุด ต้องการจองวันนั้นๆจริงหรือไม่ (warning popup + ต้องกด confirm)
6)	รายงาน (Reporting Dashboard)
มีรายงานหลายมุมมอง (อย่างน้อยประมาณ 5 รายงานจาก views)
•	คนที่เห็น รายงานมีแค่ hr กับ admin เท่านั้น
•	ทุกcolumn ในรายงาน สามารถ filter column ได้ทั้งหมด filterที่column nameเหมือนexcel (Excel-like Column Filter Menu หรือ Advanced Column Menu Filtering)
7)	ระบบผู้ใช้และสิทธิ์ (Users / Roles / RBAC)
•	Role หลัก: employee, hr, admin
•	แสดงเมนู/สิทธิ์ตาม role
•	มีหน้า “ผู้ใช้” สำหรับสร้าง user 
•	จำกัดการสร้าง user ให้เฉพาะ admin เท่านั้น 
8)	Authentication / Login
•	เข้าสู่ระบบผ่าน Supabase Auth
•	มี DEMO users / DEMO mode สำหรับสาธิต flow (จาก UI และ README) 
9)	Role
	-admin
	Admin ทำได้ทุกอย่าง เห็นทุก menu สร้าง User ได้ พร้อมกำหนด role ให้ User นั้น
	- hr
	สร้าง ฝ่ายงาน จองที่นั่ง สามารถเห็น และเห็นปฏิทินของตัวเองและคนในฝ่ายเดียวกัน และดูรายงานได้
	- employees
	จองที่นั่งของตัวเองและเห็นปฏิทินการจองได้ และเห็นปฏิทินของตัวเองและคนในฝ่ายเดียวกัน

หมายเหตุ format date ทั้งหมด ต้องเป็น YYYY-MM-DD เท่านั้น
```

## Raw Requirement (Verbatim) - 2026-02-21 (Clarification Answers)

```text
ตอบ ความกำกวมที่ยังมี:

“อย่างน้อยประมาณ 5 รายงานจาก views” ต้อง fix เป็น 5 ตายตัวหรือไม่
ตอบ อย่างน้อย 5 รายงาน

“จองย้อนหลังไม่จำกัด” มีข้อยกเว้นด้านสิทธิ์/audit หรือไม่
ตอบ ตามroleของuser นั้นๆที่บอกไปแล้ว

นิยามช่วงเวลา (วัน/ชั่วโมง/นาที) ต้องละเอียดระดับใด
ตอบ จองทั้งวัน หรือ เลือกช่วงเวลา ไม่ต้องลงถึงนาที

ขอบเขตการมองเห็นของ HR กรณีดูแลหลายฝ่าย
นโยบาย concurrency เมื่อเกิด over-capacity พร้อมกัน
ตอบ Hr จองที่นั่งได้เฉพาะของตัวเองและเห็นปฏิทินของฝ่ายเดียวกันเท่า แต่สามารถเพิ่ม/ลด/แก้ไข/จัดการพนักงานและฝ่ายได้ แต่ไม่สามารถจองให้ใครได้
```
