const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database con productos para detección visual...');

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

  // Create products with visual descriptions and keywords
  const productsData = [
    {
      name: 'Coca-Cola 350ml',
      visualDescription: 'Lata roja con logo blanco de Coca-Cola',
      detectionKeywords: ['coca', 'cola', 'lata roja', 'logo blanco'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Coca-Cola Zero 350ml',
      visualDescription: 'Lata negra con logo rojo y plata de Coca-Cola Zero',
      detectionKeywords: ['coca', 'zero', 'lata negra'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Sprite 350ml',
      visualDescription: 'Lata verde con logo Sprite en blanco y amarillo',
      detectionKeywords: ['sprite', 'lata verde', 'limón'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Pepsi 350ml',
      visualDescription: 'Lata azul con logo blanco de Pepsi',
      detectionKeywords: ['pepsi', 'lata azul'],
      category: 'Bebidas',
      brand: 'Pepsi',
    },
    {
      name: 'Agua Natural 500ml',
      visualDescription: 'Botella de plástico transparente con agua',
      detectionKeywords: ['agua', 'botella transparente'],
      category: 'Bebidas',
      brand: 'Genérico',
    },
    {
      name: 'Lays Original 100gr',
      visualDescription: 'Bolsa de papas amarilla con logo rojo Lays',
      detectionKeywords: ['lays', 'bolsa amarilla', 'papas'],
      category: 'Snacks',
      brand: 'Lays',
    },
    {
      name: 'Lays Queso 100gr',
      visualDescription: 'Bolsa de papas naranja con logo rojo Lays sabor queso',
      detectionKeywords: ['lays', 'queso', 'bolsa naranja'],
      category: 'Snacks',
      brand: 'Lays',
    },
    {
      name: 'Doritos Nacho 100gr',
      visualDescription: 'Bolsa roja con triángulos amarillos, logo Doritos',
      detectionKeywords: ['doritos', 'bolsa roja', 'nacho'],
      category: 'Snacks',
      brand: 'Doritos',
    },
  ];

  // Delete old products and insert new ones
  await prisma.product.deleteMany({});
  await prisma.product.createMany({
    data: productsData,
  });
  console.log(`✅ Products created: ${productsData.length}`);

  // Create flight
  const flight = await prisma.flight.upsert({
    where: { flightNumber: 'AA2345' },
    update: {},
    create: {
      flightNumber: 'AA2345',
      departureTime: new Date('2025-10-26T14:30:00Z'),
      origin: 'MEX',
      destination: 'JFK',
      status: 'scheduled',
    },
  });
  console.log('✅ Flight created:', flight.flightNumber);

  // Create trolley
  const trolley = await prisma.trolley.upsert({
    where: { trolleyCode: 'TRLLY-001' },
    update: {},
    create: {
      trolleyCode: 'TRLLY-001',
      flightId: flight.flightId,
      status: 'empty',
    },
  });
  console.log('✅ Trolley created:', trolley.trolleyCode);

  // Create flight requirements
  const products = await prisma.product.findMany({
    where: {
      name: {
        in: ['Coca-Cola 350ml', 'Sprite 350ml', 'Lays Original 100gr'],
      },
    },
  });

  for (const product of products) {
    await prisma.flightRequirement.upsert({
      where: {
        unique_requirement: {
          flightId: flight.flightId,
          trolleyId: trolley.trolleyId,
          productId: product.productId,
        },
      },
      update: {},
      create: {
        flightId: flight.flightId,
        trolleyId: trolley.trolleyId,
        productId: product.productId,
        expectedQuantity: 10,
        priority: 'normal',
      },
    });
  }
  console.log('✅ Flight requirements created');

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📦 Productos listos para detectar:');
  productsData.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} - ${p.visualDescription}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
