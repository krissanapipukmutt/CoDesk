# PROMPT_HISTORY

## 2026-02-21

### Prompt A (ก่อนหน้า)
ผู้ใช้กำหนดบทบาทและเป้าหมายให้เตรียม deliverables บทที่ 1–3 พร้อมระบุ stack และรายการไฟล์ที่ต้องสร้าง

### Prompt B
ผู้ใช้ย้ำบทบาทเดิม ปรับชื่อโครงการเป็น `co_desk` และสั่งให้:
1. อ่าน/สรุป best practices จาก skills ใน path `.agents`
2. สร้างไฟล์ `docs/ai-context/*`
3. เตรียมพร้อมรับ requirements เต็ม prompt ถัดไป
4. เมื่อได้รับ requirements แล้วต้องเก็บลง `REQUIREMENTS_SOURCE.md` แบบ verbatim

### Prompt C
ผู้ใช้ส่ง Business Requirements เต็ม และสั่งให้:
1. เก็บ requirement ดิบแบบ verbatim ลง `docs/ai-context/REQUIREMENTS_SOURCE.md`
2. จัดกลุ่ม requirement เป็น 5 หมวดสำหรับบทที่ 1–3
3. ให้รหัส requirement ทุกข้อและทุกข้อย่อย
4. แยกข้อที่จำเป็นต่อ narrative กับรายละเอียด implementation ภายหลัง
5. สร้าง traceability ตาราง `Requirement ID -> Chapter 1/2/3`
6. ห้ามตกหล่นกติกาหลัก: role employee/hr/admin, booking conflict, capacity, holiday warning, reporting views, Supabase Auth/RLS, timezone Asia/Bangkok, date format YYYY-MM-DD
7. หากข้อใดไม่ถูกจัดหมวดหรือไม่มีรหัส ต้องรายงานเป็น BLOCKER

### Prompt D
ผู้ใช้ส่งคำตอบปิดประเด็นกำกวมเพิ่มเติม โดยยืนยัน:
1. รายงานจาก views อย่างน้อย 5 รายงาน
2. การจองย้อนหลังไม่จำกัด แต่บังคับตาม role
3. เวลาใช้รูปแบบทั้งวันหรือช่วงเวลา ไม่ต้องละเอียดถึงนาที
4. HR จองได้เฉพาะตัวเอง เห็นปฏิทินฝ่ายเดียวกัน จัดการพนักงาน/ฝ่ายได้ แต่จองแทนผู้อื่นไม่ได้

### Prompt E
ผู้ใช้สั่งร่าง Short Paper บทที่ 1 (บทนำ) ภาษาไทยเชิงวิชาการ สำหรับโครงการ codesk โดยกำหนด:
1. ไฟล์ผลลัพธ์ `ch01-introduction-draft.md`, `SESSION_LOG.md`, `PROMPT_HISTORY.md`
2. ต้องอ่านแหล่งอ้างอิงภายในก่อนเขียน (`REQUIREMENTS_SOURCE`, `requirements-for-paper`, `MASTER_CONTEXT`, และ `DECISIONS.md` ถ้ามี)
3. เนื้อหาต้องครอบคลุม 1.1–1.5 ในรูปแบบย่อหน้า ไม่ใช้ bullet list
4. ต้องสะท้อนบริบทเทคโนโลยีและข้อกำหนดสำคัญ (RBAC, booking conflict, capacity, reporting, Supabase Auth/RLS, timezone Asia/Bangkok, date format YYYY-MM-DD)

### Prompt F
ผู้ใช้สั่งร่าง Short Paper บทที่ 2 (ทฤษฎี/หลักการที่เกี่ยวข้อง) ภาษาไทยเชิงวิชาการ โดยกำหนด:
1. อัปเดต `ch02-related-theory-draft.md`, `reference-placeholders.md`, `SESSION_LOG.md`, `PROMPT_HISTORY.md`
2. ต้องอ่าน `REQUIREMENTS_SOURCE.md`, `requirements-for-paper.md`, `MASTER_CONTEXT.md` ก่อนเขียน
3. ต้องอธิบายการนำทฤษฎี/เทคโนโลยีมาใช้ในโครงการและเหตุผล
4. ต้องใส่ citation placeholder แบบตัวเลข [1], [2], [3]...
5. ต้องเปรียบเทียบ Supabase PostgreSQL กับ Oracle ทั้งมุมความเหมือน/ความต่าง
6. ต้องสร้างรายการ placeholder references แยกตามหมวดที่กำหนด

### Prompt G (ล่าสุด)
ผู้ใช้สั่งปรับบทที่ 2 และไฟล์ reference placeholders ให้พร้อมส่งอาจารย์ โดยกำหนดว่า:
1. จำนวนอ้างอิงในบทที่ 2 ต้องไม่เกิน 8 แหล่ง
2. ใช้ citation placeholders ได้แค่ `[1]` ถึง `[8]`
3. `reference-placeholders.md` ต้องมีหัวข้ออ้างอิง, URL และรูปแบบ IEEE draft ครบทุกรายการ
4. ลดการอ้างซ้ำซ้อน ปรับสำนวนให้เป็นธรรมชาติ และคงสาระหลักให้ครบ
5. อัปเดต `SESSION_LOG.md`, `PROMPT_HISTORY.md`, `HANDOFF.md`

### Response Strategy ที่ใช้ใน Prompt C-G
- ใช้แนวทางจาก skills: `database-schema-designer`, `postgresql-table-design`, `supabase-postgres-best-practices`
- แปลง requirement ดิบเป็น structured analysis ภาษาไทยเชิงวิชาการสำหรับบทที่ 1–3
- เพิ่ม guardrail `SEC-01` สำหรับ RLS เพื่อไม่ให้ข้อกำกับด้านความปลอดภัยตกหล่น
- เพิ่ม clarification requirements `CLR-01..CLR-05` เพื่อปิดความกำกวมเชิง business rule
- ร่างบทที่ 1 ใหม่ทั้งหมดให้เป็นย่อหน้าเชิงวิชาการตามหัวข้อ 1.1–1.5 และตรวจความสอดคล้องกับ requirement ล่าสุดทั้งหมด
- ร่างบทที่ 2 ใหม่ตามโครง 2.1–2.6 พร้อม citation placeholders และไฟล์ reference placeholders สำหรับการเติมแหล่งอ้างอิงจริงภายหลัง
- ปรับบทที่ 2 ให้ลดความหนาแน่นของ citation และจำกัดอ้างอิงเหลือไม่เกิน 8 แหล่ง พร้อม URL และ IEEE draft ที่ใช้งานได้จริง

### Prompt H (ล่าสุด)
ผู้ใช้สั่งร่าง Short Paper บทที่ 3 (วิธีดำเนินการ) โดยเน้นแนวทาง database-first และกำหนดให้:
1. อัปเดต `ch03-methodology-draft.md`, `erd-design-notes.md`, `SESSION_LOG.md`, `PROMPT_HISTORY.md`
2. ต้องอ่าน `REQUIREMENTS_SOURCE.md`, `requirements-for-paper.md`, `MASTER_CONTEXT.md` ก่อนเขียน
3. บทที่ 3 ต้องครอบคลุมวิธีดำเนินการ, stakeholder needs, analysis/design process, database design, ERD summary, data validation/business rules, role+database-level access control, และ reporting views อย่างน้อย 5 views
4. ต้องเสนออย่างน้อย 6 entities และอย่างน้อย 6 attributes ต่อ entity พร้อม relationships และ key constraints สำคัญ (conflict, capacity, holiday warning, role visibility)
5. ต้องระบุ schema `co_desk`, มาตรฐานวันที่ `YYYY-MM-DD`, timezone `Asia/Bangkok`, และมี placeholder สำหรับ ERD/process diagrams
6. ต้องเพิ่มตารางสรุป `Requirement ID -> Entity/Rule/Process mapping`

### Response Strategy สำหรับ Prompt H
- ใช้แนวทางจาก skills: `database-schema-designer`, `postgresql-table-design`, `supabase-postgres-best-practices`
- ปรับร่างบทที่ 3 ใหม่ให้เป็น short paper style เชิงวิชาการและสอดคล้อง requirement ล่าสุด
- ปรับ `erd-design-notes.md` จาก preliminary model เดิมเป็น `co_desk` model ที่ยึด capacity ระดับฝ่ายและ role-based access ตาม business rules
- คงขอบเขต phase ปัจจุบัน: เน้นเอกสารและออกแบบ ไม่เขียน implementation code

### Prompt I (ล่าสุด)
ผู้ใช้สั่งจัดทำ SQL artifacts สำหรับโครงการ `co_desk` ในระดับ database-first design เพื่อรองรับ Short Paper บทที่ 3 โดยกำหนดให้:
1. สร้าง/อัปเดต SQL แยกไฟล์ `01..05` (schema/tables, constraints/indexes, reporting views >= 5, RPC placeholders, optional seed)
2. สร้างเอกสารสรุป `database-ddl-summary.md` และ `reporting-views-design.md`
3. อ่านบริบทภายในทั้งหมดก่อนเขียน และยึด best practices จาก `skills.sh`
4. ครอบคลุมกติกาสำคัญ: role matrix, conflict, capacity limited/unlimited, holiday warning confirm, reporting views, Supabase Auth/RLS, timezone Asia/Bangkok, date format YYYY-MM-DD
5. ถ้ามี assumption/conflict ให้บันทึกใน `DECISIONS.md`

### Response Strategy สำหรับ Prompt I
- ตรวจ requirement และ baseline docs ก่อนลง SQL เพื่อรักษา traceability กับ requirement IDs
- ใช้แนวทางจาก skills: `database-schema-designer`, `postgresql-table-design`, `supabase-postgres-best-practices`
- จัดโครง DDL เป็น 5 ไฟล์ตามลำดับใช้งานจริง (schema -> constraints/index -> views -> rpc -> seed)
- แยกชัดเจนว่า rule ไหนปิดจบด้วย constraints ได้ และ rule ไหนต้องใช้ RPC/transaction/locking ใน phase ถัดไป
- สร้าง reporting views อย่างน้อย 5 รายงานและบันทึก design intent สำหรับ hr/admin

### Prompt J (ล่าสุด)
ผู้ใช้สั่งอัปเดตเอกสาร ERD-ready สำหรับ `co_desk` ให้สามารถนำไปวาด ERD ได้ทันที โดยกำหนดให้:
1. อัปเดต `docs/short-paper/erd-design-notes.md` พร้อมโครงสร้าง entities, attributes/types, PK/FK, relationships/cardinality, business rules mapping, candidate constraints/indexes, Supabase notes, reporting-required fields, และ ERD drawing guidelines
2. เอกสารต้องอ่านต่อได้โดย AI ตัวอื่นโดยไม่ต้องมีประวัติแชต
3. หากพบ entity/attribute ที่ยังไม่รองรับ requirement ให้ระบุ gap พร้อมข้อเสนอการแก้ไข
4. เพิ่มคำสั่งแก้ไข SQL: รวม `01_create_schema_and_tables.sql` และ `02_create_indexes_and_constraints.sql` เป็นไฟล์เดียว โดยสร้าง constraints/indexes คู่กับ table และเรียงลำดับ create table ให้ถูกต้องตาม references

### Response Strategy สำหรับ Prompt J
- ปรับ `erd-design-notes.md` ใหม่ทั้งฉบับให้เป็นสเปก ERD-ready เชิงโครงสร้าง และเพิ่ม gap analysis
- รวม logic schema/tables/constraints/indexes เข้า `database/sql/01_create_schema_and_tables.sql` ตามลำดับ dependency
- ปรับ `database/sql/02_create_indexes_and_constraints.sql` เป็น no-op placeholder เพื่อลดความเสี่ยงรันซ้ำ
- อัปเดต `SESSION_LOG.md` และ `PROMPT_HISTORY.md` ให้สะท้อนการเปลี่ยนแปลงรอบล่าสุด

### Prompt K (ล่าสุด)
ผู้ใช้สั่งสร้าง submission-readiness checklist สำหรับ Short Paper บทที่ 1-3 และให้ตรวจร่างปัจจุบันเทียบ checklist โดยกำหนดให้:
1. สร้าง `docs/short-paper/ch1-3-submission-checklist.md`
2. อัปเดต `HANDOFF.md`, `SESSION_LOG.md`, `PROMPT_HISTORY.md`
3. Checklist ต้องครอบคลุมหัวข้อบังคับของบทที่ 1-3, RBAC/rules/reporting/date-time standards, และ context docs สำหรับทำงานข้ามเครื่อง
4. ตอนท้ายต้องสรุปรายการที่ยังขาดเป็น blockers, ระดับความพร้อมส่ง, และเสนอ prompt ถัดไป

### Response Strategy สำหรับ Prompt K
- ตรวจไฟล์ร่างบทที่ 1-3 และเอกสาร context ปัจจุบันโดยตรง แล้วประเมินตามเกณฑ์แบบ PASS/PARTIAL/FAIL
- สรุปหลักฐานอ้างอิงรายข้อเพื่อให้ตรวจย้อนกลับได้
- ระบุ blockers เฉพาะที่มีผลต่อความพร้อมส่งจริง และให้ prompt ถัดไปสำหรับปิดงานในรอบเดียว

### Prompt L (ล่าสุด)
ผู้ใช้สั่งปิด session โดยกำหนดให้ทำ cross-machine handoff persistence และบังคับอัปเดต `README.md` ให้สอดคล้องกับการเปลี่ยนแปลงทั้งหมดของ session นี้ โดยต้อง:
1. อัปเดต `MASTER_CONTEXT.md`, `SESSION_LOG.md`, `HANDOFF.md`, `PROMPT_HISTORY.md`, `OPEN_TASKS.md` (ถ้ามีงานค้าง), และ `README.md`
2. ทำให้ README ครอบคลุมหัวข้อบังคับทั้งหมด (scope, schema, tables, constraints, views, rpc, roles, auth, date/time standards, setup/run, env vars, demo, testing, short paper mapping, AI continuation)
3. บันทึกใน HANDOFF ให้ครบ 9 ส่วน (status, done/not done, session changes, README changes, assumptions, human review, next prompt, priority files, validation commands)
4. สรุปท้าย session ให้ระบุชัดว่า README updated: Yes/No พร้อมรายการไฟล์ที่เปลี่ยนและงานคงค้างตามลำดับความสำคัญ

### Response Strategy สำหรับ Prompt L
- ตรวจสถานะไฟล์จริงใน repo ก่อนเขียน เพื่อลดความคลาดเคลื่อนจากการสรุปด้วยความจำ
- rewrite `README.md` ทั้งไฟล์เพื่อให้ไม่ล้าหลังเอกสาร/SQL ของรอบงานล่าสุด
- อัปเดต context docs ให้ snapshot/phase/status ตรงกันทุกไฟล์
- สร้าง `OPEN_TASKS.md` เพื่อคุมงานค้างอย่างชัดเจนสำหรับการทำงานต่อข้ามเครื่อง
- ปิดงานด้วย handoff ที่เครื่องถัดไปเปิดแล้วทำต่อได้ทันทีโดยไม่พึ่งประวัติแชต

### Prompt M (ล่าสุด)
ผู้ใช้สั่งตรวจ SQL ใน `database/sql` ให้ run-ready บน Supabase/PostgreSQL โดยกำหนดให้:
1. ตรวจไฟล์ `01`, `03`, `04`, `05` เท่านั้น (ไม่ต้องตรวจ `02`)
2. ตรวจทั้ง syntax, dependency, naming consistency, Supabase compatibility, และลำดับการรัน
3. ต้องทำ dry-run execution จริงตามลำดับ `01 -> 03 -> 04 -> 05`
4. หากพบ error ต้องแก้ไฟล์ทันทีจนผ่าน
5. ต้องมี verification หลังรัน (schema/tables/views/functions/seed)
6. อัปเดต `README.md` และ `docs/ai-context/*` ให้สะท้อนผลการตรวจ/การแก้ไข

### Response Strategy สำหรับ Prompt M
- อ่าน SQL เป้าหมายทั้งหมดแบบ static เพื่อตรวจ dependency และ naming ก่อน execute
- พยายามใช้ Docker สำหรับ dry-run ก่อน แต่ daemon ไม่พร้อมใช้งาน จึงติดตั้ง PostgreSQL local (Homebrew) เพื่อรันทดสอบจริงแทน
- รัน execute test ด้วย `psql -v ON_ERROR_STOP=1` ตามลำดับไฟล์ที่กำหนด
- รันซ้ำรอบที่สองบนฐานเดิมเพื่อเช็ก idempotency เชิงปฏิบัติ
- รัน verification queries และ smoke tests ของ views/functions เพื่อยืนยัน compile/runtime readiness
- อัปเดต README + ai-context files ให้มีหลักฐานการตรวจสอบจริงที่ตรวจย้อนกลับได้

### Prompt N (ล่าสุด)
ผู้ใช้สั่งอัปเดตเอกสาร Short Paper บทที่ 1-3 และ context docs ให้สะท้อน requirement ใหม่ว่า:
1. `admin` ต้องสร้างผู้ใช้ใหม่ใน Supabase Auth (`auth.users`) ผ่านหน้าเว็บได้
2. การสร้างผู้ใช้ต้องผ่าน backend/server-side secure endpoint เท่านั้น
3. ห้าม expose service role key ใน frontend
4. หลังสร้าง auth user สำเร็จ ต้อง sync `co_desk` profile/role/department/status
5. ต้องมี validation (email duplicate, role, department, status) และควรมี audit log สำหรับ user management โดย admin
6. งานรอบนี้เป็น design/documentation update เท่านั้น ห้ามเขียน implementation code
7. ต้องอัปเดต README และ handoff ให้พร้อมทำงานต่อข้ามเครื่อง

### Response Strategy สำหรับ Prompt N
- เพิ่ม requirement ใหม่แบบ verbatim ลง `REQUIREMENTS_SOURCE.md`
- แปลง requirement extension เป็น requirement IDs ใหม่ใน `requirements-for-paper.md` พร้อม traceability และ chapter relevance
- ปรับบทที่ 1 ให้สะท้อน scope ใหม่ของ admin provisioning โดยไม่ลง implementation detail ลึกเกินไป
- ปรับบทที่ 2 เพิ่มหลักการ secure administrative provisioning เชื่อม RBAC/least privilege/secret management
- ปรับบทที่ 3 เพิ่ม flow `Admin UI -> Backend -> Supabase Auth Admin -> Profile Sync`, validation rules, security constraints, และ audit design intent
- ปรับ ERD design notes ให้รองรับ governance entity/log แบบ proposed (ยังไม่สร้าง SQL ใน phase นี้)
- อัปเดต DECISIONS, SESSION_LOG, HANDOFF, README ให้พร้อม handoff ข้ามเครื่อง และยืนยันว่าไม่ได้เขียน implementation code

### Prompt O (ล่าสุด)
ผู้ใช้สั่ง Review การออกแบบฐานข้อมูลอีกรอบ โดยโฟกัสให้ `docs/short-paper/erd-design-notes.md` ถูกต้องครบถ้วนและพร้อมนำไปวาด ER Diagram ต่อเอง โดยกำหนดให้:
1. ตรวจความสอดคล้องกับ requirements และ SQL จริง
2. ตรวจ entities/attributes/relationships/cardinality/keys และ business rules สำคัญ
3. อัปเดต `erd-design-notes.md` ให้เป็น ERD-ready
4. สร้าง `docs/short-paper/erd-finalization-notes.md`
5. อัปเดต `SESSION_LOG.md`, `HANDOFF.md`, `PROMPT_HISTORY.md`, และ `DECISIONS.md` (ถ้ามี)
6. อัปเดต `README.md` เฉพาะกรณีที่มีการเปลี่ยน DB design summary จริง
7. ห้ามเขียน implementation code ใหม่

### Response Strategy สำหรับ Prompt O
- ใช้แนวทางจาก skills: `database-schema-designer`, `postgresql-table-design`, `supabase-postgres-best-practices`
- ทำ review เทียบ requirement-to-DDL โดยยึด `database/sql/01_create_schema_and_tables.sql` เป็น physical source of truth
- ปรับ `erd-design-notes.md` ให้ชัดเจนใน 3 ชั้น: physical baseline, conceptual relation, future proposal
- สร้าง `erd-finalization-notes.md` เป็น checklist สำหรับผู้วาด ERD เพื่อลดความกำกวมในการวาดภาพ
- อัปเดต context docs ให้พร้อม handoff ข้ามเครื่อง และบันทึกเหตุผลที่ไม่แก้ README หากไม่มีการเปลี่ยน schema จริง
