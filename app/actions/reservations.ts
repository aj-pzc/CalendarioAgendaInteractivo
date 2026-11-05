'use server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

interface CreateReservationParams {
  userId: string;
  titulo: string;
  recurso: string;
  startTime: string; 
  endTime: string;
  targetCompanyId?: string;
}

interface UpdateReservationParams {
  id: string;
  titulo: string;
  recurso: string;
  startTime: string;
  endTime: string;
}

export async function createReservation({
  userId,
  titulo,
  recurso,
  startTime,
  endTime,
  targetCompanyId,
}: CreateReservationParams) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('userId')?.value;

    if (!sessionUserId) {
      return { error: 'Sesión no válida. Por favor inicia sesión nuevamente.' };
    }

    // 1. Obtener los datos del usuario actual para validar su Rol y Empresa
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser || !currentUser.companyId) {
      return { error: 'Usuario o empresa no encontrados.' };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    const isPastBooking = start < now;
    const isMaster = currentUser.role === 'MASTER';

    if (isPastBooking && !isMaster) {
      return {
        error: 'No tienes permisos para agendar reservaciones en fechas u horarios pasados.',
      };
    }

    if (end <= start) {
      return { error: 'La hora de fin debe ser posterior a la hora de inicio.' };
    }

    // 3. Calcular horas solicitadas
    const diffMs = end.getTime() - start.getTime();
    const horasSolicitadas = Math.max(0, diffMs / (1000 * 60 * 60));

    const finalCompanyId = isMaster && targetCompanyId ? targetCompanyId : currentUser.companyId;
    if (!finalCompanyId) {
      return { error: 'No se ha especificado una empresa válida para la reserva.' };
    }

    // 4. Crear la reservación
    await prisma.reservation.create({
      data: {
        titulo,
        recurso: recurso || 'SALA',
        startTime: start,
        endTime: end,
        horasSolicitadas,
        userId: currentUser.id,
        companyId: finalCompanyId,
        estado: 'CONFIRMADA',
      },
    });

    await prisma.company.update({
      where: { id: finalCompanyId },
      data: { horasUsadas: { increment: horasSolicitadas } },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al crear reservación:', error);
    return { error: 'Ocurrió un error en el servidor al guardar la reserva.' };
  }
}

export async function deleteReservationAction(reservationId: string) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('userId')?.value;

    if (!sessionUserId) {
      return { error: 'Sesión no válida.' };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser) {
      return { error: 'Usuario no encontrado.' };
    }

    // Buscar la reserva existente
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return { error: 'La reserva ya no existe.' };
    }

    // Comprobar Permisos
    const isOwner = reservation.userId === currentUser.id;
    const isCompanyAdmin = currentUser.role === 'ADMIN' && reservation.companyId === currentUser.companyId;
    const isMaster = currentUser.role === 'MASTER';

    if (!isOwner && !isCompanyAdmin && !isMaster) {
      return { error: 'No tienes permisos para cancelar esta reserva.' };
    }

    // Eliminar la reserva
    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return { error: 'No se pudo cancelar la reserva.' };
  }
}

export async function checkConflict({
  recurso,
  startTime,
  endTime,
  excludeReservationId,
}: {
  recurso: 'SALA' | 'OFICINA';
  startTime: Date;
  endTime: Date;
  excludeReservationId?: string;
}) {
  const conflict = await prisma.reservation.findFirst({
    where: {
      recurso,
      // Opcional: Ignorar reservas que estén canceladas si usas esa columna
      estado: { not: 'CANCELADA' }, 
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      AND: [
        {
          startTime: { lt: endTime },
        },
        {
          endTime: { gt: startTime },
        },
      ],
    },
  });

  return !!conflict;
}

export async function updateReservationAction({
  id,
  titulo,
  recurso,
  startTime,
  endTime,
}: UpdateReservationParams) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('userId')?.value;

    if (!sessionUserId) {
      return { error: 'Sesión no válida.' };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser) {
      return { error: 'Usuario no encontrado.' };
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return { error: 'La reserva no existe.' };
    }

    // Verificar permisos
    const isOwner = reservation.userId === currentUser.id;
    const isCompanyAdmin = currentUser.role === 'ADMIN' && reservation.companyId === currentUser.companyId;
    const isMaster = currentUser.role === 'MASTER';

    if (!isOwner && !isCompanyAdmin && !isMaster) {
      return { error: 'No tienes permisos para modificar esta reserva.' };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now && !isMaster) {
      return { error: 'No puedes programar reservas en horarios pasados.' };
    }

    if (end <= start) {
      return { error: 'La hora de fin debe ser posterior a la de inicio.' };
    }

    const diffMs = end.getTime() - start.getTime();
    const horasSolicitadas = Math.max(0, diffMs / (1000 * 60 * 60));

    await prisma.reservation.update({
      where: { id },
      data: {
        titulo,
        recurso,
        startTime: start,
        endTime: end,
        horasSolicitadas,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return { error: 'No se pudo actualizar la reserva.' };
  }
}