import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up demo data...\n')

  // Delete demo student "Student Demo"
  const demoStudent = await prisma.student.findFirst({
    where: { name: 'Student Demo' },
  })

  if (demoStudent) {
    await prisma.student.delete({
      where: { id: demoStudent.id },
    })
    console.log('✓ Deleted demo student')
  }

  // Delete demo parent account
  const demoParent = await prisma.user.findFirst({
    where: { email: 'parent@example.com' },
  })

  if (demoParent) {
    await prisma.user.delete({
      where: { id: demoParent.id },
    })
    console.log('✓ Deleted demo parent account')
  }

  // Delete demo classes
  const demoClasses = await prisma.class.findMany({
    where: {
      OR: [
        { name: 'Mathematics 101' },
        { name: 'Science 101' },
      ],
    },
  })

  for (const cls of demoClasses) {
    await prisma.class.delete({
      where: { id: cls.id },
    })
    console.log(`✓ Deleted demo class: ${cls.name}`)
  }

  console.log('\n✅ Demo data cleanup complete!')
  console.log('\n📊 Current database:')
  
  const studentCount = await prisma.student.count()
  const parentCount = await prisma.user.count({ where: { role: 'PARENT' } })
  const classCount = await prisma.class.count()
  const enrollmentCount = await prisma.enrollment.count()

  console.log(`  - Students: ${studentCount}`)
  console.log(`  - Parents: ${parentCount}`)
  console.log(`  - Classes: ${classCount}`)
  console.log(`  - Enrollments: ${enrollmentCount}`)
}

main()
  .catch((e) => {
    console.error('Error cleaning up:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


