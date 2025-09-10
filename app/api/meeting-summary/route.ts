import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBkZ8QVHjGgvQxKzVoE3mF2nL1pR4sT6uY",
)

export async function POST(request: NextRequest) {
  try {
    const { meetingNotes, contractContext } = await request.json()

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
אתה עורך דין מומחה. נתח את רשימות הפגישה הבאות וצור סיכום מקצועי.

הקשר החוזה: ${contractContext}
רשימות הפגישה: ${meetingNotes}

החזר JSON בפורמט הבא בדיוק, ללא markdown:
{
  "summary": "סיכום כללי של הפגישה",
  "mainTopics": ["נושא 1", "נושא 2"],
  "decisions": ["החלטה 1", "החלטה 2"],
  "actionItems": [
    {
      "description": "תיאור הפעולה",
      "responsibleParty": "אחראי",
      "dueDate": "YYYY-MM-DD",
      "priority": "גבוהה/בינונית/נמוכה",
      "category": "קטגוריה",
      "requiresProof": true/false,
      "amount": "סכום או null"
    }
  ],
  "legalRisks": ["סיכון 1", "סיכון 2"],
  "recommendations": ["המלצה 1", "המלצה 2"]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    // Clean response
    text = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()

    const firstBrace = text.indexOf("{")
    const lastBrace = text.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1)
    }

    let aiSummary
    try {
      aiSummary = JSON.parse(text)
    } catch (error) {
      // Fallback summary
      aiSummary = {
        summary: "סיכום פגישה - נדרש עיבוד ידני נוסף",
        mainTopics: ["נושאים כלליים"],
        decisions: ["החלטות נדרשות"],
        actionItems: [
          {
            description: "מעקב אחר נושאי הפגישה",
            responsibleParty: "עורך הדין",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            priority: "בינונית",
            category: "מעקב",
            requiresProof: false,
            amount: null,
          },
        ],
        legalRisks: ["נדרש ניתוח נוסף"],
        recommendations: ["יש לעקוב אחר ההחלטות"],
      }
    }

    return NextResponse.json({
      success: true,
      aiSummary,
    })
  } catch (error) {
    console.error("Error in meeting summary:", error)
    return NextResponse.json({ error: "שגיאה ביצירת סיכום הפגישה" }, { status: 500 })
  }
}
