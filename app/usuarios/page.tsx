import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AdminUserAccountsList from '@/app/Comps/AdminUserAccountsList';
import CCRLogo from '@/app/Comps/CCRLogo';

export default async function CompanyUsersPage() {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true, isApproved: true, companyId: true },
  });
  if (
    !currentUser ||
    currentUser.role !== 'ADMIN' ||
    !currentUser.isApproved ||
    !currentUser.companyId
  ) {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    where: { companyId: currentUser.companyId, role: 'USER' },
    select: { id: true, nombre: true, username: true, email: true },
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <CCRLogo size={36} className="ring-1 ring-amber-300/70 shadow-xs" />
            <div>
              <h1 className="text-sm font-bold text-slate-900">Usuarios de mi empresa</h1>
              <p className="text-[11px] text-slate-500">Actualiza sus datos de acceso</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            ← Calendario
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <AdminUserAccountsList users={users} />
      </main>
    </div>
  );
}
