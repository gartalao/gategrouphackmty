const { PrismaClient } = require('./generated/prisma')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...')
    await prisma.alert.deleteMany()
    await prisma.scanItem.deleteMany()
    await prisma.scan.deleteMany()
    await prisma.flightRequirement.deleteMany()
    await prisma.shelf.deleteMany()
    await prisma.trolley.deleteMany()
    await prisma.flight.deleteMany()
    await prisma.product.deleteMany()
    await prisma.user.deleteMany()
    
    // 1. Create Users
    console.log('👥 Creating users...')
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: 'operator01',
          passwordHash: hashedPassword,
          fullName: 'Juan Pérez',
          role: 'operator'
        }
      }),
      prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: hashedPassword,
          fullName: 'Admin Sistema',
          role: 'admin'
        }
      }),
      prisma.user.create({
        data: {
          username: 'supervisor01',
          passwordHash: hashedPassword,
          fullName: 'María González',
          role: 'supervisor'
        }
      })
    ])
    
    console.log(`✅ Created ${users.length} users`)
    
    // 2. Create Products (SKUs)
    console.log('📦 Creating products...')
    const products = await Promise.all([
      prisma.product.create({
        data: {
          sku: 'COK-REG-330',
          name: 'Coca-Cola Regular 330ml',
          category: 'Bebidas',
          brand: 'Coca-Cola',
          unitPrice: 1.50,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'COK-ZER-330',
          name: 'Coca-Cola Zero 330ml',
          category: 'Bebidas',
          brand: 'Coca-Cola',
          unitPrice: 1.50,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'PEP-REG-330',
          name: 'Pepsi Regular 330ml',
          category: 'Bebidas',
          brand: 'PepsiCo',
          unitPrice: 1.50,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'WTR-REG-500',
          name: 'Agua Natural 500ml',
          category: 'Bebidas',
          brand: 'Bonafont',
          unitPrice: 0.80,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'WTR-SPK-500',
          name: 'Agua con Gas 500ml',
          category: 'Bebidas',
          brand: 'Topo Chico',
          unitPrice: 1.00,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'JUC-ORA-250',
          name: 'Jugo de Naranja 250ml',
          category: 'Bebidas',
          brand: 'Jumex',
          unitPrice: 1.20,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'JUC-APP-250',
          name: 'Jugo de Manzana 250ml',
          category: 'Bebidas',
          brand: 'Jumex',
          unitPrice: 1.20,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'SNK-PRT-50',
          name: 'Pretzels Salados 50g',
          category: 'Snacks',
          brand: 'Snyder\'s',
          unitPrice: 2.00,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'SNK-CHI-40',
          name: 'Chips Papas 40g',
          category: 'Snacks',
          brand: 'Lays',
          unitPrice: 1.80,
          imageUrl: null
        }
      }),
      prisma.product.create({
        data: {
          sku: 'SNK-NUT-35',
          name: 'Nueces Mixtas 35g',
          category: 'Snacks',
          brand: 'Planters',
          unitPrice: 2.50,
          imageUrl: null
        }
      })
    ])
    
    console.log(`✅ Created ${products.length} products`)
    
    // 3. Create Flights
    console.log('✈️ Creating flights...')
    const flights = await Promise.all([
      prisma.flight.create({
        data: {
          flightNumber: 'AA2345',
          departureTime: new Date('2025-10-26T14:30:00Z'),
          origin: 'MEX',
          destination: 'JFK',
          status: 'scheduled'
        }
      }),
      prisma.flight.create({
        data: {
          flightNumber: 'AM0876',
          departureTime: new Date('2025-10-26T16:45:00Z'),
          origin: 'MEX',
          destination: 'MAD',
          status: 'scheduled'
        }
      }),
      prisma.flight.create({
        data: {
          flightNumber: 'DL1234',
          departureTime: new Date('2025-10-26T18:20:00Z'),
          origin: 'MEX',
          destination: 'ATL',
          status: 'scheduled'
        }
      })
    ])
    
    console.log(`✅ Created ${flights.length} flights`)
    
    // 4. Create Trolleys
    console.log('🛒 Creating trolleys...')
    const trolleys = await Promise.all([
      prisma.trolley.create({
        data: {
          trolleyCode: 'TRLLY-001',
          flightId: flights[0].flightId,
          status: 'in_progress',
          totalShelves: 3,
          assignedAt: new Date()
        }
      }),
      prisma.trolley.create({
        data: {
          trolleyCode: 'TRLLY-002',
          flightId: flights[1].flightId,
          status: 'empty',
          totalShelves: 3,
          assignedAt: null
        }
      }),
      prisma.trolley.create({
        data: {
          trolleyCode: 'TRLLY-003',
          flightId: flights[2].flightId,
          status: 'ready',
          totalShelves: 3,
          assignedAt: new Date()
        }
      })
    ])
    
    console.log(`✅ Created ${trolleys.length} trolleys`)
    
    // 5. Create Shelves
    console.log('📚 Creating shelves...')
    const shelves = []
    for (const trolley of trolleys) {
      for (let i = 1; i <= 3; i++) {
        const shelf = await prisma.shelf.create({
          data: {
            trolleyId: trolley.trolleyId,
            shelfNumber: i,
            qrCode: `QR-${trolley.trolleyCode}-SH${i}`,
            position: i === 1 ? 'top' : i === 2 ? 'middle' : 'bottom'
          }
        })
        shelves.push(shelf)
      }
    }
    
    console.log(`✅ Created ${shelves.length} shelves`)
    
    // 6. Create Flight Requirements
    console.log('📋 Creating flight requirements...')
    const requirements = await Promise.all([
      // Flight 1 (AA2345) - Trolley 1
      prisma.flightRequirement.create({
        data: {
          flightId: flights[0].flightId,
          trolleyId: trolleys[0].trolleyId,
          productId: products[0].productId, // COK-REG-330
          expectedQuantity: 24,
          priority: 'normal'
        }
      }),
      prisma.flightRequirement.create({
        data: {
          flightId: flights[0].flightId,
          trolleyId: trolleys[0].trolleyId,
          productId: products[3].productId, // WTR-REG-500
          expectedQuantity: 30,
          priority: 'critical'
        }
      }),
      prisma.flightRequirement.create({
        data: {
          flightId: flights[0].flightId,
          trolleyId: trolleys[0].trolleyId,
          productId: products[7].productId, // SNK-PRT-50
          expectedQuantity: 12,
          priority: 'normal'
        }
      }),
      prisma.flightRequirement.create({
        data: {
          flightId: flights[0].flightId,
          trolleyId: trolleys[0].trolleyId,
          productId: products[1].productId, // COK-ZER-330
          expectedQuantity: 12,
          priority: 'normal'
        }
      }),
      prisma.flightRequirement.create({
        data: {
          flightId: flights[0].flightId,
          trolleyId: trolleys[0].trolleyId,
          productId: products[5].productId, // JUC-ORA-250
          expectedQuantity: 18,
          priority: 'normal'
        }
      }),
      
      // Flight 2 (AM0876) - Trolley 2
      prisma.flightRequirement.create({
        data: {
          flightId: flights[1].flightId,
          trolleyId: trolleys[1].trolleyId,
          productId: products[0].productId, // COK-REG-330
          expectedQuantity: 20,
          priority: 'normal'
        }
      }),
      prisma.flightRequirement.create({
        data: {
          flightId: flights[1].flightId,
          trolleyId: trolleys[1].trolleyId,
          productId: products[3].productId, // WTR-REG-500
          expectedQuantity: 25,
          priority: 'critical'
        }
      }),
      prisma.flightRequirement.create({
        data: {
          flightId: flights[1].flightId,
          trolleyId: trolleys[1].trolleyId,
          productId: products[8].productId, // SNK-CHI-40
          expectedQuantity: 15,
          priority: 'normal'
        }
      })
    ])
    
    console.log(`✅ Created ${requirements.length} flight requirements`)
    
    // 7. Create Sample Scans (for demonstration)
    console.log('📸 Creating sample scans...')
    const scans = await Promise.all([
      prisma.scan.create({
        data: {
          trolleyId: trolleys[0].trolleyId,
          shelfId: shelves[0].shelfId, // First shelf of first trolley
          imagePath: '/storage/scans/1/1/2025-10-26T10-15-30-123Z_1.jpg',
          scannedBy: users[0].userId,
          status: 'completed',
          metadata: {
            size_kb: 342,
            resolution: '1280x960',
            format: 'jpeg'
          }
        }
      }),
      prisma.scan.create({
        data: {
          trolleyId: trolleys[0].trolleyId,
          shelfId: shelves[1].shelfId, // Second shelf of first trolley
          imagePath: '/storage/scans/1/1/2025-10-26T10-16-45-456Z_2.jpg',
          scannedBy: users[0].userId,
          status: 'completed',
          metadata: {
            size_kb: 298,
            resolution: '1280x960',
            format: 'jpeg'
          }
        }
      })
    ])
    
    console.log(`✅ Created ${scans.length} sample scans`)
    
    // 8. Create Sample Scan Items
    console.log('🔍 Creating sample scan items...')
    const scanItems = await Promise.all([
      prisma.scanItem.create({
        data: {
          scanId: scans[0].scanId,
          productId: products[0].productId, // COK-REG-330
          detectedQuantity: 23,
          confidence: 0.8750,
          notes: null
        }
      }),
      prisma.scanItem.create({
        data: {
          scanId: scans[0].scanId,
          productId: products[3].productId, // WTR-REG-500
          detectedQuantity: 30,
          confidence: 0.9200,
          notes: null
        }
      }),
      prisma.scanItem.create({
        data: {
          scanId: scans[1].scanId,
          productId: products[7].productId, // SNK-PRT-50
          detectedQuantity: 11,
          confidence: 0.7500,
          notes: 'Una unidad parcialmente oculta detrás de las latas'
        }
      })
    ])
    
    console.log(`✅ Created ${scanItems.length} sample scan items`)
    
    // 9. Create Sample Alerts
    console.log('⚠️ Creating sample alerts...')
    const alerts = await Promise.all([
      prisma.alert.create({
        data: {
          scanItemId: scanItems[0].scanItemId,
          alertType: 'quantity_mismatch',
          severity: 'warning',
          message: 'COK-REG-330: esperados 24, detectados 23 (diff: -1)',
          status: 'active'
        }
      }),
      prisma.alert.create({
        data: {
          scanItemId: scanItems[2].scanItemId,
          alertType: 'quantity_mismatch',
          severity: 'warning',
          message: 'SNK-PRT-50: esperados 12, detectados 11 (diff: -1)',
          status: 'active'
        }
      })
    ])
    
    console.log(`✅ Created ${alerts.length} sample alerts`)
    
    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   👥 Users: ${users.length}`)
    console.log(`   📦 Products: ${products.length}`)
    console.log(`   ✈️ Flights: ${flights.length}`)
    console.log(`   🛒 Trolleys: ${trolleys.length}`)
    console.log(`   📚 Shelves: ${shelves.length}`)
    console.log(`   📋 Requirements: ${requirements.length}`)
    console.log(`   📸 Scans: ${scans.length}`)
    console.log(`   🔍 Scan Items: ${scanItems.length}`)
    console.log(`   ⚠️ Alerts: ${alerts.length}`)
    
    console.log('\n🔑 Test Credentials:')
    console.log('   Username: operator01, Password: password123')
    console.log('   Username: admin, Password: password123')
    console.log('   Username: supervisor01, Password: password123')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
