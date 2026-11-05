import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';

export async function requireMasterApiAccess() {
  const sessionUserId = await getSessionUserId();

  if (!sessionUserId) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true, isApproved: true },
  });

  if (user?.role !== 'MASTER' || !user.isApproved) {
    return NextResponse.json({ error: 'No tienes permisos para realizar esta acción.' }, { status: 403 });
  }

  return null;
}
