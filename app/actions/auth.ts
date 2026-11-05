'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { clearSessionCookie, setSessionCookie } from '@/lib/session';

export async function loginAction(_prevState: { error: string } | null, formData: FormData) {
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

  await setSessionCookie(user.id);

  redirect('/');
}

export async function registerAction(_prevState: { error: string } | null, formData: FormData) {
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

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}