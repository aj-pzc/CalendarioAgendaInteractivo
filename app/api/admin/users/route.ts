import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMasterApiAccess } from '@/lib/api-auth';

export async function GET() {
  const accessError = await requireMasterApiAccess();
  if (accessError) return accessError;

  try {
    const pendingUsers = await prisma.user.findMany({
      where: { isApproved: false },
      select: { id: true, email: true, nombre: true, departamento: true, createdAt: true },
    });
    return NextResponse.json(pendingUsers);
  } catch (error) {
    console.error('Error al obtener usuarios pendientes:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios pendientes' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const accessError = await requireMasterApiAccess();
  if (accessError) return accessError;

  try {
    const { userId, companyId } = await request.json();

    if (typeof userId !== 'string' || typeof companyId !== 'string' || !userId || !companyId) {
      return NextResponse.json({ error: 'Se requiere el userId y el companyId' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        companyId: companyId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        role: true,
        isApproved: true,
        companyId: true,
      },
    });

    return NextResponse.json({ message: 'Usuario aprobado y asignado con éxito', updatedUser });
  } catch (error) {
    console.error('Error al aprobar el usuario:', error);
    return NextResponse.json({ error: 'Error al aprobar el usuario' }, { status: 500 });
  }
}