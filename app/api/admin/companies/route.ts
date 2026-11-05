import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMasterApiAccess } from '@/lib/api-auth';

export async function GET() {
  const accessError = await requireMasterApiAccess();
  if (accessError) return accessError;

  try {
    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            nombre: true,
            departamento: true,
            role: true,
            isApproved: true,
            companyId: true,
          },
        },
      },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const accessError = await requireMasterApiAccess();
  if (accessError) return accessError;

  try {
    const { nombre, horasDisponibles } = await request.json();
    if (typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const parsedHours = horasDisponibles === undefined ? 0 : Number(horasDisponibles);
    if (!Number.isFinite(parsedHours) || parsedHours < 0) {
      return NextResponse.json({ error: 'Las horas disponibles deben ser un número no negativo' }, { status: 400 });
    }

    const newCompany = await prisma.company.create({
      data: {
        nombre: nombre.trim(),
        horasDisponibles: parsedHours,
      },
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
  }
}