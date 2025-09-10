import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBkZ8QVHjGgvQxKzVoE3mF2nL1pR4sT6uY",
)

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json()

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const fullPrompt = `
אתה עורך דין מומחה במערכת LAWCOPILOT.
הקשר: ${context || "כללי"}
שאלה/בקשה: ${prompt}

אנא ענה בעברית באופן מקצועי ומדויק.
`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      response: text,
    })
  } catch (error) {
    console.error("Error in AI forward:", error)
    return NextResponse.json({ error: "שגיאה בעיבוד הבקשה" }, { status: 500 })
  }
}
