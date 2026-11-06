import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/session';
import ReservationForm from '@/app/Comps/ReservationForm';
import UpcomingReservations from '@/app/Comps/UpcomingReservations'; 
import WeeklyCalendar from '@/app/Comps/WeeklyCalendar';
import NavbarHeader from '@/app/Comps/NavBarHeader';
import WelcomeBanner from '@/app/Comps/WelcomeBanner';
import { isCurrentHoursPeriod, roundHours } from '@/lib/company-hours';

export default async function HomePage() {
  // 1. Verificación de sesión del usuario
  const sessionUserId = await getSessionUserId();

  if (!sessionUserId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { company: true },
  });

  if (!user || !user.isApproved || !user.company || !user.companyId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <p className="text-red-600 font-semibold">Usuario no encontrado, no aprobado o sin empresa asignada.</p>
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
  let allCompaniesForMaster: { id: string; nombre: string; horasRestantes: number }[] = [];
  let horasRestantesMostrar = horasRestantesEmpresa;

  if (user.role === 'MASTER') {
    const todasLasEmpresas = await prisma.company.findMany({
      select: { id: true, nombre: true, horasDisponibles: true, horasUsadas: true, horasPeriodo: true },
      orderBy: { nombre: 'asc' },
    });
    allCompaniesForMaster = todasLasEmpresas.map((company) => {
      const horasUsadas = isCurrentHoursPeriod(company.horasPeriodo, now)
        ? company.horasUsadas
        : 0;
      return {
        id: company.id,
        nombre: company.nombre,
        horasRestantes: roundHours(company.horasDisponibles - horasUsadas),
      };
    });
    horasRestantesMostrar = allCompaniesForMaster.reduce(
      (total, company) => total + company.horasRestantes,
      0
    );
  }
  horasRestantesMostrar = roundHours(horasRestantesMostrar);

  const allReservations = await prisma.reservation.findMany({
    where: { estado: { not: 'CANCELADA' } },
    include: {
      user: {
        include: {
           company: true
       }
      },
      company: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  // 5. Filtrar reservas específicas de la empresa para el listado
  const companyReservations = user.role === 'MASTER' 
    ? allReservations 
    : allReservations.filter((res: { companyId: string }) => res.companyId === user.companyId);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <NavbarHeader 
        companyName={user.company.nombre}
        userName={user.nombre}
        department={user.departamento}
        horasRestantes={horasRestantesMostrar}
        userRole={user.role}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner de Bienvenida */}
        <WelcomeBanner 
          userName={user.nombre} 
          horasRestantes={horasRestantesMostrar}
        />

        {/* Sección del Calendario Semanal con Control de Acceso por Rol */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-hidden">
          <WeeklyCalendar 
            reservations={allReservations} 
            currentUserId={user.id}
            currentUserCompanyId={user.companyId}
            currentUserRole={user.role}
          />
        </section>

        {/* Sección de Formulario / Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulario de Reserva */}
          <section className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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

          {/* Lista de Próximas Reservas */}
          <section className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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