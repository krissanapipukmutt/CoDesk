import { DateTime } from 'luxon';
import { BANGKOK_TZ } from '../lib/tz';

export type DayInfo = {
  date: string; // yyyy-MM-dd in Bangkok
  bookings: number;
  remaining?: number;
  isFull?: boolean;
  isMine?: boolean;
  tooltip?: string;
};

const weekdays = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

const Calendar = ({
  month,
  dayInfo,
  selected,
  onSelect
}: {
  month: DateTime;
  dayInfo: Record<string, DayInfo>;
  selected: string;
  onSelect: (date: string) => void;
}) => {
  const start = month.setZone(BANGKOK_TZ).startOf('month');
  const end = month.setZone(BANGKOK_TZ).endOf('month');
  const startWeekday = (start.weekday + 6) % 7; // Monday = 1

  const days: DateTime[] = [];
  let cursor = start.minus({ days: startWeekday });
  while (cursor <= end.plus({ days: 6 })) {
    days.push(cursor);
    cursor = cursor.plus({ days: 1 });
  }

  return (
    <div className="card p-6">
      <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-3">
        {weekdays.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const date = day.toISODate()!;
          const info = dayInfo[date];
          const isCurrentMonth = day.month === month.month;
          const isSelected = date === selected;
          return (
            <button
              key={date}
              title={info?.tooltip}
              onClick={() => onSelect(date)}
              className={`h-24 rounded-xl border text-left p-2 transition ${
                isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-300'
              } ${isSelected ? 'border-indigo/60 shadow-glow' : 'border-slate-100'} ${
                info?.isMine ? 'bg-indigo/5 border-indigo/40' : ''
              } hover:border-indigo/40`}
            >
              <div className="text-xs font-semibold text-slate-500">{day.day}</div>
              {info && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-slate-500">จอง {info.bookings}</div>
                  {typeof info.remaining === 'number' && (
                    <div className={`text-xs ${info.remaining === 0 ? 'text-rose' : 'text-mint'}`}>
                      เหลือ {info.remaining}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
