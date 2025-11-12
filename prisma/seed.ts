import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create a teacher account
  const hashedPassword = await bcrypt.hash('teacher123', 10)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      name: 'Teacher Demo',
      password: hashedPassword,
      role: UserRole.TEACHER,
    },
  })

  console.log('✓ Created teacher account:', teacher.email)

  // Create a parent account
  const parentPassword = await bcrypt.hash('parent123', 10)
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      name: 'Parent Demo',
      password: parentPassword,
      role: UserRole.PARENT,
    },
  })

  console.log('✓ Created parent account:', parent.email)

  // Create a student
  const student = await prisma.student.upsert({
    where: { id: 'demo-student' },
    update: {},
    create: {
      id: 'demo-student',
      name: 'Student Demo',
      parentId: parent.id,
    },
  })

  console.log('✓ Created student:', student.name)

  // Create classes
  const mathClass = await prisma.class.upsert({
    where: { id: 'math-101' },
    update: {},
    create: {
      id: 'math-101',
      name: 'Mathematics 101',
      description: 'Introduction to algebra and geometry',
      schedule: 'Monday & Wednesday 3:00 PM - 4:30 PM',
    },
  })

  const scienceClass = await prisma.class.upsert({
    where: { id: 'science-101' },
    update: {},
    create: {
      id: 'science-101',
      name: 'Science 101',
      description: 'Physical and life sciences',
      schedule: 'Tuesday & Thursday 3:00 PM - 4:30 PM',
    },
  })

  console.log('✓ Created classes:', mathClass.name, scienceClass.name)

  // Enroll student
  const enrollment = await prisma.enrollment.upsert({
    where: { 
      studentId_classId: { 
        studentId: student.id, 
        classId: mathClass.id 
      } 
    },
    update: {},
    create: {
      studentId: student.id,
      classId: mathClass.id,
      classesRemaining: 8,
      totalClasses: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  })

  console.log('✓ Created enrollment')

  // Create sample lessons
  const lesson1 = await prisma.lesson.create({
    data: {
      classId: mathClass.id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      unit: 'Unit 1: Algebra Basics',
      topics: ['Variables', 'Linear Equations', 'Graphing'],
      notes: 'Students showed good understanding of variables',
    },
  })

  const lesson2 = await prisma.lesson.create({
    data: {
      classId: mathClass.id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      unit: 'Unit 1: Algebra Basics',
      topics: ['Solving Equations', 'Word Problems'],
      notes: 'Practice more word problems at home',
    },
  })

  console.log('✓ Created sample lessons')

  // Create sample homework
  const homework = await prisma.homeworkAssignment.create({
    data: {
      classId: mathClass.id,
      title: 'Algebra Practice Worksheet',
      description: 'Complete problems 1-20 on page 45. Show all work.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
    },
  })

  console.log('✓ Created sample homework')

  // Create sample announcement
  const announcement = await prisma.announcement.create({
    data: {
      title: 'Welcome to Classroom Portal!',
      content: 'This is your new parent portal where you can track homework, view lessons, and stay updated on class activities.',
      category: 'general',
      priority: 'high',
    },
  })

  console.log('✓ Created sample announcement')

  // Create upcoming holiday
  const holiday = await prisma.holiday.create({
    data: {
      name: 'Thanksgiving Break',
      date: new Date('2025-11-27'),
      description: 'No classes during Thanksgiving week',
    },
  })

  console.log('✓ Created holiday')

  console.log('\n✅ Database seeded successfully!')
  console.log('\nDemo Accounts:')
  console.log('Teacher: teacher@example.com / teacher123')
  console.log('Parent: parent@example.com / parent123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

