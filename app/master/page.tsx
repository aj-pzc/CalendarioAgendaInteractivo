import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createCompanyAction, updateCompanyHoursAction, updateUserAdminAction, deleteCompanyAction } from '@/app/actions/master';
import MasterUsersList from '@/app/master/MasterUserList';
import { revalidatePath } from 'next/cache';

// Acción inline para eliminar usuarios
async function deleteUserAdminAction(formData: FormData) {
  'use server';
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get('userId')?.value;
  if (!sessionUserId) return;

  const currentMaster = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });

  if (currentMaster?.role !== 'MASTER') return;

  const userId = formData.get('userId') as string;
  if (!userId || userId === sessionUserId) return;

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath('/master');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
  }
}

export default async function MasterPortalPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get('userId')?.value;

  if (!sessionUserId) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });

  if (!currentUser || currentUser.role !== 'MASTER') {
    redirect('/');
  }

  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: true, reservations: true } } },
    orderBy: { nombre: 'asc' },
  });

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

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {companies.map((comp: { id: string; nombre: string; horasDisponibles: number; horasUsadas: number; _count: { users: number; reservations: number } }) => (
                <div key={comp.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{comp.nombre}</h3>
                    <p className="text-[11px] text-slate-500">
                      {comp._count.users} usuarios • {comp._count.reservations} reservas
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">{comp.horasDisponibles} hrs</span>
                      <p className="text-[10px] text-slate-400">Disp.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-700">{comp.horasUsadas || 0} hrs</span>
                      <p className="text-[10px] text-slate-400">Usadas</p>
                    </div>

                    {/* Formulario para Ajustar Horas */}
                    <form action={updateCompanyHoursAction} className="flex items-center gap-1">
                      <input type="hidden" name="companyId" value={comp.id} />
                      <input
                        type="number"
                        step="0.5"
                        name="cantidad"
                        defaultValue="5"
                        required
                        className="w-14 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-center font-medium"
                      />
                      <select name="tipoAccion" className="text-[10px] font-bold rounded-lg border border-slate-200 bg-white p-1">
                        <option value="SUMAR_DISPONIBLES">+ Disp</option>
                        <option value="RESTAR_DISPONIBLES">- Disp</option>
                        <option value="SUMAR_USADAS">+ Usadas</option>
                        <option value="RESTAR_USADAS">- Usadas</option>
                      </select>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      >
                        OK
                      </button>
                    </form>

                    {/* Botón Eliminar Empresa */}
                    <form 
                      action={deleteCompanyAction}
                      onSubmit={undefined} // <-- Evita cualquier onSubmit directo aquí
                    >
                      <input type="hidden" name="companyId" value={comp.id} />
                      <button
                        type="submit"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer"
                        title="Eliminar Empresa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
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