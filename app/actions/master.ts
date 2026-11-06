'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSessionUserId } from '@/lib/session';
import { getHoursPeriod, lockAndGetCompanyHours } from '@/lib/company-hours';

async function verifyMasterSession() {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true, isApproved: true },
  });

  return user?.role === 'MASTER' && user.isApproved ? sessionUserId : null;
}

// 1. Crear Empresa
export async function createCompanyAction(formData: FormData) {
  const isMaster = await verifyMasterSession();
  if (!isMaster) return;

  const nombre = formData.get('nombre');
  const horasDisponibles = Number(formData.get('horasDisponibles') || 0);

  if (typeof nombre !== 'string' || !nombre.trim() || !Number.isFinite(horasDisponibles) || horasDisponibles < 0) {
    return;
  }

  try {
    await prisma.company.create({
      data: { nombre: nombre.trim(), horasDisponibles, horasUsadas: 0, horasPeriodo: getHoursPeriod() },
    });
    revalidatePath('/master');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al crear empresa:', error);
  }
}

// 2. Modificar / Ajustar Horas de la Empresa (Suma o Resta mediante operador matemático o valor directo)
export async function updateCompanyHoursAction(formData: FormData) {
  const isMaster = await verifyMasterSession();
  if (!isMaster) return { error: 'No tienes permisos para modificar horas.' };

  const companyId = formData.get('companyId');
  const rawCantidad = formData.get('cantidad');
  const cantidad = typeof rawCantidad === 'string' ? Number(rawCantidad) : Number.NaN;
  const tipoAccion = formData.get('tipoAccion');

  if (
    typeof companyId !== 'string' ||
    !companyId ||
    !Number.isFinite(cantidad) ||
    cantidad <= 0 ||
    typeof tipoAccion !== 'string' ||
    !['SUMAR_DISPONIBLES', 'RESTAR_DISPONIBLES', 'SUMAR_USADAS', 'RESTAR_USADAS'].includes(tipoAccion)
  ) {
    return { error: 'Los datos del ajuste de horas no son válidos.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const company = await lockAndGetCompanyHours(tx, companyId);
      if (!company) return { error: 'La empresa seleccionada no existe.' };

      let horasDisponibles = company.horasDisponibles;
      let horasUsadas = company.horasUsadas;

      if (tipoAccion === 'SUMAR_DISPONIBLES') horasDisponibles += cantidad;
      if (tipoAccion === 'RESTAR_DISPONIBLES') horasDisponibles = Math.max(0, horasDisponibles - cantidad);
      if (tipoAccion === 'SUMAR_USADAS') horasUsadas += cantidad;
      if (tipoAccion === 'RESTAR_USADAS') horasUsadas = Math.max(0, horasUsadas - cantidad);

      await tx.company.update({
        where: { id: companyId },
        data: {
          horasDisponibles: Math.round(horasDisponibles * 100) / 100,
          horasUsadas: Math.round(horasUsadas * 100) / 100,
        },
      });

      return { success: true };
    });

    if ('error' in result) return result;
    revalidatePath('/master');
    revalidatePath('/');
    return result;
  } catch (error) {
    console.error('Error al actualizar horas:', error);
    return { error: 'No se pudieron actualizar las horas de la empresa.' };
  }
}

// 3. Eliminar Empresa (con borrado en cascada manual o nativo de BD)
export async function deleteCompanyAction(formData: FormData) {
  const isMaster = await verifyMasterSession();
  if (!isMaster) return { error: 'No tienes permisos para eliminar empresas.' };

  const companyId = formData.get('companyId');
  if (typeof companyId !== 'string' || !companyId) {
    return { error: 'La empresa seleccionada no es válida.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({ where: { id: companyId } });
      if (!company) throw new Error('La empresa ya no existe.');

      await tx.reservation.deleteMany({ where: { companyId } });
      await tx.user.deleteMany({ where: { companyId } });
      await tx.company.delete({ where: { id: companyId } });
    });

    revalidatePath('/master');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar la empresa:', error);
    return { error: error instanceof Error ? error.message : 'No se pudo eliminar la empresa.' };
  }
}

export async function deleteUserAdminAction(formData: FormData) {
  const sessionUserId = await verifyMasterSession();
  if (!sessionUserId) return { error: 'No tienes permisos para eliminar usuarios.' };

  const userId = formData.get('userId');
  if (typeof userId !== 'string' || !userId) {
    return { error: 'El usuario seleccionado no es válido.' };
  }
  if (userId === sessionUserId) {
    return { error: 'No puedes eliminar tu propia cuenta.' };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/master');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { error: 'No se pudo eliminar el usuario.' };
  }
}

// 4. Actualizar Usuario
export async function updateUserAdminAction(formData: FormData) {
  const isMaster = await verifyMasterSession();
  if (!isMaster) return;

  const userId = formData.get('userId');
  const isApproved = formData.get('isApproved') === 'true';
  const role = formData.get('role');
  const companyId = formData.get('companyId');

  if (
    typeof userId !== 'string' ||
    !userId ||
    typeof role !== 'string' ||
    !['USER', 'ADMIN', 'MASTER'].includes(role) ||
    typeof companyId !== 'string'
  ) {
    return { error: 'Los datos del usuario no son válidos.' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        companyId: companyId || null,
        role,
        isApproved,
      },
    });
    revalidatePath('/');
    return { success: true };
    
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
  }
}