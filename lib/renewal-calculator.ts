/**
 * Calculate renewal date based on classes remaining and schedule
 */

export function calculateRenewalDate(
  classesRemaining: number,
  classesPerWeek: number,
  startDate: Date = new Date()
): Date | null {
  if (classesRemaining <= 0 || classesPerWeek <= 0) {
    return null
  }

  const weeksNeeded = Math.ceil(classesRemaining / classesPerWeek)
  const daysNeeded = weeksNeeded * 7

  const renewalDate = new Date(startDate)
  renewalDate.setDate(renewalDate.getDate() + daysNeeded)

  return renewalDate
}

/**
 * Get days until renewal
 */
export function getDaysUntilRenewal(renewalDate: Date | null): number | null {
  if (!renewalDate) return null

  const now = new Date()
  const diff = renewalDate.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  return days
}

/**
 * Check if renewal is urgent (within 7 days or classes <= 2)
 */
export function isRenewalUrgent(
  classesRemaining: number,
  renewalDate: Date | null
): boolean {
  if (classesRemaining <= 2) return true
  
  const daysUntil = getDaysUntilRenewal(renewalDate)
  if (daysUntil !== null && daysUntil <= 7) return true

  return false
}

/**
 * Format renewal date message
 */
export function formatRenewalMessage(
  classesRemaining: number,
  renewalDate: Date | null
): string {
  if (classesRemaining <= 0) {
    return "⚠️ No classes remaining - Please renew now!"
  }

  if (classesRemaining <= 2) {
    return `⚠️ Only ${classesRemaining} class${classesRemaining === 1 ? '' : 'es'} left - Renewal needed soon!`
  }

  if (renewalDate) {
    const daysUntil = getDaysUntilRenewal(renewalDate)
    if (daysUntil !== null) {
      if (daysUntil <= 7) {
        return `⚠️ ${classesRemaining} classes left - Renew by ${renewalDate.toLocaleDateString()}`
      }
      return `✅ ${classesRemaining} classes remaining - Renewal due ${renewalDate.toLocaleDateString()}`
    }
  }

  return `✅ ${classesRemaining} classes remaining`
}


