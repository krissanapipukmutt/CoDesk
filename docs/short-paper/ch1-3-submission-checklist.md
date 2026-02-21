# Short Paper Chapter 1-3 Submission Readiness Checklist

## 1) วัตถุประสงค์
เอกสารนี้ใช้ตรวจความพร้อมส่งของ Short Paper บทที่ 1-3 สำหรับโครงการ `co_desk` โดยตรวจเทียบร่างปัจจุบันกับเกณฑ์บังคับเชิงเนื้อหา ความสอดคล้อง requirement และความต่อเนื่องของเอกสาร

เกณฑ์สถานะ:
- `PASS` = ครบตามเกณฑ์
- `PARTIAL` = มีแต่ยังต้องปรับบางจุด
- `FAIL` = ยังไม่ครบ/ขาดสาระสำคัญ

## 2) Checklist Assessment (Current Draft)

| ลำดับ | เกณฑ์ตรวจ | สถานะ | หลักฐานอ้างอิง | หมายเหตุ |
|---|---|---|---|---|
| 1 | บทที่ 1 มีความเป็นมา/ปัญหา/แนวทางแก้/วัตถุประสงค์/ขอบเขต/ประโยชน์ | `PASS` | `docs/short-paper/ch01-introduction-draft.md` | โครง 1.1-1.5 ครบ |
| 2 | บทที่ 1 เขียนเป็นย่อหน้า ไม่เป็น bullet-heavy | `PASS` | `docs/short-paper/ch01-introduction-draft.md` | เป็นย่อหน้าต่อเนื่องชัดเจน |
| 3 | บทที่ 2 อธิบายทฤษฎี/เครื่องมือและการนำมาใช้จริงในโครงการ | `PASS` | `docs/short-paper/ch02-related-theory-draft.md` | มีทั้งแนวคิดและเหตุผลการใช้เครื่องมือ |
| 4 | บทที่ 2 มี citation placeholders `[1]`, `[2]`, ... | `PASS` | `docs/short-paper/ch02-related-theory-draft.md` | ใช้ placeholders `[1]..[8]` |
| 5 | บทที่ 2 อธิบายเหตุผลที่ใช้ Supabase PostgreSQL และเปรียบเทียบกับ Oracle | `PASS` | `docs/short-paper/ch02-related-theory-draft.md` (หัวข้อ 2.5) | ครบทั้งมุมเหมือน/ต่าง |
| 6 | บทที่ 3 อธิบายวิธีดำเนินการ + ความต้องการผู้ใช้ + สรุป ERD/diagram | `PASS` | `docs/short-paper/ch03-methodology-draft.md` (3.1-3.5) | มี figure placeholders |
| 7 | บทที่ 3 มีรายละเอียด entity/attribute/relationship | `PASS` | `docs/short-paper/ch03-methodology-draft.md` (3.4-3.5), `docs/short-paper/erd-design-notes.md` | มีทั้งตาราง entities และ cardinality |
| 8 | มีแผนอย่างน้อย 6 entities และ attributes เพียงพอ (เป้าหมาย >= 6/entity) | `PASS` | `docs/short-paper/ch03-methodology-draft.md`, `docs/short-paper/erd-design-notes.md` | มี 7+ entities และ attributes เกินเกณฑ์ |
| 9 | อธิบาย role/RBAC (`employee/hr/admin`) | `PASS` | `docs/short-paper/ch01-introduction-draft.md`, `docs/short-paper/ch02-related-theory-draft.md`, `docs/short-paper/ch03-methodology-draft.md` | ครอบคลุมทั้ง narrative และ design intent |
| 10 | อธิบายกติกา booking conflict / capacity / holiday warning | `PASS` | `docs/short-paper/ch01-introduction-draft.md`, `docs/short-paper/ch03-methodology-draft.md`, `docs/short-paper/erd-design-notes.md` | มี rule mapping และ constraint intent |
| 11 | กล่าวถึง reporting views อย่างน้อย 5 views | `PASS` | `docs/short-paper/ch03-methodology-draft.md`, `docs/short-paper/reporting-views-design.md` | วางแผน 5+ views |
| 12 | ระบุมาตรฐานวันที่ `YYYY-MM-DD` และ timezone `Asia/Bangkok` | `PASS` | `docs/short-paper/ch01-introduction-draft.md`, `docs/short-paper/ch02-related-theory-draft.md`, `docs/short-paper/ch03-methodology-draft.md`, `docs/short-paper/erd-design-notes.md` | ระบุชัดทุกบทหลัก |
| 13 | มีการอัปเดตเอกสาร context สำหรับทำงานข้ามเครื่อง | `PARTIAL` | `docs/ai-context/MASTER_CONTEXT.md`, `docs/ai-context/SESSION_LOG.md`, `docs/ai-context/HANDOFF.md`, `docs/ai-context/PROMPT_HISTORY.md`, `docs/ai-context/REQUIREMENTS_SOURCE.md` | ไฟล์มีครบ แต่ `MASTER_CONTEXT.md` ยังไม่อัปเดต snapshot ล่าสุด |
| 14 | ความสอดคล้องภายในระหว่างบทที่ 3 กับ ERD/SQL artifacts | `PARTIAL` | `docs/short-paper/ch03-methodology-draft.md`, `docs/short-paper/erd-design-notes.md`, `database/sql/01_create_schema_and_tables.sql` | มีบางชื่อฟิลด์/ชื่อ view ต่างกัน (เช่น `start_hour_24` vs `start_at`) |

## 3) Blockers (ถ้ามี)

### B-01: ความสอดคล้องบทที่ 3 กับ ERD/SQL ยังไม่ 100%
- อาการ: ใน `ch03-methodology-draft.md` ยังใช้ชื่อฟิลด์/ชื่อ view บางจุดไม่ตรงกับ ERD-ready spec และ SQL ล่าสุด
- ตัวอย่าง: โมเดลในบทที่ 3 กล่าวถึง `start_hour_24/end_hour_24` แต่ schema SQL ใช้ `start_at/end_at` (timestamptz)
- ผลกระทบ: ผู้อ่านอาจสับสนเมื่อเทียบระหว่าง narrative กับ artifacts เชิงฐานข้อมูล
- ข้อเสนอแก้: ปรับบทที่ 3 ให้ใช้คำศัพท์และชื่อ object เดียวกับ `erd-design-notes.md` และ `database/sql/01_create_schema_and_tables.sql`

### B-02: `MASTER_CONTEXT.md` ยังไม่อัปเดต snapshot รอบล่าสุด
- อาการ: timestamp/snapshot ในไฟล์ยังไม่สะท้อนรอบงานล่าสุด
- ผลกระทบ: handoff ข้ามเครื่องมีโอกาสเข้าใจสถานะล่าสุดคลาดเคลื่อน
- ข้อเสนอแก้: อัปเดต section สถานะปัจจุบัน, artifacts ล่าสุด, และ outstanding risks ให้ตรงกับเอกสารปัจจุบัน

## 4) สรุประดับความพร้อมส่ง
**พร้อมส่งหลังแก้เล็กน้อย**

เหตุผล:
1. โครงเนื้อหาบทที่ 1-3 ครบตาม checklist หลักและมีคุณภาพเชิงวิชาการในระดับส่งได้
2. เหลือการเก็บงานความสอดคล้องภายใน (บทที่ 3 vs ERD/SQL) และอัปเดต context snapshot เพื่อความเรียบร้อยก่อนส่ง

## 5) Prompt ถัดไป (แนะนำเพื่อเก็บงานให้พร้อมส่ง)
ใช้ prompt นี้ได้ทันที:

```text
งาน: เก็บงานรอบสุดท้ายสำหรับ Short Paper บทที่ 1-3 ให้พร้อมส่งอาจารย์

ไฟล์ที่ต้องแก้:
- docs/short-paper/ch03-methodology-draft.md
- docs/ai-context/MASTER_CONTEXT.md
- docs/ai-context/SESSION_LOG.md
- docs/ai-context/PROMPT_HISTORY.md
- docs/ai-context/HANDOFF.md

ข้อกำหนด:
1) ปรับบทที่ 3 ให้ชื่อ entities/attributes/views สอดคล้องกับ:
   - docs/short-paper/erd-design-notes.md
   - database/sql/01_create_schema_and_tables.sql
   - docs/short-paper/reporting-views-design.md
2) อย่าเปลี่ยนสาระ requirement เดิม (role, conflict, capacity, holiday warning, reporting, Supabase Auth/RLS, YYYY-MM-DD, Asia/Bangkok)
3) อัปเดต MASTER_CONTEXT ให้สะท้อนสถานะล่าสุดของ artifacts และความเสี่ยงคงค้าง
4) สรุปท้ายว่าแก้อะไรบ้าง และยืนยันว่า blockers ถูกปิดครบหรือไม่
```
