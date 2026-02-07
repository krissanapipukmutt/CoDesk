# 🏢 CoDesk - ระบบจองที่นั่งเข้าออฟฟิศ

CoDesk เป็นระบบ Single Page Application (SPA) ที่ช่วยให้พนักงานสามารถจองที่นั่งเข้าออฟฟิศได้อย่างมีประสิทธิภาพ รองรับจองวันเดียวหรือช่วงวันยาวๆ พร้อมการควบคุมสิทธิ์ด้วย Row Level Security (RLS) และรายงานการใช้ประโยชน์ที่สำนัก

---

## 📋 สารบัญ
1. [ความเป็นมา](#ความเป็นมา)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [ขั้นตอนการ Install & Run](#ขั้นตอนการ-install--run)
5. [Flow การทำงาน](#flow-การทำงาน)
6. [Role และ Features](#role-และ-features)
7. [Feature ของแต่ละ Role](#feature-ของแต่ละ-role)
8. [Database Schema](#database-schema)
9. [Row Level Security](#row-level-security)
10. [Testing](#testing)

---

## ความเป็นมา

CoDesk ถูกพัฒนาเพื่อแก้ไขปัญหาของการจองที่นั่งออฟฟิศแบบเดิม ซึ่งมักไม่มีระบบเดือนหรือความสะดวก โดยระบบนี้จะช่วย:

- ✅ อนุญาตให้พนักงานจองที่นั่งล่วงหน้า
- ✅ ควบคุมความจุตามแผนก (Department) และกลยุทธ์ที่ต่างกัน
- ✅ สนับสนุน Holiday ด้วยการปิดการจองหรือเตือนพนักงาน
- ✅ มี Role-Based Access Control (RBAC) และ Row Level Security (RLS)
- ✅ จัดเตรียมรายงานการใช้ประโยชน์ที่นั่ง (Utilization Reports)
- ✅ สนับสนุนหลายสำนัก (Multi-Office) ด้วยหลายเขตเวลา (Multiple Timezones)

---

## Tech Stack

### Frontend
| เทคโนโลยี | เวอร์ชัน | วัตถุประสงค์ |
|----------|---------|-----------|
| **React** | 18.3.1 | UI Framework |
| **TypeScript** | 5.6.2 | Static typing |
| **React Router** | 6.23.1 | SPA Routing |
| **TailwindCSS** | 3.4.10 | Styling |
| **Luxon** | 3.5.0 | DateTime & Timezone handling |
| **TanStack React Query** | 5.66.0 | Server state management |
| **Zod** | 3.23.8 | Schema validation |
| **Vite** | 5.4.6 | Build tool |

### Backend
| เทคโนโลยี | เวอร์ชัน | วัตถุประสงค์ |
|----------|---------|-----------|
| **Supabase** | 2.49.1 | Backend-as-a-Service (PostgreSQL) |
| **PostgreSQL** | Latest | Database |
| **RLS** | - | Row-Level Security |
| **RPC** | - | Remote Procedure Calls |

### Testing
| เทคโนโลยี | เวอร์ชัน | วัตถุประสงค์ |
|----------|---------|-----------|
| **Vitest** | 2.1.2 | Unit testing |
| **Playwright** | 1.49.1 | E2E testing |
| **Testing Library** | 14.3.1 | React component testing |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (SPA)                    │
│                   React + TS + Vite                 │
│  ┌──────────────────────────────────────────────┐   │
│  │ Routes: Booking, Holidays, Departments, etc  │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Components: Calendar, Modal, Layout, etc     │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Data Layer: Supabase Repo (RLS-aware)        │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Utils: TZ, Validators, Error Handling        │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                                │
         │ HTTP/JSON                      │ RLS Policy
         │ (VITE_SUPABASE_**)             │ Check
         ▼                                ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (Backend)                     │
│           PostgreSQL + Auth + RLS                   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Tables: offices, departments, seats, etc     │   │
│  │ with RLS policies (Deny-by-default)          │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ RPCs: create_booking, cancel_booking, etc    │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Views: v_bookings_per_day, v_utilization     │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## ขั้นตอนการ Install & Run

### 1️⃣ Prerequisites
- Node.js 16+ และ npm 7+
- Supabase account (หรือใช้ DEMO MODE)
- Git

### 2️⃣ Clone Repository
```bash
git clone <repository-url>
cd CoDesk
```

### 3️⃣ Install Dependencies
```bash
npm install
```

### 4️⃣ ตั้งค่า Environment Variables
```bash
cp .env.example .env
```

แล้วกรอก:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**หมายเหตุ**: ถ้าไม่มี `.env` หรือ Supabase ไม่ถึง แอปจะสลับไปใช้ **DEMO MODE** (ใช้ข้อมูลในเมมโรรี่)

### 5️⃣ ตั้งค่า Database (ตัวเลือก)
ถ้าคุณต้องการใช้ Supabase จริง ให้รัน SQL files ตามลำดับ:
```sql
-- ในลำดับนี้:
1. 000_init.sql      -- สร้าง schema
2. 001_tables.sql    -- สร้างตาราง
3. 002_constraints_indexes.sql
4. 003_rpcs.sql      -- สร้าง stored procedures
5. 004_rls.sql       -- ตั้ง RLS policies
6. 005_views.sql     -- สร้าง views สำหรับรายงาน
7. 006_seed.sql      -- เพิ่มข้อมูลตัวอย่าง
8. 007_grants.sql    -- กำหนดสิทธิ์
```

### 6️⃣ Run Dev Server
```bash
npm run dev
```
เปิด `http://localhost:5173`

### 7️⃣ Build for Production
```bash
npm run build
npm run preview
```

---

## Flow การทำงาน

### User Flow
```
┌─────────────┐
│   Login     │ (Supabase Auth)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Load Profile (Role + Office)   │
│  RLS context set                │
└──────┬──────────────────────────┘
       │
       ├─────────────────┬──────────────────┬──────────────┐
       │                 │                  │              │
       ▼                 ▼                  ▼              ▼
   EMPLOYEE            HR              ADMIN           (Unauthorized)
   Dashboard       Dashboard         Dashboard         Error Page
       │                 │                  │
       │                 │                  │
   ┌───┴──────┐      ┌────┴────┐       ┌────┴────┐
   │           │      │         │       │         │
   ▼           ▼      ▼         ▼       ▼         ▼
 Booking   Reports  Booking  Holidays Admin Users
  Page      Page     Page     Page      Page
```

### Booking Flow (EMPLOYEE)
```
1. Employee เลือก Office + Date Range
2. System ดึง Available Seats จากฐานข้อมูล
3. System ตรวจสอบ:
   - ไม่มี Holiday ที่ 'CLOSED'
   - ที่นั่งยังว่างอยู่
   - ความจุของ Department ยังพอ (ASSIGNED strategy)
4. Employee เลือกที่นั่งและยืนยัน
5. System เรียก RPC `create_booking()` กับ RLS check
6. Booking สร้างขึ้น → Email notification (future)
```

### Holiday Management Flow (HR)
```
1. HR เข้า Holidays page
2. ดู + Edit Holiday ของ Office ของตัวเอง
   - CLOSED: ห้ามจองวันนี้
   - WARNING: อนุญาตจองแต่มีเตือน
3. Save → RLS ตรวจสอบ office_id
4. Employees จะเห็นเตือนตอนจอง
```

---

## Role และ Features

### 🔑 Role Definitions

| Role | สิทธิ์ |
|------|--------|
| **EMPLOYEE** | จองที่นั่งสำหรับตัวเอง, ดูรายงาน, ยกเลิกการจอง |
| **HR** | จัดการ departments, seats, employees, holidays ของ office ของตัวเอง |
| **ADMIN** | ควบคุมทั้งระบบ (สร้าง office, user, etc) |

### 🎫 Department Strategy
```
┌────────────────┬─────────────────────────────────────┐
│   Strategy     │   ลักษณะการจอง                      │
├────────────────┼─────────────────────────────────────┤
│   ASSIGNED     │ ที่นั่งถูกกำหนดให้แต่ละคน          │
│                │ มีการจำกัดความจุต่อวัน              │
│                │ (ตัวอย่าง: Assigned Desk)            │
├────────────────┼─────────────────────────────────────┤
│  UNASSIGNED    │ ที่นั่งอิสระสามารถจองได้ใครก็ได้   │
│                │ นับตามจำนวนจริงของที่นั่ง           │
│                │ (ตัวอย่าง: Hot Desk)                │
└────────────────┴─────────────────────────────────────┘
```

---

## Feature ของแต่ละ Role

### 👤 EMPLOYEE Features

#### 1. 📅 Booking Management
- **Create Booking**
  - เลือก office → date range → seat
  - รองรับ SINGLE_DAY และ DATE_RANGE
  - ตรวจสอบความขัดแย้ง (conflicts)
  - ตรวจสอบความจุ (capacity)
  - ตรวจสอบ Holiday rules

- **View Bookings**
  - ดูการจองของตัวเอง (CONFIRMED/CANCELLED/NO_SHOW)
  - ดูรายละเอียดการจอง (seat, date, status)

- **Cancel Booking**
  - ยกเลิกการจองที่ยังไม่ได้เข้า
  - ระบุเหตุผล (cancel reason)

#### 2. 📊 Reports
- **My Bookings Report**
  - ดูประวัติการจองของตัวเอง
  - Filter ตามสถานะ (Status)

- **Office Overview**
  - ดูการใช้ประโยชน์ที่นั่งของ office
  - Utilization percentage
  - Popular seats

#### 3. ⚙️ Settings (ส่วนขยายในอนาคต)
- เปลี่ยน timezone
- Notification preferences

---

### 🧑‍💼 HR Features

#### 1. 👥 Employee Management
- **Manage Employees**
  - เพิ่ม/แก้ไข/ลบพนักงานในแผนกของตัวเอง
  - ตั้ง Department
  - กำหนด Start Date
  - Enable/Disable account

- **View Employee List**
  - ดูรายชื่อพนักงานทั้งหมด
  - ตรวจสอบ department และ status

#### 2. 🏢 Department Management
- **Create Department**
  - สร้าง department ใหม่
  - เลือก Strategy (ASSIGNED/UNASSIGNED)
  - ตั้ง Daily Capacity (สำหรับ ASSIGNED)
  - Active/Inactive toggle

- **Manage Department**
  - แก้ไข department settings
  - ควบคุม active status

#### 3. 🪑 Seat Management
- **Create Seats**
  - เพิ่มที่นั่งใหม่ให้ department
  - ตั้งรหัสที่นั่ง (seatCode)
  - ตั้งชื่อ (ตัวเลือก)
  - ตั้ง isBookable flag

- **Manage Seats**
  - แก้ไขข้อมูลที่นั่ง
  - Enable/Disable booking

#### 4. 🎉 Holiday Management
- **Create Holiday**
  - เพิ่ม holiday ใหม่สำหรับ office
  - เลือก Rule:
    - **CLOSED**: ห้ามจองวันนี้เลย
    - **WARNING**: อนุญาตจองแต่แสดงเตือน
  - ตั้งชื่อ holiday

- **Manage Holiday**
  - แก้ไข holiday
  - Enable/Disable

#### 5. 📊 Reports
- **Booking Reports**
  - Bookings per Day
  - Department Utilization
  - Popular Seats
  - Status Summary

- **Seat Availability**
  - ดูที่นั่งว่างสำหรับแต่ละวัน
  - ตรวจสอบความจุเหลือ

#### 6. 🔍 Audit & Monitoring
- ดูการกระทำของพนักงาน
- Tracking cancelled bookings

---

### 🛡️ ADMIN Features

#### 1. 🏛️ Office Management
- **Create Office**
  - สร้าง office ใหม่
  - ตั้งรหัส office (code)
  - ตั้ง Timezone (ใช้ IANA format เช่น Asia/Bangkok)
  - Enable/Disable office

- **Manage Office**
  - แก้ไข office settings
  - ดูข้อมูลทั้งหมดของ office

#### 2. 👤 User Management
- **Create User**
  - สร้าง user account ใหม่
  - กำหนด Role (employee/hr/admin)
  - ผูกกับ Department และ Office
  - Set email และชื่อ

- **Manage Users**
  - ลิสต์ user ทั้งหมด
  - แก้ไข role / department
  - ลบ user

#### 3. 📊 System-wide Reports
- ดูรายงานทั้งระบบ (All offices)
- Utilization by Office
- Booking Trends
- User Activity

#### 4. 🔒 Security & Permissions
- ดู RLS policies
- Manage audit logs

---

## Database Schema

### 📊 Entity Relationship Diagram
```
┌─────────────┐
│  Offices    │ (รายชื่อสำนัก)
└──────┬──────┘
       │ 1
       │
       │ N
       ▼
┌──────────────┐         ┌────────────┐
│ Departments  │◄────────┤ Employees  │ (พนักงาน)
└──────┬───────┘         └────────────┘
       │ 1
       │
       │ N
       ▼
┌──────────────┐         ┌─────────┐
│   Seats      │◄────────┤ Profiles│ (User roles)
└──────┬───────┘         └─────────┘
       │ 1
       │
       │ N
       ▼
┌──────────────┐
│  Bookings    │ (การจองที่นั่ง)
└──────────────┘

┌────────────┐
│  Holidays  │ (วันปิดให้บริการ)
└────────────┘
```

### 🗄️ ตารางหลัก

#### `codesk.offices`
```sql
CREATE TABLE offices (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,        -- รหัส office
  name VARCHAR(255),              -- ชื่อ office
  tz VARCHAR(50),                 -- Timezone (IANA format)
  is_active BOOLEAN DEFAULT true
);
```

#### `codesk.departments`
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  office_id UUID REFERENCES offices,
  name VARCHAR(255),              -- ชื่อแผนก
  strategy VARCHAR(20),           -- 'ASSIGNED' | 'UNASSIGNED'
  daily_capacity INT,             -- ความจุต่อวัน (สำหรับ ASSIGNED)
  is_active BOOLEAN DEFAULT true
);
```

#### `codesk.seats`
```sql
CREATE TABLE seats (
  id UUID PRIMARY KEY,
  office_id UUID REFERENCES offices,
  department_id UUID REFERENCES departments,
  seat_code VARCHAR(50),          -- รหัสที่นั่ง
  seat_name VARCHAR(255),         -- ชื่อที่นั่ง
  is_active BOOLEAN DEFAULT true,
  is_bookable BOOLEAN DEFAULT true
);
```

#### `codesk.employees`
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  employee_code VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  department_id UUID REFERENCES departments,
  start_date DATE,
  active BOOLEAN DEFAULT true
);
```

#### `codesk.profiles`
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees,
  role VARCHAR(20),               -- 'employee' | 'hr' | 'admin'
  department_id UUID REFERENCES departments,
  office_id UUID REFERENCES offices,
  email VARCHAR(255),
  name VARCHAR(255)
);
```

#### `codesk.bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  office_id UUID REFERENCES offices,
  department_id UUID REFERENCES departments,
  employee_id UUID REFERENCES employees,
  seat_id UUID REFERENCES seats,
  booking_type VARCHAR(20),       -- 'SINGLE_DAY' | 'DATE_RANGE'
  status VARCHAR(20),             -- 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW'
  start_at TIMESTAMP WITH TIME ZONE, -- UTC ISO
  end_at TIMESTAMP WITH TIME ZONE,   -- UTC ISO
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancel_reason TEXT
);
```

#### `codesk.holidays`
```sql
CREATE TABLE holidays (
  id UUID PRIMARY KEY,
  office_id UUID REFERENCES offices,
  holiday_date DATE,              -- วันที่
  name VARCHAR(255),              -- ชื่อวันหยุด
  rule VARCHAR(20),               -- 'CLOSED' | 'WARNING'
  is_active BOOLEAN DEFAULT true
);
```

### 📈 Views (สำหรับรายงาน)

#### `v_bookings_per_day`
```sql
SELECT
  office_id,
  department_id,
  local_date,
  total_bookings,
  confirmed_bookings,
  cancelled_bookings
FROM codesk.v_bookings_per_day;
```

#### `v_utilization`
```sql
SELECT
  office_id,
  department_id,
  local_date,
  booked_minutes,
  capacity_minutes,
  utilization_pct
FROM codesk.v_utilization;
```

#### `v_popular_seats`
```sql
SELECT
  office_id,
  department_id,
  seat_id,
  booking_count
FROM codesk.v_popular_seats;
```

---

## Row Level Security (RLS)

RLS ใช้ **Deny-by-default** policy ทำให้ปลอดภัย:

### 🔐 RLS Policies by Role

| Table | EMPLOYEE | HR | ADMIN |
|-------|----------|----|----|
| **offices** | ✅ Read own office | ✅ Read own office | ✅ All |
| **departments** | ✅ Read own | ✅ Read/Write own office | ✅ All |
| **seats** | ✅ Read own | ✅ Read/Write own office | ✅ All |
| **employees** | ❌ None | ✅ Read/Write own office | ✅ All |
| **bookings** | ✅ Read/Write own | ✅ Read own office | ✅ All |
| **holidays** | ✅ Read own office | ✅ Read/Write own office | ✅ All |

### Remote Procedure Calls (RPCs)

| RPC | ลักษณะการใช้ |
|-----|-----------|
| `create_booking()` | สร้าง booking ใหม่ (with validation) |
| `cancel_booking()` | ยกเลิก booking |
| `update_booking_status()` | เปลี่ยน status (CONFIRMED → NO_SHOW) |
| `create_user_and_profile()` | สร้าง user (ADMIN only) |

---

## Error Handling

### Error Codes
```typescript
{
  "RLS001": "Access denied - no permission",
  "BOOKING001": "Seat already booked for this date",
  "BOOKING002": "Department capacity exceeded",
  "BOOKING003": "Holiday is CLOSED",
  "BOOKING004": "Invalid date range",
  "HOLIDAY001": "Holiday already exists",
  "DEPT001": "Department not found",
  "SEAT001": "Seat not bookable"
}
```

### Error Handling in Frontend
- RPC errors ยก exception กับ SQLSTATE `P0001`
- Frontend parser แปลงเป็น user-friendly messages
- Toast notifications

---

## Testing

### Unit Tests
```bash
npm test
```
ทดสอบ:
- Date/Timezone utilities
- Validation schemas
- Error parsing
- Availability calculation
- Range segmentation

### Unit Tests with UI
```bash
npm run test:ui
```
เปิด Vitest UI ใน browser

### E2E Tests
```bash
npm run test:e2e
```
ทดสอบ:
- Login flow
- Booking flow
- Holiday management
- Reports generation

---

## DEMO MODE

ถ้าไม่มี Supabase configuration แอปจะใช้ **DEMO MODE**:
```typescript
// src/data/sampleRepo.ts
// ใช้ในเมมโรรี่ data
```

✅ DEMO MODE รองรับ:
- Booking creation & cancellation
- Holiday management
- Reports generation
- ทั้งหมดยกเว้น RLS checks

---

## Development Guide

### Project Structure
```
src/
├── main.tsx                 # Entry point
├── app/
│   └── App.tsx             # Root component + routing
├── routes/
│   ├── login.tsx           # Login page
│   ├── booking.tsx         # Booking page (EMPLOYEE)
│   ├── departments.tsx     # Department management (HR)
│   ├── employees.tsx       # Employee management (HR)
│   ├── holidays.tsx        # Holiday management (HR)
│   ├── reports.tsx         # Reports (HR/ADMIN)
│   ├── adminUsers.tsx      # User management (ADMIN)
│   ├── home.tsx            # Dashboard
│   └── unauthorized.tsx    # 403 page
├── components/
│   ├── Calendar.tsx        # Calendar widget
│   ├── Modal.tsx           # Modal dialog
│   ├── Layout.tsx          # Main layout
│   ├── DemoBanner.tsx      # DEMO MODE indicator
│   └── State.tsx           # Loading/Empty states
├── data/
│   ├── repo.ts             # Repo context
│   ├── repo.tsx            # Repo provider
│   ├── supabaseRepo.ts     # Supabase implementation
│   ├── sampleRepo.ts       # DEMO MODE implementation
│   ├── reportBuilders.ts   # Report queries
│   ├── supabaseClient.ts   # Supabase client setup
│   └── types.ts            # Type definitions
├── lib/
│   ├── availability.ts     # Capacity check logic
│   ├── date.ts             # Date formatting (Thai Buddhist)
│   ├── tz.ts               # Timezone conversion
│   ├── range.ts            # Date range utilities
│   ├── validators.ts       # Zod schemas
│   ├── errors.ts           # Error parsing
│   └── __tests__/          # Unit tests
└── styles/
    └── index.css           # Global styles

supabase/
└── functions/
    └── admin_create_user/  # Postgres functions

SQL Files:
├── 000_init.sql
├── 001_tables.sql
├── 002_constraints_indexes.sql
├── 003_rpcs.sql
├── 004_rls.sql
├── 005_views.sql
├── 006_seed.sql
├── 007_grants.sql
└── 008_profiles_rls.sql
```

### ขั้นตอนการเพิ่ม Feature ใหม่

1. **Define Types** in `src/data/types.ts`
2. **Create API Methods** in `src/data/supabaseRepo.ts`
3. **Build UI Route** in `src/routes/`
4. **Add Tests** in `src/lib/__tests__/` or `tests/e2e/`
5. **Update SQL** if needed (add RLS, views, etc)

---

## Troubleshooting

### ❌ "Permission denied" on `vitest`/`vite`
```bash
# Fix executable permissions
chmod -R +x "/Users/krissanap/Document/KMUTT/Short Paper/CoDesk/node_modules/.bin/"
```

### ❌ Supabase connection fails
- โปรเจกต์จะสลับเป็น DEMO MODE โดยอัตโนมัติ
- ตรวจสอบ `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ใน `.env`

### ❌ RLS errors
- ตรวจสอบ user role ใน `profiles` table
- ดู [RLS_TESTING.md](RLS_TESTING.md) สำหรับคำแนะนำ

### ❌ Timezone issues
- Database uses UTC (ISO timestamps)
- Frontend converts ไปเป็น Bangkok time (Asia/Bangkok)
- ใช้ Luxon library สำหรับ timezone operations

---

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes และ test: `npm test && npm run test:e2e`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Create Pull Request

---

## License

[ระบุ license ที่นี่]

---

## Contact & Support

หากมีคำถามหรือปัญหาติดต่อ:
- 📧 Email: support@codesk.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourrepo/issues)
- 📚 Documentation: [Wiki](https://github.com/yourrepo/wiki)

---

**Last Updated**: กุมภาพันธ์ 2569
**Version**: 0.1.0
