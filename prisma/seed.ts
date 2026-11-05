import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}.`);
  }
  return value;
}

async function main() {
  const email = requiredEnv('SEED_MASTER_EMAIL');
  const username = requiredEnv('SEED_MASTER_USERNAME');
  const nombre = requiredEnv('SEED_MASTER_NAME');
  const password = requiredEnv('SEED_MASTER_PASSWORD');
  const companyName = process.env.SEED_MASTER_COMPANY?.trim() || 'CCR Business';
  const departamento = process.env.SEED_MASTER_DEPARTMENT?.trim() || 'Dirección';

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, role: true },
  });

  if (existingUser) {
    if (existingUser.role !== 'MASTER') {
      throw new Error('El correo o usuario configurado ya pertenece a un perfil que no es MASTER.');
    }
    console.log('La cuenta MASTER ya existe; no se modificó.');
    return;
  }

  const company = await prisma.company.upsert({
    where: { nombre: companyName },
    update: {},
    create: { nombre: companyName },
  });

  await prisma.user.create({
    data: {
      email,
      username,
      nombre,
      departamento,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'MASTER',
      isApproved: true,
      companyId: company.id,
    },
  });

  console.log('La cuenta MASTER fue creada.');
}

main()
  .catch((error) => {
    console.error('Error durante el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
