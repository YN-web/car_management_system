import { PrismaClient } from '@prisma/client';

const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Prisma 7 driver adapter accepts the connection URL in the options object
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create Super_Admin role
  await prisma.role.upsert({
    where: { name: 'Super_Admin' },
    update: {},
    create: {
      name: 'Super_Admin',
      isSuperAdmin: true,
    },
  });

  // 2. Base categories for the expense ledger
  const defaultCategories = [
    'Garage',
    'Insurance',
    'Technical control fees',
    'Car wash',
    'Spare parts',
    'Other',
  ];

  const garages = [
    {
      name : 'Gishushu repairs co',
      contactName : 'Marie Luise',
      contactPhone: '+250790038123',
      address: 'KG 23 Rd, Gishushu',
      email: 'info@gishushurep.rw',
    }
  ];
  for (const garage of garages) {
    await prisma.garage.create({
      data: garage,
    });
  }
  
  const enterprises = [
    {
      name : 'Kigali Logistic ltd',
    },
    {
      name: 'Rwanda Transport Co',
    }
  ];
 for (const ent of enterprises) {
    const existing = await prisma.enterprise.findFirst({
      where: { name: ent.name },
    });

    if (!existing) {
      await prisma.enterprise.create({
        data: ent,
      });
    }
  }

  for (const name of defaultCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });