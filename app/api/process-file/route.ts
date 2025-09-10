import { type NextRequest, NextResponse } from "next/server"

// API Route לעיבוד קבצים בשרת (fallback)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "לא נמצא קובץ" }, { status: 400 })
    }

    // כאן תוכל להוסיף עיבוד קבצים בשרת
    // למשל באמצעות ספריות Python או שירותים חיצוניים

    // לעת עתה - החזרת הודעה שהקובץ נשלח לעיבוד
    const text = `[קובץ ${file.name} נשלח לעיבוד בשרת - יש להוסיף עיבוד אמיתי כאן]`

    return NextResponse.json({
      success: true,
      text,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    })
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json({ error: "שגיאה בעיבוד הקובץ" }, { status: 500 })
  }
}
