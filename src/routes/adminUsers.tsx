import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepo } from '../data/repo';
import { EmptyState, LoadingState } from '../components/State';
import { formatThaiBuddhistDateTime } from '../lib/date';

type AdminUserRow = {
  user_id: string;
  employee_id: string;
  employee_code: string;
  name: string;
  email: string;
  role: 'employee' | 'hr' | 'admin';
  created_at: string;
};

const roleOptions: Array<AdminUserRow['role']> = ['employee', 'hr', 'admin'];

const mapErrorCode = (code?: string) => {
  switch (code) {
    case 'EMAIL_EXISTS':
      return 'อีเมลนี้ถูกใช้งานแล้ว';
    case 'EMPLOYEE_ALREADY_LINKED':
      return 'พนักงานคนนี้ถูกผูกกับผู้ใช้แล้ว';
    case 'EMPLOYEE_NOT_FOUND':
      return 'ไม่พบพนักงาน';
    case 'EMPLOYEE_INACTIVE':
      return 'พนักงานนี้ถูกปิดใช้งาน';
    case 'UNAUTHORIZED':
      return 'ไม่มีสิทธิ์ในการสร้างผู้ใช้';
    case 'PROFILE_INSERT_FAILED':
      return 'สร้างโปรไฟล์ไม่สำเร็จ';
    case 'CREATE_USER_FAILED':
      return 'สร้างผู้ใช้ไม่สำเร็จ';
    case 'PROFILE_UPDATE_FAILED':
      return 'อัปเดตสิทธิ์ไม่สำเร็จ';
    case 'PROFILE_DELETE_FAILED':
      return 'ลบโปรไฟล์ไม่สำเร็จ';
    case 'AUTH_DELETE_FAILED':
      return 'ลบผู้ใช้ใน Auth ไม่สำเร็จ';
    case 'PROFILE_NOT_FOUND':
      return 'ไม่พบโปรไฟล์ผู้ใช้';
    case 'INVALID_INPUT':
      return 'ข้อมูลไม่ถูกต้อง';
    default:
      return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  }
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const length = 12;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};

const AdminUsersPage = () => {
  const { repo, isDemo } = useRepo();
  const repoAny = repo as any;
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => repo.listEmployees(),
    enabled: !isDemo
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => (repoAny.listAdminUsers ? repoAny.listAdminUsers() : []),
    enabled: !isDemo
  });

  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminUserRow['role']>('employee');
  const [message, setMessage] = useState('');
  const [createdUserId, setCreatedUserId] = useState('');

  const linkedEmployeeIds = useMemo(() => new Set(users.map((u: AdminUserRow) => u.employee_id)), [users]);
  const activeEmployees = employees.filter((e) => e.active);

  const createMutation = useMutation({
    mutationFn: () =>
      repoAny.adminCreateUser({
        employee_id: employeeId,
        email,
        password,
        role
      }),
    onSuccess: (data: any) => {
      setMessage('สร้างผู้ใช้สำเร็จ');
      setCreatedUserId(data?.user_id ?? '');
      setPassword('');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      const code = err?.message ?? err?.details ?? err?.error_description;
      setMessage(mapErrorCode(code));
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: (input: { target_user_id: string; role: AdminUserRow['role'] }) =>
      repoAny.adminUpdateUserRole(input),
    onSuccess: () => {
      setMessage('อัปเดตสิทธิ์สำเร็จ');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      const code = err?.message ?? err?.details ?? err?.error_description;
      setMessage(mapErrorCode(code));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { target_user_id: string }) => repoAny.adminDeleteUser(input),
    onSuccess: () => {
      setMessage('ลบผู้ใช้สำเร็จ');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      const code = err?.message ?? err?.details ?? err?.error_description;
      setMessage(mapErrorCode(code));
    }
  });

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setMessage('');
    setCreatedUserId('');
    if (!employeeId || !email || !password || !role) {
      setMessage('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    await createMutation.mutateAsync();
  };

  if (isDemo) {
    return <EmptyState label="หน้าจัดการผู้ใช้ใช้ได้เฉพาะ Supabase mode" />;
  }

  if (loadingEmployees || loadingUsers) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-display mb-2">สร้างผู้ใช้ใหม่</h2>
        {message && <div className="mb-4 rounded-xl bg-indigo/10 px-4 py-2 text-indigo text-sm">{message}</div>}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-slate-600">พนักงาน</label>
            <select
              className="select"
              value={employeeId}
              onChange={(e) => {
                const id = e.target.value;
                setEmployeeId(id);
                const emp = activeEmployees.find((x) => x.id === id);
                if (emp) setEmail(emp.email);
              }}
            >
              <option value="">เลือกพนักงาน</option>
              {activeEmployees
                .filter((e) => !linkedEmployeeIds.has(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeCode} - {e.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">อีเมล</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">รหัสผ่าน (ชั่วคราว)</label>
            <div className="flex gap-2">
              <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPassword(generatePassword())}
              >
                สร้าง
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => password && navigator.clipboard.writeText(password)}
              >
                คัดลอก
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">สิทธิ์</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as AdminUserRow['role'])}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" type="submit" disabled={createMutation.isPending}>
              Create user
            </button>
            {createdUserId && (
              <span className="text-xs text-slate-500">user_id: {createdUserId}</span>
            )}
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-display mb-4">รายการผู้ใช้</h3>
        {users.length === 0 ? (
          <EmptyState label="ยังไม่มีผู้ใช้" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>รหัสพนักงาน</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>สิทธิ์</th>
                <th>user_id</th>
                <th>สร้างเมื่อ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {(users as AdminUserRow[]).map((u) => (
                <tr key={u.user_id}>
                  <td>{u.employee_code}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="select"
                      value={u.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({ target_user_id: u.user_id, role: e.target.value as AdminUserRow['role'] })
                      }
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-xs">{u.user_id}</td>
                  <td>{formatThaiBuddhistDateTime(u.created_at)}</td>
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() => {
                        if (confirm('ยืนยันการลบผู้ใช้นี้?')) {
                          deleteMutation.mutate({ target_user_id: u.user_id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
