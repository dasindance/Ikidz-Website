import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying iKids data import...\n')

  // Check students
  const students = await prisma.student.findMany({
    include: {
      parent: true,
      enrollments: {
        include: {
          class: true,
        },
      },
    },
  })

  console.log(`✅ Students: ${students.length}`)
  console.log('\n📋 Sample Students:')
  students.slice(0, 5).forEach(s => {
    console.log(`  - ${s.name}`)
    console.log(`    Parent: ${s.parent.email}`)
    s.enrollments.forEach(e => {
      console.log(`    Class: ${e.class.name} - ${e.classesRemaining}/${e.totalClasses} classes`)
    })
  })

  // Check classes
  const classes = await prisma.class.findMany({
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  })

  console.log(`\n✅ Classes: ${classes.length}`)
  classes.forEach(c => {
    console.log(`  - ${c.name}: ${c._count.enrollments} students (${c.schedule})`)
  })

  // Check enrollments with urgent renewals
  const urgentRenewals = await prisma.enrollment.findMany({
    where: {
      classesRemaining: {
        lte: 2,
      },
      isActive: true,
    },
    include: {
      student: true,
      class: true,
    },
  })

  console.log(`\n⚠️  Urgent Renewals: ${urgentRenewals.length}`)
  urgentRenewals.forEach(e => {
    console.log(`  - ${e.student.name} (${e.class.name}): ${e.classesRemaining} classes left`)
  })

  // Check attendance
  const totalAttendance = await prisma.attendance.count()
  console.log(`\n✅ Attendance Records: ${totalAttendance}`)

  // Check by status
  const present = await prisma.attendance.count({ where: { status: 'PRESENT' } })
  const excused = await prisma.attendance.count({ where: { status: 'ABSENT_EXCUSED' } })
  const unexcused = await prisma.attendance.count({ where: { status: 'ABSENT_UNEXCUSED' } })
  const holiday = await prisma.attendance.count({ where: { status: 'HOLIDAY' } })

  console.log(`  - Present: ${present}`)
  console.log(`  - Excused: ${excused}`)
  console.log(`  - Unexcused: ${unexcused}`)
  console.log(`  - Holiday: ${holiday}`)

  console.log('\n✅ All data verified successfully!')
}

main()
  .catch((e) => {
    console.error('Error verifying data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


