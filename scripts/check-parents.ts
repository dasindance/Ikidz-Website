import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking parent accounts...\n')

  // Get all parent accounts
  const parents = await prisma.user.findMany({
    where: { role: 'PARENT' },
    include: {
      students: true,
    },
  })

  console.log(`Found ${parents.length} parent accounts:\n`)

  // Check first 5
  for (const parent of parents.slice(0, 5)) {
    console.log(`${parent.name}:`)
    console.log(`  Email: ${parent.email}`)
    console.log(`  Students: ${parent.students.map(s => s.name).join(', ')}`)
    
    // Test password verification
    const testPassword = parent.email.split('@')[0].replace('parent.ikids.com', '')
    console.log(`  Password field exists: ${!!parent.password}`)
    console.log(`  Password hash length: ${parent.password.length}`)
    console.log()
  }

  // Fix passwords for testing - reset a few to simple passwords
  console.log('🔧 Resetting passwords for easy testing...\n')

  const testAccounts = [
    { email: 'joy@parent.ikids.com', password: 'joy123', name: 'Joy' },
    { email: 'tiger@parent.ikids.com', password: 'tiger123', name: 'Tiger (URGENT)' },
    { email: 'hardy@parent.ikids.com', password: 'hardy123', name: 'Hardy (1v1)' },
    { email: 'maysei@parent.ikids.com', password: 'maysei123', name: 'Maysei' },
    { email: 'cavan@parent.ikids.com', password: 'cavan123', name: 'Cavan' },
  ]

  for (const account of testAccounts) {
    const hashedPassword = await bcrypt.hash(account.password, 10)
    await prisma.user.update({
      where: { email: account.email },
      data: { password: hashedPassword },
    })
    console.log(`✓ Reset ${account.name}: ${account.email} / ${account.password}`)
  }

  console.log('\n✅ Password reset complete!')
  console.log('\n📝 Test these accounts:')
  testAccounts.forEach(acc => {
    console.log(`  ${acc.email} / ${acc.password}`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


