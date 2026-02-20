import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import Calendar from '../components/Calendar';
import { EmptyState, LoadingState } from '../components/State';
import { useRepo } from '../data/repo';
import { holidaySchema } from '../lib/validators';
import { Holiday } from '../data/types';

const HolidaysPage = () => {
  const { repo } = useRepo();
  const { data: offices = [] } = useQuery({ queryKey: ['offices'], queryFn: () => repo.listOffices() });
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => repo.listHolidays()
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [officeId, setOfficeId] = useState<string>('');
  const [holidayDate, setHolidayDate] = useState(DateTime.now().setZone('Asia/Bangkok').toISODate()!);
  const [name, setName] = useState('');
  const [rule, setRule] = useState<'CLOSED' | 'WARNING'>('CLOSED');
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(DateTime.now().setZone('Asia/Bangkok').toISODate()!);

  const createMutation = useMutation<Holiday, Error, Omit<Holiday, 'id'>>({
    mutationFn: repo.createHoliday,
    onSuccess: () => setMessage('เพิ่มวันหยุดแล้ว')
  });
  const updateMutation = useMutation<Holiday, Error, { id: string; input: Omit<Holiday, 'id'> }>({
    mutationFn: ({ id, input }) => repo.updateHoliday(id, input),
    onSuccess: () => setMessage('อัปเดตวันหยุดแล้ว')
  });
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) => repo.deleteHoliday(id),
    onSuccess: () => setMessage('ลบวันหยุดแล้ว')
  });

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const parsed = holidaySchema.safeParse({
      officeId: officeId || null,
      holidayDate,
      name,
      rule,
      isActive
    });
    if (!parsed.success) {
      setMessage('กรอกข้อมูลไม่ครบ');
      return;
    }
    const normalized = { ...parsed.data, officeId: parsed.data.officeId ?? null };
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, input: normalized });
    } else {
      await createMutation.mutateAsync(normalized);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!holidays.length) return <EmptyState label="ยังไม่มีวันหยุด" />;

  const dayInfo = holidays.reduce<Record<string, any>>((acc, h) => {
    acc[h.holidayDate] = {
      date: h.holidayDate,
      bookings: 0,
      remaining: undefined,
      tooltip: `${h.name} (${h.rule})`
    };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="text-lg font-display mb-2">จัดการวันหยุด</h2>
          {message && <div className="mb-4 rounded-xl bg-indigo/10 px-4 py-2 text-indigo text-sm">{message}</div>}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-slate-600">วันที่หยุด</label>
              <input className="input" type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-600">ชื่อวันหยุด</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-600">ออฟฟิศ (เว้นว่าง = ทุกออฟฟิศ)</label>
              <select className="select" value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
                <option value="">ทุกออฟฟิศ</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600">กฎการจอง</label>
              <select className="select" value={rule} onChange={(e) => setRule(e.target.value as any)}>
                <option value="CLOSED">ปิดการจอง</option>
                <option value="WARNING">เตือนเท่านั้น</option>
              </select>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm text-slate-600">เปิดใช้งาน</span>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" type="submit">
                {editingId ? 'อัปเดตวันหยุด' : 'เพิ่มวันหยุด'}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setOfficeId('');
                }}
              >
                ล้างฟอร์ม
              </button>
            </div>
          </form>
        </div>

        <Calendar
          month={DateTime.fromISO(selectedDate, { zone: 'Asia/Bangkok' })}
          dayInfo={dayInfo}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-display mb-4">รายการวันหยุด</h3>
        <table className="table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>ชื่อวันหยุด</th>
              <th>ออฟฟิศ</th>
              <th>กฎ</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.id}>
                <td>{h.holidayDate}</td>
                <td>{h.name}</td>
                <td>{offices.find((o) => o.id === h.officeId)?.name ?? 'ทุกออฟฟิศ'}</td>
                <td>{h.rule}</td>
                <td>
                  <span className={`badge ${h.isActive ? 'bg-mint/20 text-mint' : 'bg-rose/20 text-rose'}`}>
                    {h.isActive ? 'ใช้งาน' : 'ปิด'}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditingId(h.id);
                      setOfficeId(h.officeId ?? '');
                      setHolidayDate(h.holidayDate);
                      setName(h.name);
                      setRule(h.rule);
                      setIsActive(h.isActive);
                    }}
                  >
                    แก้ไข
                  </button>
                  <button className="btn-danger" onClick={() => deleteMutation.mutate(h.id)}>
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

export default HolidaysPage;
