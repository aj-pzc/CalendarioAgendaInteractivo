import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/session';
import ReservationForm from '@/app/Comps/ReservationForm';
import UpcomingReservations from '@/app/Comps/UpcomingReservations'; 
import WeeklyCalendar from '@/app/Comps/WeeklyCalendar';
import NavbarHeader from '@/app/Comps/NavBarHeader';
import WelcomeBanner from '@/app/Comps/WelcomeBanner';


async function checkAndResetMonthlyHours() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const empresas = await prisma.company.findMany();

  for (const comp of empresas) {
    const updatedAt = new Date(comp.updatedAt);
    if (updatedAt.getMonth() !== currentMonth || updatedAt.getFullYear() !== currentYear) {
      // Si estamos en un mes nuevo y aún tienen horas registradas del mes pasado, las reiniciamos a 0
      if (comp.horasUsadas > 0) {
        await prisma.company.update({
          where: { id: comp.id },
          data: { horasUsadas: 0 },
        });
      }
    }
  }
}

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

  let horasDisponiblesMostrar = user.company.horasDisponibles;

  if (user.role === 'MASTER') {
    const todasLasEmpresas = await prisma.company.findMany({
      select: { horasDisponibles: true },
    });
    horasDisponiblesMostrar = todasLasEmpresas.reduce((acc: number, curr: { horasDisponibles: number }) => acc + curr.horasDisponibles, 0);
  }

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
  const isAdmin = user.role === 'ADMIN' || user.role === 'MASTER';

  const allCompaniesForMaster = user.role === 'MASTER'
    ? await prisma.company.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <NavbarHeader 
        companyName={user.company.nombre}
        userName={user.nombre}
        department={user.departamento}
        horasDisponibles={horasDisponiblesMostrar}
        userRole={user.role}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner de Bienvenida */}
        <WelcomeBanner 
          userName={user.nombre} 
          horasDisponibles={horasDisponiblesMostrar} 
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