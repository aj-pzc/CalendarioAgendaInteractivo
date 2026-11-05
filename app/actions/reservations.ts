'use server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getSessionUserId } from '@/lib/session';

type Recurso = 'SALA' | 'OFICINA';

interface CreateReservationParams {
  titulo: string;
  recurso: Recurso;
  startTime: string; 
  endTime: string;
  targetCompanyId?: string;
}

interface UpdateReservationParams {
  id: string;
  titulo: string;
  recurso: Recurso;
  startTime: string;
  endTime: string;
}

function isRecurso(value: string): value is Recurso {
  return value === 'SALA' || value === 'OFICINA';
}

async function hasReservationConflict(
  tx: Prisma.TransactionClient,
  recurso: Recurso,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string
) {
  return tx.reservation.findFirst({
    where: {
      recurso,
      estado: { not: 'CANCELADA' },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });
}

async function withReservationLock<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(
    async (tx) => {
      // Serialize reservation writes across companies before checking for overlapping times.
      const lock = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM Company ORDER BY id LIMIT 1 FOR UPDATE
      `;

      if (!lock.length) {
        throw new Error('No hay empresas disponibles para bloquear la operación de reservas.');
      }

      return operation(tx);
    },
    { maxWait: 10000, timeout: 15000 }
  );
}

export async function createReservation({
  titulo,
  recurso,
  startTime,
  endTime,
  targetCompanyId,
}: CreateReservationParams) {
  try {
    const sessionUserId = await getSessionUserId();

    if (!sessionUserId) {
      return { error: 'Sesión no válida. Por favor inicia sesión nuevamente.' };
    }

    // 1. Obtener los datos del usuario actual para validar su Rol y Empresa
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, companyId: true, isApproved: true },
    });

    if (currentUser && !currentUser.isApproved) {
      return { error: 'Tu cuenta está pendiente de aprobación.' };
    }

    if (!currentUser || !currentUser.companyId) {
      return { error: 'Usuario o empresa no encontrados.' };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (!isRecurso(recurso)) {
      return { error: 'El espacio seleccionado no es válido.' };
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: 'La fecha u hora seleccionada no es válida.' };
    }

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

    const created = await withReservationLock(async (tx) => {
      const conflict = await hasReservationConflict(tx, recurso, start, end);
      if (conflict) return false;

      await tx.reservation.create({
        data: {
          titulo,
          recurso,
          startTime: start,
          endTime: end,
          horasSolicitadas,
          userId: currentUser.id,
          companyId: finalCompanyId,
          estado: 'CONFIRMADA',
        },
      });

      await tx.company.update({
        where: { id: finalCompanyId },
        data: { horasUsadas: { increment: horasSolicitadas } },
      });

      return true;
    });

    if (!created) {
      return { error: 'El espacio ya está reservado en ese horario. Selecciona otro horario.' };
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al crear reservación:', error);
    return { error: 'Ocurrió un error en el servidor al guardar la reserva.' };
  }
}

export async function deleteReservationAction(reservationId: string) {
  try {
    const sessionUserId = await getSessionUserId();

    if (!sessionUserId) {
      return { error: 'Sesión no válida.' };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, companyId: true, isApproved: true },
    });

    if (!currentUser || !currentUser.isApproved) {
      return { error: 'Tu cuenta está pendiente de aprobación o no existe.' };
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

export async function updateReservationAction({
  id,
  titulo,
  recurso,
  startTime,
  endTime,
}: UpdateReservationParams) {
  try {
    const sessionUserId = await getSessionUserId();

    if (!sessionUserId) {
      return { error: 'Sesión no válida.' };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, companyId: true, isApproved: true },
    });

    if (!currentUser || !currentUser.isApproved) {
      return { error: 'Tu cuenta está pendiente de aprobación o no existe.' };
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

    if (!isRecurso(recurso)) {
      return { error: 'El espacio seleccionado no es válido.' };
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: 'La fecha u hora seleccionada no es válida.' };
    }

    if (start < now && !isMaster) {
      return { error: 'No puedes programar reservas en horarios pasados.' };
    }

    if (end <= start) {
      return { error: 'La hora de fin debe ser posterior a la de inicio.' };
    }

    const diffMs = end.getTime() - start.getTime();
    const horasSolicitadas = Math.max(0, diffMs / (1000 * 60 * 60));

    const updated = await withReservationLock(async (tx) => {
      const conflict = await hasReservationConflict(tx, recurso, start, end, id);
      if (conflict) return false;

      await tx.reservation.update({
        where: { id },
        data: {
          titulo,
          recurso,
          startTime: start,
          endTime: end,
          horasSolicitadas,
        },
      });

      return true;
    });

    if (!updated) {
      return { error: 'El espacio ya está reservado en ese horario. Selecciona otro horario.' };
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return { error: 'No se pudo actualizar la reserva.' };
  }
}