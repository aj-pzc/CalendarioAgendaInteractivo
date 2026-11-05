import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nombre, username, departamento } = body;

    // 1. Validaciones básicas
    if (!email || !password || !nombre || !username) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (email, password, nombre, username)' },
        { status: 400 }
      );
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email, username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico o nombre de usuario ya están registrados' },
        { status: 400 }
      );
    }

    // 3. Hashear la contraseña de forma segura
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear el usuario con isApproved en false y companyId en null (Modelo B2B)
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        nombre,
        departamento: departamento || null,
        role: 'USER',          // Por defecto nacen como usuarios estándar
        isApproved: false,     // Requiere aprobación explícita del Admin
        companyId: null,       // Sin empresa asignada hasta que el Admin lo decida
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario registrado con éxito. Pendiente de aprobación por el Administrador.',
        userId: newUser.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}