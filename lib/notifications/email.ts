import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@classroomportal.com',
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendMembershipRenewalEmail(
  userEmail: string,
  userName: string,
  studentName: string,
  className: string,
  classesRemaining: number
) {
  const subject = `Class Membership Renewal Reminder - ${className}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Classroom Portal</h1>
          </div>
          <div class="content">
            <h2>Class Membership Renewal Reminder</h2>
            <p>Hello ${userName},</p>
            <div class="alert">
              <strong>⚠️ Action Required:</strong> ${studentName}'s membership for <strong>${className}</strong> is running low.
            </div>
            <p><strong>Classes Remaining:</strong> ${classesRemaining}</p>
            <p>To ensure uninterrupted learning, please renew the class membership soon. Contact your teacher to add more classes to the membership.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent/dashboard" class="button">View Dashboard</a>
            <div class="footer">
              <p>This is an automated reminder from Classroom Portal.</p>
              <p>If you have any questions, please contact your teacher.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to: userEmail, subject, html })
}

export async function sendNewHomeworkEmail(
  userEmail: string,
  userName: string,
  className: string,
  homeworkTitle: string,
  homeworkDescription: string,
  dueDate: string
) {
  const subject = `New Homework Assignment - ${className}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .homework-card { background-color: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Classroom Portal</h1>
          </div>
          <div class="content">
            <h2>New Homework Assignment</h2>
            <p>Hello ${userName},</p>
            <p>A new homework assignment has been posted for <strong>${className}</strong>.</p>
            <div class="homework-card">
              <h3>${homeworkTitle}</h3>
              <p>${homeworkDescription}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent/homework" class="button">View Homework</a>
            <div class="footer">
              <p>This is an automated notification from Classroom Portal.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to: userEmail, subject, html })
}

export async function sendAnnouncementEmail(
  userEmail: string,
  userName: string,
  announcementTitle: string,
  announcementContent: string,
  category: string
) {
  const subject = `New Announcement: ${announcementTitle}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .announcement { background-color: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .badge { display: inline-block; background-color: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Classroom Portal</h1>
          </div>
          <div class="content">
            <h2>New Announcement</h2>
            <p>Hello ${userName},</p>
            <div class="announcement">
              <div><span class="badge">${category.replace('_', ' ').toUpperCase()}</span></div>
              <h3 style="margin-top: 10px;">${announcementTitle}</h3>
              <p style="white-space: pre-wrap;">${announcementContent}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent/announcements" class="button">View All Announcements</a>
            <div class="footer">
              <p>This is an automated notification from Classroom Portal.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to: userEmail, subject, html })
}

