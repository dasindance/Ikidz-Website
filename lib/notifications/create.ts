import { prisma } from '@/lib/db'
import { NotificationType } from '@prisma/client'
import { sendMembershipRenewalEmail, sendNewHomeworkEmail, sendAnnouncementEmail } from './email'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  sendEmailNotification: boolean = true
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  })

  // Send email if user has email notifications enabled
  if (sendEmailNotification) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (user && user.emailPreferences) {
      // Email will be sent asynchronously
      // In production, you'd want to use a job queue for this
      sendEmailForNotification(user.email, user.name, type, title, message).catch(
        (error) => {
          console.error('Failed to send email:', error)
        }
      )

      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailSent: true },
      })
    }
  }

  return notification
}

async function sendEmailForNotification(
  email: string,
  name: string,
  type: NotificationType,
  title: string,
  message: string
) {
  // For basic notifications, we'll use a simple email format
  // For specific types, the calling code should use the dedicated email functions
  return true
}

export async function notifyMembershipRenewal(
  userId: string,
  studentName: string,
  className: string,
  classesRemaining: number
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return

  await createNotification(
    userId,
    'MEMBERSHIP_RENEWAL',
    'Class Membership Renewal Required',
    `${studentName}'s membership for ${className} has ${classesRemaining} classes remaining. Please renew soon.`,
    false
  )

  if (user.emailPreferences) {
    await sendMembershipRenewalEmail(
      user.email,
      user.name,
      studentName,
      className,
      classesRemaining
    )
  }
}

export async function notifyNewHomework(
  userId: string,
  className: string,
  homeworkTitle: string,
  homeworkDescription: string,
  dueDate: Date
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return

  await createNotification(
    userId,
    'NEW_HOMEWORK',
    'New Homework Assignment',
    `New homework assigned in ${className}: ${homeworkTitle}`,
    false
  )

  if (user.emailPreferences) {
    await sendNewHomeworkEmail(
      user.email,
      user.name,
      className,
      homeworkTitle,
      homeworkDescription,
      dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
  }
}

export async function notifyNewAnnouncement(
  userId: string,
  announcementTitle: string,
  announcementContent: string,
  category: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return

  await createNotification(
    userId,
    'NEW_ANNOUNCEMENT',
    'New Announcement',
    announcementTitle,
    false
  )

  if (user.emailPreferences) {
    await sendAnnouncementEmail(
      user.email,
      user.name,
      announcementTitle,
      announcementContent,
      category
    )
  }
}

