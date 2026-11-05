'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const emailOrUser = formData.get('emailOrUser') as string; 
  const password = formData.get('password') as string;

  if (!emailOrUser || !password) {
    return { error: 'Por favor completa todos los campos.' };
  }

  // Busca si coincide con email o username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUser },
        { username: emailOrUser },
      ],
    },
    include: { company: true },
  });

  if (!user || !user.passwordHash) {
    return { error: 'Credenciales inválidas.' };
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return { error: 'Contraseña incorrecta.' };
  }

  if (!user.isApproved) {
    return { error: 'Tu cuenta aún no ha sido aprobada por el administrador.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('userId', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/');
}

export async function registerAction(prevState: any, formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const empresaInput = formData.get('empresa') as string; // Referencia de texto opcional

  if (!nombre || !username || !email || !password) {
    return { error: 'Faltan campos obligatorios para el registro.' };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { error: 'El correo electrónico ya está registrado.' };
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return { error: 'El nombre de usuario ya está en uso.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      nombre,
      username,
      email,
      passwordHash: hashedPassword,
      departamento: empresaInput || null, 
      companyId: null,                   
      isApproved: false,                 
      role: 'USER',
    },
  });

  redirect('/login?registered=true');
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const username = formData.get('username') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !username || !newPassword || !confirmPassword) {
    return { error: 'Por favor completa todos los campos.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Las nuevas contraseñas no coinciden.' };
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      username,
    },
  });

  if (!user) {
    return { error: 'Los datos no coinciden.' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedPassword },
  });

  return { success: '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.' };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/login');
}