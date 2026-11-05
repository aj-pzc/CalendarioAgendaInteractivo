import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener usuarios pendientes de aprobación
export async function GET() {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { isApproved: false },
      select: { id: true, email: true, nombre: true, departamento: true, createdAt: true },
    });
    return NextResponse.json(pendingUsers);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios pendientes' }, { status: 500 });
  }
}

// Aprobar y asignar usuario a una empresa
export async function PATCH(request: Request) {
  try {
    const { userId, companyId } = await request.json();

    if (!userId || !companyId) {
      return NextResponse.json({ error: 'Se requiere el userId y el companyId' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        companyId: companyId,
      },
    });

    return NextResponse.json({ message: 'Usuario aprobado y asignado con éxito', updatedUser });
  } catch (error) {
    return NextResponse.json({ error: 'Error al aprobar el usuario' }, { status: 500 });
  }
}