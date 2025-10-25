const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    console.log('✅ Database connected successfully!')
    console.log('📅 Server time:', result[0].current_time)
    
    // Test table existence
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    console.log('📊 Available tables:')
    tables.forEach((table) => {
      console.log(`   - ${table.table_name}`)
    })
    
    // Test user table
    const userCount = await prisma.user.count()
    console.log(`👥 Users in database: ${userCount}`)
    
    // Test product table
    const productCount = await prisma.product.count()
    console.log(`📦 Products in database: ${productCount}`)
    
    // Test with new field names
    const sampleUser = await prisma.user.findFirst()
    if (sampleUser) {
      console.log(`🔍 Sample user ID: ${sampleUser.userId}`)
    }
    
    const sampleProduct = await prisma.product.findFirst()
    if (sampleProduct) {
      console.log(`🔍 Sample product ID: ${sampleProduct.productId}`)
    }
    
    console.log('🎉 Database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
