import { DateTime } from 'luxon';

export const BANGKOK_TZ = 'Asia/Bangkok';

export const nowBangkok = () => DateTime.now().setZone(BANGKOK_TZ);

export const toBangkok = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(BANGKOK_TZ);

export const formatDate = (iso: string) => toBangkok(iso).toFormat('dd LLL yyyy');

export const formatDateShort = (iso: string) => toBangkok(iso).toFormat('dd/MM/yyyy');

export const formatTime24 = (iso: string) => toBangkok(iso).toFormat('HH:mm');

export const formatDateTime24 = (iso: string) => toBangkok(iso).toFormat('dd LLL yyyy HH:mm');

export const parseLocalDateTimeToUtc = (date: string, time: string) => {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-LL-dd HH:mm', { zone: BANGKOK_TZ });
  if (!dt.isValid) return null;
  return dt.toUTC().toISO();
};

export const parseLocalDateToIso = (date: string) => {
  const dt = DateTime.fromFormat(date, 'yyyy-LL-dd', { zone: BANGKOK_TZ });
  if (!dt.isValid) return null;
  return dt.toISODate();
};

export const startOfMonthBangkok = (iso?: string) => {
  const dt = iso ? DateTime.fromISO(iso, { zone: BANGKOK_TZ }) : nowBangkok();
  return dt.startOf('month');
};

export const endOfMonthBangkok = (iso?: string) => {
  const dt = iso ? DateTime.fromISO(iso, { zone: BANGKOK_TZ }) : nowBangkok();
  return dt.endOf('month');
};

export const toIsoDate = (dt: DateTime) => dt.setZone(BANGKOK_TZ).toISODate()!;

export const toIsoDateTimeUTC = (dt: DateTime) => dt.setZone(BANGKOK_TZ).toUTC().toISO()!;

export const fromIsoDate = (date: string) => DateTime.fromISO(date, { zone: BANGKOK_TZ });

export const fromIsoDateTimeUTC = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(BANGKOK_TZ);

export const isSameLocalDate = (aIso: string, bIso: string) => {
  const a = toBangkok(aIso).toISODate();
  const b = toBangkok(bIso).toISODate();
  return a === b;
};
