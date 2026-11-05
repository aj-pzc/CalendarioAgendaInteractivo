'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { clearSessionCookie, getSessionUserId, setSessionCookie } from '@/lib/session';

type AuthActionState = { error?: string; success?: string } | null;

export async function loginAction(_prevState: AuthActionState, formData: FormData) {
  const emailOrUser = formData.get('emailOrUser');
  const password = formData.get('password');

  if (typeof emailOrUser !== 'string' || typeof password !== 'string' || !emailOrUser || !password) {
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
    await clearSessionCookie();
    return { error: 'Tu cuenta aún no ha sido aprobada por el administrador.' };
  }

  await setSessionCookie(user.id);

  redirect('/');
}

export async function registerAction(_prevState: AuthActionState, formData: FormData) {
  const nombre = formData.get('nombre');
  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');
  const empresaInput = formData.get('empresa');

  if (
    typeof nombre !== 'string' ||
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !nombre ||
    !username ||
    !email ||
    !password
  ) {
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
      departamento: typeof empresaInput === 'string' ? empresaInput || null : null,
      companyId: null,
      isApproved: false,
      role: 'USER',
    },
  });

  redirect('/login?registered=true');
}

export async function forgotPasswordAction(_prevState: AuthActionState, formData: FormData) {
  const email = formData.get('email');
  const username = formData.get('username');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (
    typeof email !== 'string' ||
    typeof username !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof confirmPassword !== 'string' ||
    !email ||
    !username ||
    !newPassword ||
    !confirmPassword
  ) {
    return { error: 'Por favor completa todos los campos.' };
  }

  if (newPassword.length < 8) {
    return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Las nuevas contraseñas no coinciden.' };
  }

  const user = await prisma.user.findFirst({
    where: { email, username },
    select: { id: true },
  });

  if (!user) {
    return { error: 'No se encontró una cuenta que coincida con esos datos.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, isApproved: false },
  });

  if ((await getSessionUserId()) === user.id) {
    await clearSessionCookie();
  }

  return {
    success:
      'La contraseña se actualizó y tu cuenta quedó pendiente de verificación. El administrador debe aprobarla antes de que puedas iniciar sesión.',
  };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}