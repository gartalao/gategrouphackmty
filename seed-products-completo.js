const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database con catálogo COMPLETO...');

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

  // Catálogo COMPLETO con ID, nombre, keywords y hints visuales
  const productsData = [
    // BEBIDAS - REFRESCOS (Latas)
    {
      name: 'Coca-Cola Regular Lata',
      visualDescription: 'Lata roja, anilla roja, logo "Coca-Cola" blanco',
      detectionKeywords: ['coke_reg', 'coca', 'cola', 'roja', 'red'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Coca-Cola Light Lata',
      visualDescription: 'Lata plateada/gris, aro rojo, texto "Light"',
      detectionKeywords: ['coke_light', 'coca', 'light', 'plateada', 'silver'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Coca-Cola Zero Lata',
      visualDescription: 'Lata negra, acentos rojos, texto "Zero" o aro negro',
      detectionKeywords: ['coke_zero', 'coca', 'zero', 'negra', 'black'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Sprite Lata',
      visualDescription: 'Lata verde, logo con estrella/limón verde-azul',
      detectionKeywords: ['sprite', 'verde', 'green', 'limon', 'lemon'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Ciel Agua Mineral Lata',
      visualDescription: 'Lata celeste/azul claro, texto "Ciel" o "Agua mineral"',
      detectionKeywords: ['ciel', 'agua', 'mineral', 'celeste', 'blue'],
      category: 'Bebidas',
      brand: 'Coca-Cola',
    },
    {
      name: 'Schweppes Agua Tónica Lata',
      visualDescription: 'Lata amarilla "Schweppes"',
      detectionKeywords: ['schweppes', 'tonic', 'tonica', 'amarilla', 'yellow'],
      category: 'Bebidas',
      brand: 'Schweppes',
    },
    
    // BEBIDAS - HIDRATACIÓN
    {
      name: 'Electrolit Botella 355ml',
      visualDescription: 'Botella PET 355ml, tapa azul, líquido rosa',
      detectionKeywords: ['electrolit', 'botella', 'rosa', 'pink', 'hidratante'],
      category: 'Bebidas',
      brand: 'Electrolit',
    },
    
    // BEBIDAS - CERVEZAS (Latas)
    {
      name: 'Amstel Ultra Lata',
      visualDescription: 'Lata blanca alta con franja azul',
      detectionKeywords: ['amstel', 'ultra', 'blanca', 'azul', 'white'],
      category: 'Bebidas',
      brand: 'Amstel',
    },
    {
      name: 'Modelo Especial Lata',
      visualDescription: 'Lata blanca con dorado "Modelo"',
      detectionKeywords: ['modelo', 'especial', 'dorada', 'gold'],
      category: 'Bebidas',
      brand: 'Modelo',
    },
    {
      name: 'Corona Extra Lata',
      visualDescription: 'Lata azul/blanco "Corona"',
      detectionKeywords: ['corona', 'extra', 'azul', 'blue'],
      category: 'Bebidas',
      brand: 'Corona',
    },
    
    // BEBIDAS - CERVEZAS (Botellas)
    {
      name: 'Heineken Botella',
      visualDescription: 'Botella verde cristal, estrella roja',
      detectionKeywords: ['heineken', 'botella', 'verde', 'green', 'star'],
      category: 'Bebidas',
      brand: 'Heineken',
    },
    
    // BEBIDAS - JUGOS (Tetra Packs)
    {
      name: 'Del Valle Naranja',
      visualDescription: 'Tetra pack naranja, marca Del Valle',
      detectionKeywords: ['valle', 'naranja', 'orange', 'tetra'],
      category: 'Bebidas',
      brand: 'Del Valle',
    },
    {
      name: 'Del Valle Durazno',
      visualDescription: 'Tetra pack durazno/melocotón, marca Del Valle',
      detectionKeywords: ['valle', 'durazno', 'peach', 'tetra'],
      category: 'Bebidas',
      brand: 'Del Valle',
    },
    {
      name: 'Del Valle Uva',
      visualDescription: 'Tetra pack morado/negro, marca Del Valle uva',
      detectionKeywords: ['valle', 'uva', 'grape', 'morado', 'purple'],
      category: 'Bebidas',
      brand: 'Del Valle',
    },
    {
      name: 'Santa Clara Chocolate',
      visualDescription: 'Tetra pack negro/marrón con marca Santa Clara',
      detectionKeywords: ['santa', 'clara', 'chocolate', 'negro', 'brown'],
      category: 'Bebidas',
      brand: 'Santa Clara',
    },
    
    // SNACKS - GALLETAS
    {
      name: 'Galletas Príncipe',
      visualDescription: 'Empaque azul con marca Príncipe',
      detectionKeywords: ['principe', 'galleta', 'azul', 'blue'],
      category: 'Snacks',
      brand: 'Príncipe',
    },
    {
      name: 'Galletas Canelitas',
      visualDescription: 'Empaque rojo con marca Canelitas',
      detectionKeywords: ['canelitas', 'galleta', 'roja', 'red'],
      category: 'Snacks',
      brand: 'Gamesa',
    },
    
    // SNACKS - PAPAS (ya existentes pero los incluyo)
    {
      name: 'Sabritas Original',
      visualDescription: 'Bolsa amarilla brillante con logo rojo Sabritas',
      detectionKeywords: ['sabritas', 'papas', 'amarilla', 'yellow'],
      category: 'Snacks',
      brand: 'Sabritas',
    },
    {
      name: 'Doritos Nacho',
      visualDescription: 'Bolsa roja/naranja con triángulos, logo Doritos',
      detectionKeywords: ['doritos', 'nacho', 'roja', 'naranja', 'red'],
      category: 'Snacks',
      brand: 'Doritos',
    },
    {
      name: 'Takis',
      visualDescription: 'Bolsa morada/azul con logo Takis',
      detectionKeywords: ['takis', 'morada', 'purple', 'picante'],
      category: 'Snacks',
      brand: 'Takis',
    },
  ];

  // Delete dependencies first, then products
  await prisma.flightRequirement.deleteMany({});
  await prisma.productDetection.deleteMany({});
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

