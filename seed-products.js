const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'operator1' },
    update: {},
    create: {
      username: 'operator1',
      passwordHash: hashedPassword,
      fullName: 'Test Operator',
      role: 'operator',
    },
  });
  console.log('✅ User created:', user.username);

  // Create products with visual descriptions
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Coca-Cola 350ml',
        visualDescription: 'Lata roja con logo blanco de Coca-Cola',
        detectionKeywords: ['coca', 'cola', 'lata', 'roja'],
        category: 'Bebidas',
        brand: 'Coca-Cola',
      },
      {
        name: 'Sprite 350ml',
        visualDescription: 'Lata verde con logo Sprite',
        detectionKeywords: ['sprite', 'lata', 'verde', 'limón'],
        category: 'Bebidas',
        brand: 'Coca-Cola',
      },
      {
        name: 'Lays Original 100gr',
        visualDescription: 'Bolsa amarilla de papas Lays',
        detectionKeywords: ['lays', 'papas', 'bolsa', 'amarilla'],
        category: 'Snacks',
        brand: 'Lays',
      },
      {
        name: 'Pepsi 350ml',
        visualDescription: 'Lata azul con logo blanco de Pepsi',
        detectionKeywords: ['pepsi', 'lata', 'azul'],
        category: 'Bebidas',
        brand: 'Pepsi',
      },
      {
        name: 'Doritos Nacho 100gr',
        visualDescription: 'Bolsa roja con triángulos amarillos Doritos',
        detectionKeywords: ['doritos', 'nacho', 'bolsa', 'roja'],
        category: 'Snacks',
        brand: 'Doritos',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Products created:', products.count);

  // Create flight
  const flight = await prisma.flight.create({
    data: {
      flightNumber: 'AA2345',
      departureTime: new Date('2025-10-26T14:30:00Z'),
      origin: 'MEX',
      destination: 'JFK',
      status: 'scheduled',
    },
  });
  console.log('✅ Flight created:', flight.flightNumber);

  // Create trolley
  const trolley = await prisma.trolley.create({
    data: {
      trolleyCode: 'TRLLY-001',
      flightId: flight.flightId,
      status: 'empty',
    },
  });
  console.log('✅ Trolley created:', trolley.trolleyCode);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
