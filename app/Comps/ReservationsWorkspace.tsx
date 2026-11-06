import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/session';
import ReservationForm from '@/app/Comps/ReservationForm';
import UpcomingReservations from '@/app/Comps/UpcomingReservations';
import WeeklyCalendar from '@/app/Comps/WeeklyCalendar';
import NavbarHeader from '@/app/Comps/NavBarHeader';
import { isCurrentHoursPeriod, roundHours } from '@/lib/company-hours';

type ReservationsView = 'calendar' | 'new' | 'upcoming';

export default async function ReservationsWorkspace({ view }: { view: ReservationsView }) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { company: true },
  });

  if (!user || !user.isApproved || !user.company || !user.companyId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <p className="font-semibold text-red-600">Usuario no encontrado, no aprobado o sin empresa asignada.</p>
          <p className="text-xs text-slate-500 mt-1">
            Verifica el estado de tu cuenta con el administrador de tu organización.
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const companyHoursUsed = isCurrentHoursPeriod(user.company.horasPeriodo, now)
    ? user.company.horasUsadas
    : 0;
  const horasRestantesEmpresa = roundHours(user.company.horasDisponibles - companyHoursUsed);
  let horasUsadasMostrar = companyHoursUsed;
  let horasDisponiblesMostrar = user.company.horasDisponibles;
  let horasRestantesMostrar = horasRestantesEmpresa;
  let allCompaniesForMaster: { id: string; nombre: string; horasRestantes: number }[] = [];

  if (user.role === 'MASTER') {
    const companies = await prisma.company.findMany({
      select: { id: true, nombre: true, horasDisponibles: true, horasUsadas: true, horasPeriodo: true },
      orderBy: { nombre: 'asc' },
    });

    allCompaniesForMaster = companies.map((company) => {
      const horasUsadas = isCurrentHoursPeriod(company.horasPeriodo, now)
        ? company.horasUsadas
        : 0;
      return {
        id: company.id,
        nombre: company.nombre,
        horasRestantes: roundHours(company.horasDisponibles - horasUsadas),
      };
    });
    horasUsadasMostrar = roundHours(
      companies.reduce(
        (total, company) =>
          total + (isCurrentHoursPeriod(company.horasPeriodo, now) ? company.horasUsadas : 0),
        0
      )
    );
    horasDisponiblesMostrar = roundHours(
      companies.reduce((total, company) => total + company.horasDisponibles, 0)
    );
    horasRestantesMostrar = allCompaniesForMaster.reduce(
      (total, company) => total + company.horasRestantes,
      0
    );
  }
  horasRestantesMostrar = roundHours(horasRestantesMostrar);

  const allReservations = await prisma.reservation.findMany({
    where: { estado: { not: 'CANCELADA' } },
    include: {
      user: { include: { company: true } },
      company: true,
    },
    orderBy: { startTime: 'asc' },
  });
  const companyReservations = user.role === 'MASTER'
    ? allReservations
    : allReservations.filter((reservation) => reservation.companyId === user.companyId);
  const sectionVisibility = (section: ReservationsView) =>
    view === section ? '' : 'hidden lg:block';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <NavbarHeader
        companyName={user.company.nombre}
        userName={user.nombre}
        department={user.departamento}
        horasDisponibles={horasDisponiblesMostrar}
        horasUsadas={horasUsadasMostrar}
        horasRestantes={horasRestantesMostrar}
        userRole={user.role}
      />
      <main
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          view === 'calendar' ? 'space-y-6 py-2 sm:py-3 lg:py-4' : 'space-y-8 py-8'
        }`}
      >
        <section
          id="calendar"
          className={`${sectionVisibility('calendar')} overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:p-5`}
        >
          <WeeklyCalendar
            reservations={allReservations}
            currentUserId={user.id}
            currentUserCompanyId={user.companyId}
            currentUserRole={user.role}
          />
        </section>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <section
            id="new-reservation"
            className={`${sectionVisibility('new')} mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5 lg:max-w-none`}
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Programar Nueva Reserva</h2>
              <p className="text-xs text-slate-500">Selecciona el rango de horario deseado.</p>
            </div>
            <ReservationForm
              isMaster={user.role === 'MASTER'}
              companies={allCompaniesForMaster}
              horasRestantesEmpresa={horasRestantesEmpresa}
              busySlots={allReservations.map((reservation) => ({
                startTime: reservation.startTime.toISOString(),
                endTime: reservation.endTime.toISOString(),
                recurso: reservation.recurso,
              }))}
            />
          </section>

          <section
            id="upcoming-reservations"
            className={`${sectionVisibility('upcoming')} mx-auto flex min-h-0 w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 lg:max-w-none`}
          >
            <UpcomingReservations
              reservations={companyReservations}
              currentUserId={user.id}
              currentUserCompanyId={user.companyId}
              currentUserRole={user.role}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
