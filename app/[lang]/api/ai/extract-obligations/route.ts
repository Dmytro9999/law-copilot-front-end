import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBkZ8QVHjGgvQxKzVoE3mF2nL1pR4sT6uY",
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractText, contractName, clientName, fileName } = body

    console.log("Received analysis request:", { contractName, clientName, fileName })

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
אתה עורך דין מומחה בניתוח חוזים. נתח את החוזה הבא והחזר תשובה בפורמט JSON בלבד, ללא markdown או טקסט נוסף.

שם החוזה: ${contractName || "לא צוין"}
שם הלקוח: ${clientName || "לא צוין"}
תוכן החוזה: ${contractText}

החזר JSON במבנה הבא בדיוק:
{
  "contractType": "סוג החוזה",
  "riskLevel": "גבוה/בינוני/נמוך",
  "summary": "סיכום החוזה בעברית",
  "parties": [
    {
      "name": "שם הצד",
      "idNumber": "מספר זהות או ח.פ",
      "role": "תפקיד בחוזה",
      "email": "כתובת מייל",
      "phone": "טלפון"
    }
  ],
  "obligations": [
    {
      "description": "תיאור ההתחייבות",
      "responsibleParty": "הצד האחראי",
      "dueDate": "YYYY-MM-DD",
      "priority": "גבוהה/בינונית/נמוכה",
      "category": "קטגוריה",
      "requiresProof": true/false,
      "amount": "סכום או null"
    }
  ],
  "criticalDates": ["תאריכים חשובים"],
  "riskFactors": ["סיכונים שזוהו"],
  "keyTerms": [
    {
      "term": "מונח מרכזי",
      "description": "הסבר",
      "importance": "high/medium/low"
    }
  ],
  "recommendations": ["המלצות לשיפור"]
}

חשוב: החזר רק JSON תקין, ללא \`\`\`json או טקסט נוסף.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    console.log("Raw Gemini response:", text)

    // Clean the response - remove markdown formatting and extra text
    text = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()

    // Find JSON content between first { and last }
    const firstBrace = text.indexOf("{")
    const lastBrace = text.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1)
    }

    console.log("Cleaned response:", text)

    let analysis
    try {
      analysis = JSON.parse(text)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Failed to parse text:", text)

      // Provide fallback analysis
      analysis = {
        contractType: "חוזה כללי",
        riskLevel: "בינוני",
        summary: `ניתוח בסיסי של חוזה "${contractName || "ללא שם"}" עבור לקוח "${clientName || "לא צוין"}". נדרש ניתוח ידני מפורט נוסף.`,
        parties: [
          {
            name: clientName || "לקוח",
            idNumber: "",
            role: "צד לחוזה",
            email: "",
            phone: "",
          },
        ],
        obligations: [
          {
            description: "בדיקת החוזה ומעקב אחר ביצועו",
            responsibleParty: "עורך הדין",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            priority: "בינונית",
            category: "בדיקה",
            requiresProof: false,
            amount: null,
          },
        ],
        criticalDates: ["נדרש מעקב נוסף"],
        riskFactors: ["יש לבדוק את החוזה בפירוט"],
        keyTerms: [
          {
            term: "בדיקה נוספת נדרשת",
            description: "החוזה דורש בדיקה ידנית מפורטת",
            importance: "high",
          },
        ],
        recommendations: ["מומלץ לבדוק את החוזה עם עורך דין מנוסה", "יש לנסות שוב את הניתוח האוטומטי"],
      }
    }

    // Validate and ensure all required fields exist
    const validatedAnalysis = {
      contractType: analysis.contractType || "חוזה כללי",
      riskLevel: analysis.riskLevel || "בינוני",
      summary: analysis.summary || "ניתוח החוזה הושלם",
      parties: Array.isArray(analysis.parties) ? analysis.parties : [],
      obligations: Array.isArray(analysis.obligations) ? analysis.obligations : [],
      criticalDates: Array.isArray(analysis.criticalDates) ? analysis.criticalDates : [],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      keyTerms: Array.isArray(analysis.keyTerms) ? analysis.keyTerms : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    }

    console.log("Final validated analysis:", validatedAnalysis)

    return NextResponse.json({
      success: true,
      analysis: validatedAnalysis,
    })
  } catch (error) {
    console.error("Error in extract-obligations API:", error)

    return NextResponse.json(
      {
        success: false,
        error: "שגיאה בניתוח החוזה",
        analysis: {
          contractType: "חוזה כללי",
          riskLevel: "בינוני",
          summary: "אירעה שגיאה בניתוח. נדרש ניתוח ידני.",
          parties: [],
          obligations: [],
          criticalDates: [],
          riskFactors: ["נדרש ניתוח ידני"],
          keyTerms: [],
          recommendations: ["נסה שוב או פנה לעורך דין"],
        },
      },
      { status: 200 },
    ) // Return 200 even on error to provide fallback
  }
}
