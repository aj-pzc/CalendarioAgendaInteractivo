import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el proceso de seed...');

  const ccrCompany = await prisma.company.upsert({
    where: { nombre: 'CCR Business' },
    update: {},
    create: {
      nombre: 'CCR Business',
      horasDisponibles: 0.0,
      horasUsadas: 0.0,
    },
  });

  console.log(`Empresa configurada: ${ccrCompany.nombre}`);

  // 2. Definir los usuarios para cada rol requerido
  const usuariosPrueba = [
    {
      username: 'master_ccr',
      email: 'master@ccr.com',
      nombre: 'Usuario Master CCR',
      departamento: 'Dirección',
      passwordHash: 'password',
      role: 'MASTER',
      isApproved: true,
      companyId: ccrCompany.id,
    },
    {
      username: 'admin_ccr',
      email: 'admin@ccr.com',
      nombre: 'Usuario Admin CCR',
      departamento: 'Administración',
      passwordHash: 'password',
      role: 'ADMIN',
      isApproved: true,
      companyId: ccrCompany.id,
    },
    {
      username: 'user_ccr',
      email: 'user@ccr.com',
      nombre: 'Usuario Regular CCR',
      departamento: 'Operaciones',
      passwordHash: 'password',
      role: 'USER',
      isApproved: true,
      companyId: ccrCompany.id,
    },
  ];

  // 3. Insertar o actualizar cada usuario
  for (const userData of usuariosPrueba) {
    const usuario = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        username: userData.username,
        nombre: userData.nombre,
        role: userData.role,
        isApproved: userData.isApproved,
      },
      create: userData,
    });
    console.log(`Usuario creado/actualizado: [${usuario.role}] ${usuario.email}`);
  }

  console.log('¡Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });