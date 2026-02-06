import { DateTime, Settings } from 'luxon';
import { BANGKOK_TZ } from './tz';

Settings.defaultOutputCalendar = 'buddhist';

const toBangkokDateTime = (input: string | DateTime) => {
  if (typeof input === 'string') {
    const zone = input.includes('T') ? 'utc' : BANGKOK_TZ;
    return DateTime.fromISO(input, { zone }).setZone(BANGKOK_TZ);
  }
  return input.setZone(BANGKOK_TZ);
};

export const formatThaiBuddhistDate = (input?: string | DateTime | null) => {
  if (!input) return '';
  return toBangkokDateTime(input).toFormat('dd/MM/yyyy');
};

export const formatThaiBuddhistDateTime = (input?: string | DateTime | null) => {
  if (!input) return '';
  return toBangkokDateTime(input).toFormat('dd/MM/yyyy HH:mm');
};

export const formatThaiTime24 = (input?: string | DateTime | null) => {
  if (!input) return '';
  return toBangkokDateTime(input).toFormat('HH:mm');
};


export const parseThaiBuddhistDateToIso = (input?: string | null) => {
  if (!input) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const yearBe = Number(match[3]);
  const year = yearBe - 543;
  if (!Number.isFinite(year) || year < 1900) return null;
  const dt = DateTime.fromObject({ year, month, day }, { zone: BANGKOK_TZ });
  if (!dt.isValid) return null;
  return dt.toISODate();
};

export const toLocalDateTimeInput = (dateIso: string, time: string) => {
  const dt = DateTime.fromFormat(`${dateIso} ${time}`, 'yyyy-LL-dd HH:mm', { zone: BANGKOK_TZ });
  if (!dt.isValid) return '';
  return dt.toFormat("yyyy-LL-dd'T'HH:mm");
};

export const toLocalDateTimeInputFromUtc = (isoUtc: string) => {
  const dt = DateTime.fromISO(isoUtc, { zone: 'utc' }).setZone(BANGKOK_TZ);
  if (!dt.isValid) return '';
  return dt.toFormat("yyyy-LL-dd'T'HH:mm");
};

export const splitLocalDateTime = (value: string) => {
  const dt = DateTime.fromISO(value, { zone: BANGKOK_TZ });
  if (!dt.isValid) return null;
  return { date: dt.toISODate()!, time: dt.toFormat('HH:mm') };
};
