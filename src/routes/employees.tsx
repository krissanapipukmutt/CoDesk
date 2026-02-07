import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, LoadingState } from '../components/State';
import { useRepo } from '../data/repo';
import { employeeSchema } from '../lib/validators';

const EmployeesPage = () => {
  const { repo } = useRepo();
  const queryClient = useQueryClient();
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => repo.listEmployees()
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => repo.listDepartments()
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [active, setActive] = useState(true);
  const [message, setMessage] = useState('');

  const createMutation = useMutation({
    mutationFn: repo.createEmployee,
    onSuccess: () => {
      setMessage('บันทึกพนักงานแล้ว');
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      const message = err?.message ?? err?.details ?? 'บันทึกพนักงานไม่สำเร็จ';
      setMessage(message);
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => repo.updateEmployee(id, input),
    onSuccess: () => {
      setMessage('อัปเดตพนักงานแล้ว');
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      const message = err?.message ?? err?.details ?? 'อัปเดตพนักงานไม่สำเร็จ';
      setMessage(message);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => repo.deleteEmployee(id),
    onSuccess: () => {
      setMessage('ลบพนักงานแล้ว');
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      const message = err?.message ?? err?.details ?? 'ลบพนักงานไม่สำเร็จ';
      setMessage(message);
    }
  });

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setMessage('');
    const parsed = employeeSchema.safeParse({ employeeCode, name, email, departmentId, startDate, active });
    if (!parsed.success) {
      setMessage('ข้อมูลไม่ครบ');
      return;
    }
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, input: parsed.data });
    } else {
      await createMutation.mutateAsync(parsed.data);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!employees.length) return <EmptyState label="ยังไม่มีพนักงาน" />;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-display mb-2">จัดการพนักงาน</h2>
        {message && <div className="mb-4 rounded-xl bg-indigo/10 px-4 py-2 text-indigo text-sm">{message}</div>}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-slate-600">รหัสพนักงาน</label>
            <input className="input" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">ชื่อ</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">อีเมล</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">ฝ่ายงาน</label>
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">เลือกฝ่ายงาน</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">วันเริ่มงาน</label>
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span className="text-sm text-slate-600">เปิดใช้งาน</span>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" type="submit">
              {editingId ? 'อัปเดตพนักงาน' : 'เพิ่มพนักงาน'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setEditingId(null);
                setEmployeeCode('');
                setName('');
                setEmail('');
                setDepartmentId('');
                setStartDate('');
                setActive(true);
              }}
            >
              ล้างฟอร์ม
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-display mb-4">รายชื่อพนักงาน</h3>
        <table className="table">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อ</th>
              <th>อีเมล</th>
              <th>ฝ่ายงาน</th>
              <th>เริ่มงาน</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.employeeCode}</td>
                <td>{e.name}</td>
                <td>{e.email}</td>
                <td>{departments.find((d) => d.id === e.departmentId)?.name ?? '-'}</td>
                <td>{e.startDate}</td>
                <td>
                  <span className={`badge ${e.active ? 'bg-mint/20 text-mint' : 'bg-rose/20 text-rose'}`}>
                    {e.active ? 'ใช้งาน' : 'ปิด'}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditingId(e.id);
                      setEmployeeCode(e.employeeCode);
                      setName(e.name);
                      setEmail(e.email);
                      setDepartmentId(e.departmentId);
                      setStartDate(e.startDate);
                      setActive(e.active);
                    }}
                  >
                    แก้ไข
                  </button>
                  <button className="btn-danger" onClick={() => deleteMutation.mutate(e.id)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeesPage;
