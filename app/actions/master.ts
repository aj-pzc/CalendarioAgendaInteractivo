'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function verifyMasterSession() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get('userId')?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });

  return user?.role === 'MASTER' ? sessionUserId : null;
}

// 1. Crear Empresa
export async function createCompanyAction(formData: FormData) {
  const isMaster = await verifyMasterSession();
  if (!isMaster) return;

  const nombre = formData.get('nombre') as string;
  const horasDisponibles = parseFloat(formData.get('horasDisponibles') as string || '0');

  if (!nombre) return;

  try {
    await prisma.company.create({
      data: { nombre, horasDisponibles, horasUsadas: 0 },
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
  if (!isMaster) return;

  const companyId = formData.get('companyId') as string;
  const cantidad = parseFloat(formData.get('cantidad') as string || '0');
  const tipoAccion = formData.get('tipoAccion') as string; // 'SUMAR_DISPONIBLES', 'RESTAR_DISPONIBLES', etc.

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return;

    let nuevasDisponibles = company.horasDisponibles;
    let nuevasUsadas = company.horasUsadas;

    if (tipoAccion === 'SUMAR_DISPONIBLES') nuevasDisponibles += cantidad;
    if (tipoAccion === 'RESTAR_DISPONIBLES') nuevasDisponibles = Math.max(0, nuevasDisponibles - cantidad);
    
    if (tipoAccion === 'SUMAR_USADAS') nuevasUsadas += cantidad;
    if (tipoAccion === 'RESTAR_USADAS') nuevasUsadas = Math.max(0, nuevasUsadas - cantidad);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        horasDisponibles: nuevasDisponibles,
        horasUsadas: nuevasUsadas,
      },
    });

    revalidatePath('/master');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al actualizar horas:', error);
  }
}

// 3. Eliminar Empresa (con borrado en cascada manual o nativo de BD)
export async function deleteCompanyAction(formData: FormData) {
  const isMaster = await verifyMasterSession();
  if (!isMaster) return;

  const companyId = formData.get('companyId') as string;
  if (!companyId) return;

  try {
    // Si tu base de datos soporta onDelete Cascade nativo, prisma.company.delete basta.
    // Para mayor seguridad en código, eliminamos dependencias si es necesario:
    await prisma.reservation.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });

    revalidatePath('/master');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al eliminar la empresa:', error);
  }
}

// 4. Actualizar Usuario
export async function updateUserAdminAction(formData: FormData) {
  const isMaster = await verifyMasterSession();
  if (!isMaster) return;

  const userId = formData.get('userId') as string;
  const isApproved = formData.get('isApproved') === 'true';
  const role = formData.get('role') as string;
  const companyId = formData.get('companyId') as string;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        companyId: companyId || null,
        role: role as any,
        isApproved,
      },
    });
    revalidatePath('/');
    return { success: true };
    
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
  }
}