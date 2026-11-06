import { redirect } from 'next/navigation';
import NavbarHeader from '@/app/Comps/NavBarHeader';
import AccountSettingsForm from '@/app/Comps/AccountSettingsForm';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isCurrentHoursPeriod, roundHours } from '@/lib/company-hours';

export default async function AccountPage() {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { company: true },
  });
  if (!user || !user.isApproved) redirect('/login');

  const horasUsadas = user.company && isCurrentHoursPeriod(user.company.horasPeriodo)
    ? user.company.horasUsadas
    : 0;
  const horasDisponibles = user.company?.horasDisponibles ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <NavbarHeader
        companyName={user.company?.nombre ?? 'Mi cuenta'}
        userName={user.nombre}
        department={user.departamento}
        horasDisponibles={horasDisponibles}
        horasUsadas={horasUsadas}
        horasRestantes={roundHours(horasDisponibles - horasUsadas)}
        userRole={user.role}
      />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 border-b border-amber-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Mi cuenta</h2>
            <p className="mt-1 text-xs text-slate-500">
              Actualiza tu nombre de usuario, correo o contraseña.
            </p>
          </div>
          <AccountSettingsForm username={user.username} email={user.email} />
        </section>
      </main>
    </div>
  );
}
