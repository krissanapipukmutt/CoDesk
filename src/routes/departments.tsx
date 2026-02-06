import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, LoadingState } from '../components/State';
import { useRepo } from '../data/repo';
import { departmentSchema } from '../lib/validators';

const DepartmentsPage = () => {
  const { repo, isDemo } = useRepo();
  const queryClient = useQueryClient();
  const { data: offices = [] } = useQuery({ queryKey: ['offices'], queryFn: () => repo.listOffices() });
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => repo.listDepartments()
  });
  const { data: seats = [] } = useQuery({ queryKey: ['seats'], queryFn: () => repo.listSeats() });

  const [officeId, setOfficeId] = useState('');
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<'ASSIGNED' | 'UNASSIGNED'>('ASSIGNED');
  const [dailyCapacity, setDailyCapacity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const capacityMap = useMemo(() => {
    const map = new Map<string, number>();
    seats
      .filter((s) => s.isActive && s.isBookable)
      .forEach((s) => {
        const key = s.departmentId;
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    return map;
  }, [seats]);

  const createMutation = useMutation({
    mutationFn: (input: any) => repo.createDepartment(input),
    onSuccess: () => {
      setMessage('บันทึกฝ่ายงานแล้ว');
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => {
      const message = err?.message ?? err?.details ?? 'บันทึกฝ่ายงานไม่สำเร็จ';
      setMessage(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => repo.updateDepartment(id, input),
    onSuccess: () => {
      setMessage('อัปเดตฝ่ายงานแล้ว');
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => {
      const message = err?.message ?? err?.details ?? 'อัปเดตฝ่ายงานไม่สำเร็จ';
      setMessage(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repo.deleteDepartment(id),
    onSuccess: () => {
      setMessage('ลบฝ่ายงานแล้ว');
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => {
      const message = err?.message ?? err?.details ?? 'ลบฝ่ายงานไม่สำเร็จ';
      setMessage(message);
    }
  });

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setMessage('');
    const parsed = departmentSchema.safeParse({ officeId, name, strategy, isActive });
    if (!parsed.success) {
      setMessage('กรอกข้อมูลไม่ครบ');
      return;
    }
    const capacityValue = dailyCapacity.trim() === '' ? null : Number(dailyCapacity);
    const isCapacityInt = typeof capacityValue === 'number' && Number.isInteger(capacityValue);
    if (strategy === 'ASSIGNED' && isDemo) {
      if (!isCapacityInt || capacityValue < 1) {
        setMessage('กรุณาระบุความจุเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป');
        return;
      }
    }
    const normalized = {
      ...parsed.data,
      dailyCapacity: strategy === 'ASSIGNED' && isCapacityInt ? capacityValue : null
    };
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, input: normalized });
    } else {
      await createMutation.mutateAsync(normalized);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!departments.length) return <EmptyState label="ยังไม่มีฝ่ายงาน" />;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-display mb-2">จัดการฝ่ายงาน</h2>
        <p className="text-sm text-slate-500 mb-4">
          Seat Assigned ใช้ความจุต่อวัน · Seat Unassigned คำนวณจากจำนวนที่นั่งจริงที่ active และ bookable
        </p>
        {message && <div className="mb-4 rounded-xl bg-indigo/10 px-4 py-2 text-indigo text-sm">{message}</div>}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-slate-600">ออฟฟิศ</label>
            <select className="select" value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
              <option value="">เลือกออฟฟิศ</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">ชื่อฝ่ายงาน</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">ประเภทการจอง</label>
            <select
              className="select"
              value={strategy}
              onChange={(e) => {
                const next = e.target.value as any;
                setStrategy(next);
                if (next === 'UNASSIGNED') setDailyCapacity('');
              }}
            >
              <option value="ASSIGNED">Seat Assigned</option>
              <option value="UNASSIGNED">Seat Unassigned</option>
            </select>
          </div>
          {strategy === 'ASSIGNED' && (
            <div>
              <label className="text-sm text-slate-600">ความจุ/จำนวนที่นั่งต่อวัน</label>
              <input
                className="input"
                type="number"
                min={1}
                step={1}
                value={dailyCapacity}
                onChange={(e) => setDailyCapacity(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-slate-600">เปิดใช้งาน</span>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" type="submit">
              {editingId ? 'อัปเดตฝ่ายงาน' : 'เพิ่มฝ่ายงาน'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setEditingId(null);
                setName('');
                setOfficeId('');
                setDailyCapacity('');
              }}
            >
              ล้างฟอร์ม
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-display mb-4">รายการฝ่ายงาน</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อฝ่ายงาน</th>
              <th>ออฟฟิศ</th>
              <th>ประเภท</th>
              <th>ความจุ</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{offices.find((o) => o.id === d.officeId)?.name ?? '-'}</td>
                <td>{d.strategy}</td>
                <td>
                  {d.strategy === 'ASSIGNED'
                    ? (d.dailyCapacity ?? capacityMap.get(d.id) ?? 0)
                    : (capacityMap.get(d.id) ?? 0)}
                </td>
                <td>
                  <span className={`badge ${d.isActive ? 'bg-mint/20 text-mint' : 'bg-rose/20 text-rose'}`}>
                    {d.isActive ? 'ใช้งาน' : 'ปิด'}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditingId(d.id);
                      setOfficeId(d.officeId);
                      setName(d.name);
                      setStrategy(d.strategy);
                      setDailyCapacity(d.dailyCapacity ? String(d.dailyCapacity) : '');
                      setIsActive(d.isActive);
                    }}
                  >
                    แก้ไข
                  </button>
                  <button className="btn-danger" onClick={() => deleteMutation.mutate(d.id)}>
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

export default DepartmentsPage;
