import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  createCompanyAction,
  deleteUserAdminAction,
  updateUserAdminAction,
} from '@/app/actions/master';
import MasterUsersList from '@/app/master/MasterUserList';
import CompanyManagementList from '@/app/master/CompanyManagementList';
import { getSessionUserId } from '@/lib/session';
import { getHoursPeriod } from '@/lib/company-hours';

export default async function MasterPortalPage() {
  const sessionUserId = await getSessionUserId();

  if (!sessionUserId) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true, isApproved: true },
  });

  if (!currentUser || currentUser.role !== 'MASTER' || !currentUser.isApproved) {
    redirect('/');
  }

  const companiesFromDb = await prisma.company.findMany({
    include: { _count: { select: { users: true, reservations: true } } },
    orderBy: { nombre: 'asc' },
  });
  const currentHoursPeriod = getHoursPeriod();
  const companies = companiesFromDb.map((company) => ({
    ...company,
    horasUsadas: company.horasPeriodo === currentHoursPeriod ? company.horasUsadas : 0,
  }));

  const users = await prisma.user.findMany({
    include: { company: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center text-sm shadow-xs">
              M
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Portal Master (Global Admin)</h1>
              <p className="text-[11px] text-slate-500">Gestión centralizada de organizaciones y accesos</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            ← Volver al Calendario
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Sección Empresas y Registro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulario Registrar Empresa */}
          <section className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Registrar Nueva Empresa</h2>
              <p className="text-xs text-slate-500">Crea una cuenta corporativa y define su bolsa inicial.</p>
            </div>

            <form action={createCompanyAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Ej. Innovación Tecnológica S.A."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bolsa de Horas Inicial</label>
                <input
                  type="number"
                  step="0.5"
                  name="horasDisponibles"
                  defaultValue="20"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                Crear Empresa
              </button>
            </form>
          </section>

          {/* Listado y Recarga de Horas por Empresa */}
          <section className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Empresas Registradas</h2>
              <p className="text-xs text-slate-500">Supervisa las horas y gestiona las organizaciones.</p>
            </div>

            <CompanyManagementList companies={companies} />
          </section>
        </div>

        {/* Sección de Usuarios (Delegada al Client Component) */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Control de Usuarios y Aprobaciones</h2>
              <p className="text-xs text-slate-500">Valida cuentas nuevas, asigna roles jerárquicos y vincula empresas.</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
              {users.length} {users.length === 1 ? 'Usuario' : 'Usuarios'} en total
            </span>
          </div>

          <MasterUsersList
            users={users}
            companies={companies}
            currentSessionUserId={sessionUserId}
            updateAction={updateUserAdminAction}
            deleteAction={deleteUserAdminAction}
          />
        </section>

      </main>
    </div>
  );
}