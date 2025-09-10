import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBkZ8QVHjGgvQxKzVoE3mF2nL1pR4sT6uY",
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractText, fileName } = body

    console.log("Received contract analysis request:", { fileName, textLength: contractText?.length })

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
אתה עורך דין מומחה בניתוח חוזים. נתח את החוזה הבא בפירוט מלא והחזר תשובה בפורמט JSON בלבד.

תוכן החוזה:
${contractText}

החזר JSON במבנה הבא בדיוק:
{
  "contractName": "שם החוזה המלא כפי שמופיע בחוזה",
  "partyA": {
    "name": "שם צד א",
    "idNumber": "מספר זהות או ח.פ",
    "address": "כתובת",
    "role": "תפקיד בחוזה"
  },
  "partyB": {
    "name": "שם צד ב", 
    "idNumber": "מספר זהות או ח.פ",
    "address": "כתובת",
    "role": "תפקיד בחוזה"
  },
  "contractType": "סוג החוזה (שירותים/אספקה/נדלן/עבודה/אחר)",
  "startDate": "תאריך התחלה בפורמט YYYY-MM-DD",
  "endDate": "תאריך סיום בפורמט YYYY-MM-DD או null אם אין",
  "value": "ערך החוזה בשקלים או null אם לא צוין",
  "description": "תיאור קצר של החוזה (2-3 משפטים)",
  "obligations": [
    {
      "id": "מזהה ייחודי",
      "description": "תיאור מפורט של ההתחייבות",
      "responsibleParty": "מי אחראי (צד א/צד ב/שם ספציפי)",
      "dueDate": "תאריך יעד בפורמט YYYY-MM-DD או null",
      "priority": "גבוהה/בינונית/נמוכה",
      "category": "קטגוריה (תשלום/מסירה/דיווח/אחר)",
      "requiresProof": true/false,
      "amount": "סכום אם רלוונטי או null",
      "sourceText": "הטקסט המדויק מהחוזה שממנו נגזרה ההתחייבות",
      "type": "positive/negative/financial/operational/legal"
    }
  ],
  "keyTerms": [
    {
      "term": "מונח חשוב",
      "definition": "הגדרה או הסבר",
      "importance": "high/medium/low"
    }
  ],
  "riskFactors": [
    "סיכון 1",
    "סיכון 2"
  ],
  "recommendations": [
    "המלצה 1",
    "המלצה 2"
  ]
}

חשוב מאוד:
1. חלץ את המידע בדיוק מהטקסט
2. אם מידע לא קיים, השתמש ב-null או מחרוזת ריקה
3. זהה את כל ההתחייבויות החשובות מהטקסט
4. החזר רק JSON תקין, بدون markdown או טקסט נוסף
5. שים לב לתאריכים עבריים ולוח עברי
6. זהה סכומים בכל הפורמטים (₪, שקל, NIS, דולר, $)
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    console.log("[v0] Raw Gemini response length:", text.length)
    console.log("[v0] First 500 chars:", text.substring(0, 500))

    // Remove markdown code blocks more precisely
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()

    // Find JSON content between first { and last }
    const firstBrace = text.indexOf("{")
    const lastBrace = text.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1)
    }

    text = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/\r\n/g, " ") // Replace CRLF with space
      .replace(/\n/g, " ") // Replace newlines with spaces
      .replace(/\r/g, "") // Remove remaining carriage returns
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      .trim()

    let analysis
    try {
      // First attempt - parse as-is
      analysis = JSON.parse(text)
      console.log("[v0] Successfully parsed JSON on first attempt")
    } catch (firstParseError) {
      console.log("[v0] First parse failed, attempting repairs...")

      try {
        let repairedText = text
          // Fix Hebrew quotes that are clearly not part of JSON structure
          .replace(/״/g, '\\"') // Hebrew double quote
          .replace(/׳/g, "\\'") // Hebrew single quote

        // Try to fix truncated JSON by adding missing closing braces
        if (!repairedText.endsWith("}")) {
          const openBraces = (repairedText.match(/\{/g) || []).length
          const closeBraces = (repairedText.match(/\}/g) || []).length
          const missingBraces = openBraces - closeBraces

          if (missingBraces > 0) {
            repairedText += "}".repeat(missingBraces)
          }
        }

        analysis = JSON.parse(repairedText)
        console.log("[v0] Successfully parsed JSON after repairs")
      } catch (secondParseError) {
        console.error("[v0] JSON parse error:", secondParseError)
        console.error("[v0] Failed to parse text:", text.substring(0, 200) + "...")
        console.error("[v0] Error at position:", secondParseError.message)

        analysis = {
          contractName: `חוזה מקובץ ${fileName} - נדרש ניתוח ידני`,
          partyA: {
            name: "צד א",
            idNumber: "",
            address: "",
            role: "צד לחוזה",
          },
          partyB: {
            name: "צד ב",
            idNumber: "",
            address: "",
            role: "צד לחוזה",
          },
          contractType: "כללי",
          startDate: null,
          endDate: null,
          value: null,
          description: "הניתוח האוטומטי נכשל - נדרש ניתוח ידני מפורט של החוזה",
          obligations: [
            {
              id: "manual-review-1",
              description: "בדיקה ידנית מפורטת של החוזה ומיפוי התחייבויות",
              responsibleParty: "עורך הדין",
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              priority: "גבוהה",
              category: "בדיקה",
              requiresProof: false,
              amount: null,
              sourceText: "נוצר אוטומטית עקב כשל בניתוח",
              type: "operational",
            },
          ],
          keyTerms: [],
          riskFactors: ["נדרש ניתוח ידני מפורט עקב כשל בניתוח האוטומטי"],
          recommendations: ["יש לבדוק את החוזה באופן ידני עם עורך דין מנוסה"],
        }
      }
    }

    // Validate and ensure all required fields exist
    const validatedAnalysis = {
      contractName: analysis.contractName || `חוזה מקובץ ${fileName}`,
      partyA: {
        name: analysis.partyA?.name || "צד א",
        idNumber: analysis.partyA?.idNumber || "",
        address: analysis.partyA?.address || "",
        role: analysis.partyA?.role || "צד לחוזה",
      },
      partyB: {
        name: analysis.partyB?.name || "צד ב",
        idNumber: analysis.partyB?.idNumber || "",
        address: analysis.partyB?.address || "",
        role: analysis.partyB?.role || "צד לחוזה",
      },
      contractType: analysis.contractType || "כללי",
      startDate: analysis.startDate || null,
      endDate: analysis.endDate || null,
      value: analysis.value || null,
      description: analysis.description || "תיאור החוזה",
      obligations: Array.isArray(analysis.obligations) ? analysis.obligations : [],
      keyTerms: Array.isArray(analysis.keyTerms) ? analysis.keyTerms : [],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    }

    console.log("Final validated analysis:", validatedAnalysis)

    return NextResponse.json({
      success: true,
      analysis: validatedAnalysis,
    })
  } catch (error) {
    console.error("Error in analyze-contract API:", error)

    return NextResponse.json(
      {
        success: false,
        error: "שגיאה בניתוח החוזה",
        analysis: {
          contractName: "שגיאה בניתוח",
          partyA: { name: "צד א", idNumber: "", address: "", role: "צד לחוזה" },
          partyB: { name: "צד ב", idNumber: "", address: "", role: "צד לחוזה" },
          contractType: "כללי",
          startDate: null,
          endDate: null,
          value: null,
          description: "אירעה שגיאה בניתוח. נדרש ניתוח ידני.",
          obligations: [],
          keyTerms: [],
          riskFactors: ["נדרש ניתוח ידני"],
          recommendations: ["נסה שוב או פנה לעורך דין"],
        },
      },
      { status: 200 },
    )
  }
}
