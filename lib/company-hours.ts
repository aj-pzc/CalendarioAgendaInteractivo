import type { Prisma } from '@prisma/client';

const HOURS_TIME_ZONE = 'America/Mexico_City';

export function getHoursPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HOURS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  if (!year || !month) {
    throw new Error('No se pudo determinar el periodo de horas.');
  }

  return `${year}-${month}`;
}

export function isCurrentHoursPeriod(period: string, date = new Date()) {
  return period === getHoursPeriod(date);
}

export function roundHours(hours: number) {
  return Math.round((hours + Number.EPSILON) * 100) / 100;
}

export async function lockAndGetCompanyHours(
  tx: Prisma.TransactionClient,
  companyId: string,
  now = new Date()
) {
  const [company] = await tx.$queryRaw<
    Array<{
      id: string;
      horasDisponibles: number;
      horasUsadas: number;
      horasPeriodo: string;
    }>
  >`
    SELECT id, horasDisponibles, horasUsadas, horasPeriodo
    FROM Company
    WHERE id = ${companyId}
    FOR UPDATE
  `;

  if (!company) return null;

  const currentPeriod = getHoursPeriod(now);
  if (company.horasPeriodo === currentPeriod) return company;

  await tx.company.update({
    where: { id: companyId },
    data: { horasUsadas: 0, horasPeriodo: currentPeriod },
  });

  return { ...company, horasUsadas: 0, horasPeriodo: currentPeriod };
}
