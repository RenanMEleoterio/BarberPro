const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

function getParts(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
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
