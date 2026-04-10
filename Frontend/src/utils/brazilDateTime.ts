const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';
const BRAZIL_UTC_OFFSET_HOURS = 3;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const HAS_EXPLICIT_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;

function createUtcDateFromBrazilParts(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  return new Date(Date.UTC(year, month - 1, day, hour + BRAZIL_UTC_OFFSET_HOURS, minute, second));
}

function parseBrazilAwareDate(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  const dateOnlyMatch = value.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return createUtcDateFromBrazilParts(Number(year), Number(month), Number(day));
  }

  const localDateTimeMatch = value.match(LOCAL_DATE_TIME_PATTERN);
  if (localDateTimeMatch && !HAS_EXPLICIT_TIMEZONE_PATTERN.test(value)) {
    const [, year, month, day, hour, minute, second = '0'] = localDateTimeMatch;
    return createUtcDateFromBrazilParts(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  return new Date(value);
}

function getParts(value: string | Date) {
  const date = parseBrazilAwareDate(value);
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: string) => parts.find(part => part.type === type)?.value ?? '';

  return {
    year: lookup('year'),
    month: lookup('month'),
    day: lookup('day'),
    hour: lookup('hour'),
    minute: lookup('minute'),
  };
}

export function toBrazilDateInputValue(value: string | Date): string {
  const { year, month, day } = getParts(value);
  return `${year}-${month}-${day}`;
}

export function toBrazilDateLabel(value: string | Date): string {
  const { year, month, day } = getParts(value);
  return `${day}/${month}/${year}`;
}

export function toBrazilTimeValue(value: string | Date): string {
  const { hour, minute } = getParts(value);
  return `${hour}:${minute}`;
}

export function isSameBrazilDate(value: string | Date, dateInputValue: string): boolean {
  return toBrazilDateInputValue(value) === dateInputValue;
}

export function getBrazilDayOfWeek(value: string | Date): number {
  const { year, month, day } = getParts(value);
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
}
