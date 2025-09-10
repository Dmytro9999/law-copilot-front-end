// מערכת התראות מתקדמת עם n8n webhooks ו-Magic Links
export interface NotificationData {
  clientName: string
  obligationDescription?: string
  dueDate?: string
  portalLink?: string
  lawyerName: string
  contractName?: string
  amount?: string
}

export interface ReminderSchedule {
  obligationId: number
  contractId: number
  clientEmail: string
  reminderDates: string[]
  notificationType: "email" | "whatsapp" | "both"
}

// יצירת Magic Link ללקוח לפורטל LAWCOPILOT
export function generateMagicLink(clientEmail: string, contractId: number): string {
  // In a real implementation, generate a secure token
  const token = btoa(`${clientEmail}:${contractId}:${Date.now()}`)
  return `https://lawcopilot.app/client-portal/${token}`
}

// שליחת התראה דרך n8n webhook
export async function sendNotificationViaWebhook(
  obligationId: number,
  type: "reminder" | "overdue" | "clientReminder",
  recipient: string,
  data: any,
) {
  try {
    console.log("Sending notification:", { obligationId, type, recipient, data })

    // Mock webhook call
    // In a real implementation:
    // const response = await fetch(process.env.NOTIFICATION_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ obligationId, type, recipient, data })
    // })

    return { success: true }
  } catch (error) {
    console.error("Error sending notification:", error)
    throw error
  }
}

// תזמון תזכורות אוטומטיות דרך n8n
export async function scheduleRemindersViaWebhook(obligation: any, contract: any) {
  try {
    console.log("Scheduling reminders:", { obligation, contract })

    // Mock scheduling
    // In a real implementation:
    // const response = await fetch(process.env.SCHEDULER_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ obligation, contract })
    // })

    return { success: true }
  } catch (error) {
    console.error("Error scheduling reminders:", error)
    throw error
  }
}

// שליחת התראת איחור דחופה
export async function sendOverdueAlert(obligation: any, contract: any, daysOverdue: number): Promise<void> {
  try {
    const magicLink = generateMagicLink(contract.client_email, contract.id)

    await sendNotificationViaWebhook(obligation.id, "overdue", contract.client_email, {
      clientName: contract.client_name,
      obligationDescription: obligation.description,
      dueDate: obligation.due_date,
      portalLink: magicLink,
      lawyerName: 'עו"ד דוד כהן',
      contractName: contract.name,
      amount: obligation.amount,
    })

    // שליחת התראה גם לעורך הדין
    await sendNotificationViaWebhook(obligation.id, "reminder", "david.cohen@lawfirm.co.il", {
      clientName: contract.client_name,
      obligationDescription: obligation.description,
      dueDate: obligation.due_date,
      lawyerName: 'עו"ד דוד כהן',
      contractName: contract.name,
      amount: obligation.amount,
    })

    console.log(`Overdue alert sent for obligation ${obligation.id} (${daysOverdue} days overdue)`)
  } catch (error) {
    console.error("Error sending overdue alert:", error)
    throw error
  }
}

// יצירת דוח התראות יומי
export async function generateDailyNotificationReport(): Promise<any> {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://lawai.app.n8n.cloud/webhook/contractlaw"

    const payload = {
      action: "daily_report",
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      source: "LAWCOPILOT",
      aiProvider: "Google Gemini",
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    const report = await response.json()
    console.log("Daily notification report generated")
    return report
  } catch (error) {
    console.error("Error generating daily report:", error)
    throw error
  }
}

// פונקציה לבדיקת סטטוס התראות
export async function checkNotificationStatus(obligationId: number): Promise<any> {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://lawai.app.n8n.cloud/webhook/contractlaw"

    const payload = {
      action: "check_notification_status",
      obligationId,
      timestamp: new Date().toISOString(),
      source: "LAWCOPILOT",
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error checking notification status:", error)
    throw error
  }
}
