import { PrismaClient, UserRole, AttendanceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface Student {
  id: string
  name: string
  status: string
}

interface Schedule {
  id: string
  className: string
  classTime: string
  day: string
}

interface Package {
  id: string
  studentId: string
  packageSize: number
  amountPaid: number
  purchaseDate: string
  pricePerClass: number
  present: number
  excused: number
  unexcused: number
  holiday: number
  classesUsed: number
  classesRemaining: number
  nextRenewalDate: string
  status: string
  privateLessonsTaken: number
  currentBalance: number
  schedule: Schedule[]
}

interface BackupData {
  students: Student[]
  packages: Package[]
  classes: any[]
}

const DAY_MAP: Record<string, number> = {
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6,
  'Sun': 7,
}

async function main() {
  console.log('🚀 Starting iKids data import...\n')

  // Read backup file
  const backupPath = 'C:\\Users\\dasin\\OneDrive\\Desktop\\BACKUP\\ikidz-tracker-backup-2025-11-13.json'
  const backupData: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))

  console.log(`📊 Found ${backupData.students.length} students`)
  console.log(`📦 Found ${backupData.packages.length} packages\n`)

  // Extract unique classes from schedules
  const classMap = new Map<string, { days: Set<number>; times: Set<string> }>()
  
  backupData.packages.forEach(pkg => {
    pkg.schedule.forEach(sched => {
      if (!classMap.has(sched.className)) {
        classMap.set(sched.className, { days: new Set(), times: new Set() })
      }
      const classInfo = classMap.get(sched.className)!
      classInfo.days.add(DAY_MAP[sched.day] || 0)
      classInfo.times.add(sched.classTime)
    })
  })

  console.log(`📚 Found ${classMap.size} unique classes:`)
  classMap.forEach((info, name) => {
    console.log(`  - ${name}`)
  })
  console.log()

  // Step 1: Create Classes
  console.log('📚 Creating classes...')
  const classIdMap = new Map<string, string>()

  for (const [className, info] of classMap) {
    const daysArray = Array.from(info.days).filter(d => d > 0).sort()
    const timeArray = Array.from(info.times)
    const dayNames = daysArray.map(d => Object.keys(DAY_MAP).find(k => DAY_MAP[k] === d)).filter(Boolean)
    
    const scheduleText = `${dayNames.join(' & ')} ${timeArray[0]}`
    
    const classRecord = await prisma.class.upsert({
      where: { id: `ikids-${className.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `ikids-${className.toLowerCase().replace(/\s+/g, '-')}`,
        name: className,
        description: `iKids ${className} Class`,
        schedule: scheduleText,
        daysOfWeek: daysArray,
        startTime: timeArray[0],
      },
    })
    
    classIdMap.set(className, classRecord.id)
    console.log(`  ✓ Created class: ${className} (${scheduleText})`)
  }
  console.log()

  // Step 2: Create Parent Accounts and Students
  console.log('👨‍👩‍👧 Creating parent accounts and students...')
  const studentIdMap = new Map<string, string>()
  const parentCredentials: Array<{ student: string; email: string; password: string }> = []

  for (const student of backupData.students) {
    const studentNameLower = student.name.toLowerCase()
    const parentEmail = `${studentNameLower}@parent.ikids.com`
    const tempPassword = `ikids${Math.floor(Math.random() * 10000)}`
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create parent
    const parent = await prisma.user.upsert({
      where: { email: parentEmail },
      update: {},
      create: {
        email: parentEmail,
        name: `${student.name}'s Parent`,
        password: hashedPassword,
        role: UserRole.PARENT,
      },
    })

    // Create student
    const studentRecord = await prisma.student.upsert({
      where: { id: `ikids-${student.id}` },
      update: {},
      create: {
        id: `ikids-${student.id}`,
        name: student.name,
        parentId: parent.id,
      },
    })

    studentIdMap.set(student.id, studentRecord.id)
    parentCredentials.push({
      student: student.name,
      email: parentEmail,
      password: tempPassword,
    })

    console.log(`  ✓ Created: ${student.name} → Parent: ${parentEmail}`)
  }
  console.log()

  // Step 3: Import Packages as Enrollments
  console.log('📦 Creating enrollments from packages...')
  
  for (const pkg of backupData.packages) {
    const studentDbId = studentIdMap.get(pkg.studentId)
    if (!studentDbId) {
      console.log(`  ⚠️  Skipping package - student not found: ${pkg.studentId}`)
      continue
    }

    // Get primary class from schedule
    const primaryClass = pkg.schedule[0]
    if (!primaryClass) continue

    const classId = classIdMap.get(primaryClass.className)
    if (!classId) {
      console.log(`  ⚠️  Skipping package - class not found: ${primaryClass.className}`)
      continue
    }

    // Calculate classes per week
    const classesPerWeek = pkg.schedule.length

    // Create or update enrollment (some students have multiple packages)
    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_classId: {
          studentId: studentDbId,
          classId: classId,
        },
      },
      update: {
        // If exists, add to existing totals
        totalClasses: { increment: pkg.packageSize },
        classesRemaining: { increment: pkg.classesRemaining },
        renewalDate: pkg.nextRenewalDate ? new Date(pkg.nextRenewalDate) : undefined,
      },
      create: {
        studentId: studentDbId,
        classId: classId,
        totalClasses: pkg.packageSize,
        classesRemaining: pkg.classesRemaining,
        classesPerWeek: classesPerWeek,
        startDate: new Date(pkg.purchaseDate),
        renewalDate: pkg.nextRenewalDate ? new Date(pkg.nextRenewalDate) : null,
        isActive: pkg.status === 'Active',
      },
    })

    console.log(`  ✓ ${backupData.students.find(s => s.id === pkg.studentId)?.name}: ${primaryClass.className} - ${pkg.classesRemaining}/${pkg.packageSize} classes`)

    // Step 4: Import Attendance History
    const totalAttendance = pkg.present + pkg.excused + pkg.unexcused + pkg.holiday
    
    if (totalAttendance > 0) {
      const startDate = new Date(pkg.purchaseDate)
      let dateCounter = new Date(startDate)
      let attendanceCreated = 0

      // Create attendance records
      const attendanceToCreate: any[] = []

      // Present records
      for (let i = 0; i < pkg.present; i++) {
        attendanceToCreate.push({
          status: AttendanceStatus.PRESENT,
          date: new Date(dateCounter),
        })
        dateCounter = getNextClassDate(dateCounter, pkg.schedule)
        attendanceCreated++
      }

      // Excused absences
      for (let i = 0; i < pkg.excused; i++) {
        attendanceToCreate.push({
          status: AttendanceStatus.ABSENT_EXCUSED,
          date: new Date(dateCounter),
        })
        dateCounter = getNextClassDate(dateCounter, pkg.schedule)
        attendanceCreated++
      }

      // Unexcused absences
      for (let i = 0; i < pkg.unexcused; i++) {
        attendanceToCreate.push({
          status: AttendanceStatus.ABSENT_UNEXCUSED,
          date: new Date(dateCounter),
        })
        dateCounter = getNextClassDate(dateCounter, pkg.schedule)
        attendanceCreated++
      }

      // Holidays
      for (let i = 0; i < pkg.holiday; i++) {
        attendanceToCreate.push({
          status: AttendanceStatus.HOLIDAY,
          date: new Date(dateCounter),
        })
        dateCounter = getNextClassDate(dateCounter, pkg.schedule)
        attendanceCreated++
      }

      // Create all attendance records
      for (const att of attendanceToCreate) {
        try {
          await prisma.attendance.create({
            data: {
              enrollmentId: enrollment.id,
              classId: classId,
              studentId: studentDbId,
              date: att.date,
              status: att.status,
              markedBy: 'system-import',
            },
          })
        } catch (error) {
          // Skip if duplicate
        }
      }

      console.log(`    → Imported ${attendanceCreated} attendance records`)
    }
  }

  console.log()
  console.log('✅ Import complete!\n')

  // Save parent credentials
  const credentialsPath = path.join(process.cwd(), 'PARENT_CREDENTIALS.md')
  let credentialsMd = '# iKids Parent Login Credentials\n\n'
  credentialsMd += 'Generated on: ' + new Date().toLocaleString() + '\n\n'
  credentialsMd += '**Important:** Share these credentials with parents and have them change their passwords after first login.\n\n'
  credentialsMd += '## Parent Accounts\n\n'
  
  parentCredentials.forEach(cred => {
    credentialsMd += `### ${cred.student}\n`
    credentialsMd += `- **Email:** ${cred.email}\n`
    credentialsMd += `- **Password:** ${cred.password}\n\n`
  })

  fs.writeFileSync(credentialsPath, credentialsMd)
  console.log(`📝 Parent credentials saved to: PARENT_CREDENTIALS.md\n`)

  console.log('📊 Import Summary:')
  console.log(`  - Students: ${backupData.students.length}`)
  console.log(`  - Classes: ${classMap.size}`)
  console.log(`  - Parent accounts: ${parentCredentials.length}`)
  console.log(`  - Packages/Enrollments: ${backupData.packages.length}`)
  console.log()
  console.log('🎉 All real iKids data has been imported!')
}

function getNextClassDate(currentDate: Date, schedule: Schedule[]): Date {
  const nextDate = new Date(currentDate)
  const scheduleDays = schedule.map(s => DAY_MAP[s.day]).filter(Boolean)
  
  // Find next class day
  for (let i = 1; i <= 7; i++) {
    nextDate.setDate(nextDate.getDate() + 1)
    const dayOfWeek = nextDate.getDay() === 0 ? 7 : nextDate.getDay()
    
    if (scheduleDays.includes(dayOfWeek)) {
      return nextDate
    }
  }
  
  return nextDate
}

main()
  .catch((e) => {
    console.error('❌ Error importing data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

