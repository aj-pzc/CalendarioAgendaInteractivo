import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todas las empresas
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: { users: true },
    });
    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
  }
}

// Crear una nueva empresa
export async function POST(request: Request) {
  try {
    const { nombre, horasDisponibles } = await request.json();
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const newCompany = await prisma.company.create({
      data: {
        nombre,
        horasDisponibles: horasDisponibles ? parseFloat(horasDisponibles) : 0,
      },
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
  }
}