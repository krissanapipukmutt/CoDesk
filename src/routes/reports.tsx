import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, LoadingState } from '../components/State';
import { useRepo } from '../data/repo';

const ReportsPage = () => {
  const { repo } = useRepo();
  const { data: offices = [] } = useQuery({ queryKey: ['offices'], queryFn: () => repo.listOffices() });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => repo.listDepartments()
  });
  const { data: r1 = [], isLoading: l1 } = useQuery({
    queryKey: ['reports', 'v1'],
    queryFn: () => repo.reportBookingsPerDay()
  });
  const { data: r2 = [], isLoading: l2 } = useQuery({
    queryKey: ['reports', 'v2'],
    queryFn: () => repo.reportUtilization()
  });
  const { data: r3 = [], isLoading: l3 } = useQuery({
    queryKey: ['reports', 'v3'],
    queryFn: () => repo.reportPopularSeats()
  });
  const { data: r4 = [], isLoading: l4 } = useQuery({
    queryKey: ['reports', 'v4'],
    queryFn: () => repo.reportStatusSummary()
  });
  const { data: r5 = [], isLoading: l5 } = useQuery({
    queryKey: ['reports', 'v5'],
    queryFn: () => repo.reportPeakTimes()
  });

  const [officeId, setOfficeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const filterRange = (date: string) => {
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  };

  const filteredV1 = useMemo(
    () =>
      r1.filter(
        (r) =>
          (!officeId || r.office_id === officeId) &&
          (!departmentId || r.department_id === departmentId) &&
          filterRange(r.local_date)
      ),
    [r1, officeId, departmentId, startDate, endDate]
  );

  const filteredV2 = useMemo(
    () =>
      r2.filter(
        (r) =>
          (!officeId || r.office_id === officeId) &&
          (!departmentId || r.department_id === departmentId) &&
          filterRange(r.local_date)
      ),
    [r2, officeId, departmentId, startDate, endDate]
  );

  const filteredV3 = useMemo(
    () =>
      r3.filter(
        (r) =>
          (!officeId || r.office_id === officeId) &&
          (!departmentId || r.department_id === departmentId) &&
          filterRange(r.local_date)
      ),
    [r3, officeId, departmentId, startDate, endDate]
  );

  const filteredV4 = useMemo(
    () =>
      r4.filter(
        (r) =>
          (!officeId || r.office_id === officeId) &&
          (!departmentId || r.department_id === departmentId) &&
          filterRange(r.local_date)
      ),
    [r4, officeId, departmentId, startDate, endDate]
  );

  const filteredV5 = useMemo(
    () =>
      r5.filter(
        (r) =>
          (!officeId || r.office_id === officeId) &&
          (!departmentId || r.department_id === departmentId) &&
          filterRange(r.local_date)
      ),
    [r5, officeId, departmentId, startDate, endDate]
  );

  if (l1 || l2 || l3 || l4 || l5) return <LoadingState />;

  const dataCardClass = 'card p-6 flex flex-col h-[360px]';
  const tableWrapClass = 'flex-1 overflow-y-auto scrollbar';

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-display mb-3">Filters</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-sm text-slate-600">ออฟฟิศ</label>
            <select className="select" value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">ฝ่ายงาน</label>
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
            <div>
              <label className="text-sm text-slate-600">เริ่ม</label>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-600">สิ้นสุด</label>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
        </div>
      </div>

      <div className={dataCardClass}>
        <h3 className="text-lg font-display mb-4">V1: Bookings per Day</h3>
        <div className={tableWrapClass}>
          {filteredV1.length === 0 ? (
            <EmptyState label="ไม่มีข้อมูล" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ฝ่ายงาน</th>
                  <th>ทั้งหมด</th>
                  <th>ยืนยัน</th>
                  <th>ยกเลิก</th>
                </tr>
              </thead>
              <tbody>
                {filteredV1.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.local_date}</td>
                    <td>{departmentMap.get(r.department_id) ?? '-'}</td>
                    <td>{r.total_bookings}</td>
                    <td>{r.confirmed_bookings}</td>
                    <td>{r.cancelled_bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={dataCardClass}>
        <h3 className="text-lg font-display mb-4">V2: Utilization by Department</h3>
        <div className={tableWrapClass}>
          {filteredV2.length === 0 ? (
            <EmptyState label="ไม่มีข้อมูล" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ฝ่ายงาน</th>
                  <th>Booked นาที</th>
                  <th>Capacity นาที</th>
                  <th>Utilization %</th>
                </tr>
              </thead>
              <tbody>
                {filteredV2.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.local_date}</td>
                    <td>{departmentMap.get(r.department_id) ?? '-'}</td>
                    <td>{r.booked_minutes}</td>
                    <td>{r.capacity_minutes}</td>
                    <td>{r.utilization_pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={dataCardClass}>
        <h3 className="text-lg font-display mb-4">V3: Popular Seats</h3>
        <div className={tableWrapClass}>
          {filteredV3.length === 0 ? (
            <EmptyState label="ไม่มีข้อมูล" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ฝ่ายงาน</th>
                  <th>ที่นั่ง</th>
                  <th>จำนวนจอง</th>
                  <th>นาทีที่ใช้งาน</th>
                </tr>
              </thead>
              <tbody>
                {filteredV3.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.local_date}</td>
                    <td>{departmentMap.get(r.department_id) ?? '-'}</td>
                    <td>{r.seat_code}</td>
                    <td>{r.booking_count}</td>
                    <td>{r.booked_minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={dataCardClass}>
        <h3 className="text-lg font-display mb-4">V4: Booking Status Summary</h3>
        <div className={tableWrapClass}>
          {filteredV4.length === 0 ? (
            <EmptyState label="ไม่มีข้อมูล" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ฝ่ายงาน</th>
                  <th>สถานะ</th>
                  <th>จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {filteredV4.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.local_date}</td>
                    <td>{departmentMap.get(r.department_id) ?? '-'}</td>
                    <td>{r.status}</td>
                    <td>{r.booking_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={dataCardClass}>
        <h3 className="text-lg font-display mb-4">V5: Peak Times</h3>
        <div className={tableWrapClass}>
          {filteredV5.length === 0 ? (
            <EmptyState label="ไม่มีข้อมูล" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ฝ่ายงาน</th>
                  <th>เริ่ม</th>
                  <th>สิ้นสุด</th>
                  <th>จำนวนคน</th>
                </tr>
              </thead>
              <tbody>
                {filteredV5.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.local_date}</td>
                    <td>{departmentMap.get(r.department_id) ?? '-'}</td>
                    <td>{r.slot_start_local?.toString().slice(11, 16)}</td>
                    <td>{r.slot_end_local?.toString().slice(11, 16)}</td>
                    <td>{r.concurrent_bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
