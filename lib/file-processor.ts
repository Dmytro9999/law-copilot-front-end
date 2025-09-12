// פרוססר קבצים אמיתי לחילוץ טקסט מ-PDF, Word ועוד

export interface ProcessedFile {
  text: string
  metadata: {
    fileName: string
    fileSize: number
    fileType: string
    pageCount?: number
    wordCount: number
    extractedAt: string
  }
  chunks: TextChunk[]
}

export interface TextChunk {
  id: string
  text: string
  startIndex: number
  endIndex: number
  type: "paragraph" | "header" | "list" | "table"
  confidence: number
}

export class FileProcessor {
  private file: File
  private supportedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/rtf",
  ]

  constructor(file: File) {
    this.file = file
  }

  // בדיקה אם הקובץ נתמך
  public isSupported(): boolean {
    return this.supportedTypes.includes(this.file.type)
  }

  // עיבוד הקובץ וחילוץ טקסט
  public async processFile(): Promise<ProcessedFile> {
    if (!this.isSupported()) {
      throw new Error(`סוג קובץ לא נתמך: ${this.file.type}`)
    }

    let extractedText = ""
    let pageCount: number | undefined

    try {
      switch (this.file.type) {
        case "text/plain":
          extractedText = await this.processTextFile()
          break
        case "application/pdf":
          extractedText = await this.processPDFFile()
          pageCount = await this.getPDFPageCount()
          break
        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          extractedText = await this.processWordFile()
          break
        case "text/rtf":
          extractedText = await this.processRTFFile()
          break
        default:
          throw new Error("סוג קובץ לא נתמך")
      }

      // חלוקה לצ'אנקים (chunks)
      const chunks = this.splitIntoChunks(extractedText)

      // ספירת מילים
      const wordCount = this.countWords(extractedText)

      return {
        text: extractedText,
        metadata: {
          fileName: this.file.name,
          fileSize: this.file.size,
          fileType: this.file.type,
          pageCount,
          wordCount,
          extractedAt: new Date().toISOString(),
        },
        chunks,
      }
    } catch (error) {
      console.error("Error processing file:", error)
      throw new Error(`שגיאה בעיבוד הקובץ: ${error.message}`)
    }
  }

  // עיבוד קובץ טקסט רגיל
  private async processTextFile(): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        resolve(text)
      }
      reader.onerror = () => reject(new Error("שגיאה בקריאת קובץ הטקסט"))
      reader.readAsText(this.file, "utf-8")
    })
  }

  // עיבוד קובץ PDF (באמצעות PDF.js)
    private async processPDFFile(): Promise<string> {
        try {
            const pdfjsLib = await import("pdfjs-dist")

            // Указываем воркер (обязательно для браузера)
            if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url
                ).toString()
            }

            const arrayBuffer = await this.file.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise

            let fullText = ""
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const textContent = await page.getTextContent()
                fullText += textContent.items.map((i: any) => i.str).join(" ") + "\n"
            }

            return fullText.trim()
        } catch (error) {
            console.error("Error processing PDF:", error)
            return await this.processFileOnServer()
        }
    }


    // עיבוד קובץ Word
  private async processWordFile(): Promise<string> {
    try {
      await this.validateWordFile()

      // Import mammoth.js for Word document processing
      const mammoth = await import("mammoth")

      const arrayBuffer = await this.file.arrayBuffer()

      try {
        // First, try to validate the docx structure
        await this.validateDocxStructure(arrayBuffer)

        const result = await mammoth.extractRawText({ arrayBuffer })

        if (!result.value || result.value.trim().length === 0) {
          throw new Error("הקובץ ריק או לא מכיל טקסט")
        }

        // Log successful processing
        console.log("[v0] Word file processed successfully, extracted", result.value.length, "characters")

        return result.value
      } catch (mammothError) {
        console.log("[v0] Mammoth.js error:", mammothError.message)

        if (mammothError.message.includes("body element")) {
          // Try alternative processing method
          console.log("[v0] Attempting alternative Word processing method")
          return await this.processWordFileAlternative(arrayBuffer)
        }

        // Handle specific mammoth.js errors with user-friendly messages
        if (mammothError.message.includes("not a valid zip file")) {
          throw new Error("הקובץ אינו קובץ Word תקין. אנא שמור את הקובץ כ-.docx ונסה שוב")
        }

        if (mammothError.message.includes("password")) {
          throw new Error("הקובץ מוגן בסיסמה. אנא הסר את ההגנה ונסה שוב")
        }

        throw new Error(`שגיאה בקריאת קובץ Word: ${mammothError.message}`)
      }
    } catch (error) {
      console.error("Error processing Word file:", error)

      if (error.message.includes("פגום") || error.message.includes("תקין") || error.message.includes("סיסמה")) {
        throw error // Re-throw our custom error messages
      }

      if (this.file.type === "application/msword") {
        throw new Error("קבצי .doc ישנים אינם נתמכים במלואם. אנא שמור את הקובץ כ-.docx ונסה שוב")
      }

      // Fallback - שליחה לשרת לעיבוד
      try {
        console.log("[v0] Attempting server-side processing as fallback")
        return await this.processFileOnServer()
      } catch (serverError) {
        throw new Error("לא ניתן לעבד את קובץ Word. אנא וודא שהקובץ תקין, לא מוגן בסיסמה, ושמור כ-.docx")
      }
    }
  }

  private async validateDocxStructure(arrayBuffer: ArrayBuffer): Promise<void> {
    try {
      // Import JSZip to validate docx structure
      const JSZip = (await import("jszip")).default

      const zip = await JSZip.loadAsync(arrayBuffer)

      // Check for required docx files
      const requiredFiles = ["word/document.xml", "[Content_Types].xml"]
      const missingFiles = requiredFiles.filter((file) => !zip.files[file])

      if (missingFiles.length > 0) {
        console.log("[v0] Docx structure validation failed:", `חסרים קבצים נדרשים: ${missingFiles.join(", ")}`)
        throw new Error(`קובץ Word פגום - חסרים קבצים נדרשים: ${missingFiles.join(", ")}`)
      }

      // Try to read the main document
      const documentXml = await zip.files["word/document.xml"].async("text")
      if (!documentXml.includes("<w:body>")) {
        throw new Error("קובץ Word פגום - לא נמצא גוף המסמך")
      }

      console.log("[v0] Docx structure validation passed")
    } catch (error) {
      console.log("[v0] Docx structure validation failed:", error.message)

      if (error.message.includes("invalid zip file") || error.message.includes("End of central directory")) {
        throw new Error("הקובץ פגום או אינו קובץ Word תקין. אנא נסה לפתוח ולשמור מחדש את הקובץ")
      }

      throw new Error("קובץ Word פגום או לא תקין. אנא וודא שהקובץ נשמר כ-.docx ולא מוגן בסיסמה")
    }
  }

  private async processWordFileAlternative(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // Import JSZip for manual XML parsing
      const JSZip = (await import("jszip")).default

      const zip = await JSZip.loadAsync(arrayBuffer)

      // Extract text from document.xml manually
      const documentXml = await zip.files["word/document.xml"].async("text")

      // Simple XML text extraction (removes all tags)
      const textContent = documentXml
        .replace(/<[^>]*>/g, " ") // Remove all XML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()

      if (!textContent || textContent.length < 10) {
        throw new Error("לא ניתן לחלץ טקסט מהקובץ")
      }

      console.log("[v0] Alternative Word processing successful, extracted", textContent.length, "characters")
      return textContent
    } catch (error) {
      console.error("[v0] Alternative Word processing failed:", error)
      throw new Error("שגיאה בעיבוד חלופי של קובץ Word")
    }
  }

  private async validateWordFile(): Promise<void> {
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (this.file.size > maxSize) {
      throw new Error("קובץ גדול מדי. גודל מקסימלי: 50MB")
    }

    // Check if file is empty
    if (this.file.size === 0) {
      throw new Error("הקובץ ריק")
    }

    if (this.file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const buffer = await this.file.slice(0, 4).arrayBuffer()
      const signature = new Uint8Array(buffer)

      // Check for ZIP signature (docx files are ZIP archives)
      if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
        throw new Error("הקובץ אינו קובץ Word תקין (.docx). אנא וודא שהקובץ נשמר בפורמט הנכון")
      }
    }

    // Additional validation for .doc files with clearer messaging
    if (this.file.type === "application/msword") {
      const buffer = await this.file.slice(0, 8).arrayBuffer()
      const signature = new Uint8Array(buffer)

      // Check for OLE signature (older .doc files)
      if (signature[0] !== 0xd0 || signature[1] !== 0xcf) {
        throw new Error("הקובץ אינו קובץ Word תקין (.doc). אנא שמור כ-.docx לתמיכה מלאה")
      }

      // Warn about limited .doc support
      console.log("[v0] Processing .doc file - limited support available")
    }

    const fileName = this.file.name.toLowerCase()
    if (
      fileName.endsWith(".docx") &&
      this.file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      throw new Error("סוג הקובץ לא תואם לסיומת. אנא וודא שהקובץ נשמר כ-.docx")
    }

    if (fileName.endsWith(".doc") && this.file.type !== "application/msword") {
      throw new Error("סוג הקובץ לא תואם לסיומת. אנא שמור כ-.docx לתמיכה מלאה")
    }
  }

  // עיבוד קובץ RTF
  private async processRTFFile(): Promise<string> {
    try {
      const text = await this.processTextFile()
      // ניקוי תגי RTF בסיסי
      return text
        .replace(/\\[a-z]+\d*\s?/g, "") // הסרת פקודות RTF
        .replace(/[{}]/g, "") // הסרת סוגריים מסולסלים
        .replace(/\s+/g, " ") // החלפת רווחים מרובים
        .trim()
    } catch (error) {
      console.error("Error processing RTF file:", error)
      throw error
    }
  }

  // שליחה לשרת לעיבוד (fallback)
  private async processFileOnServer(): Promise<string> {
    const formData = new FormData()
    formData.append("file", this.file)

    const response = await fetch("/api/process-file", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("שגיאה בעיבוד הקובץ בשרת")
    }

    const result = await response.json()
    return result.text
  }

  // קבלת מספר עמודים ב-PDF
  private async getPDFPageCount(): Promise<number> {
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js")

      // Set worker source with proper error handling
      if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
      }

      const arrayBuffer = await this.file.arrayBuffer()

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: typeof window === "undefined" || !pdfjsLib.GlobalWorkerOptions,
      })

      const pdf = await loadingTask.promise
      return pdf.numPages
    } catch (error) {
      console.error("[v0] Error getting PDF page count:", error)
      return 0
    }
  }

  // חלוקה לצ'אנקים
  private splitIntoChunks(text: string): TextChunk[] {
    const chunks: TextChunk[] = []
    const maxChunkSize = 1000 // מקסימום תווים לצ'אנק
    const overlap = 100 // חפיפה בין צ'אנקים

    // חלוקה לפסקאות
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

    let currentChunk = ""
    let chunkIndex = 0
    let startIndex = 0

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        // שמירת הצ'אנק הנוכחי
        chunks.push({
          id: `chunk-${chunkIndex}`,
          text: currentChunk.trim(),
          startIndex,
          endIndex: startIndex + currentChunk.length,
          type: this.detectChunkType(currentChunk),
          confidence: 0.9,
        })

        // התחלת צ'אנק חדש עם חפיפה
        const overlapText = currentChunk.slice(-overlap)
        currentChunk = overlapText + "\n" + paragraph
        startIndex += currentChunk.length - overlapText.length - paragraph.length
        chunkIndex++
      } else {
        currentChunk += (currentChunk ? "\n" : "") + paragraph
      }
    }

    // הוספת הצ'אנק האחרון
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
        type: this.detectChunkType(currentChunk),
        confidence: 0.9,
      })
    }

    return chunks
  }

  // זיהוי סוג הצ'אנק
  private detectChunkType(text: string): "paragraph" | "header" | "list" | "table" {
    // כותרת - טקסט קצר עם אותיות גדולות או מספור
    if (text.length < 100 && (/^[א-ת\s\d.]+$/.test(text) || /^\d+\./.test(text))) {
      return "header"
    }

    // רשימה - מתחיל במספר או תבליט
    if (/^[\d\u2022\u2023\u25E6\u25AA\u25AB]/.test(text) || text.includes("\n• ") || text.includes("\n- ")) {
      return "list"
    }

    // טבלה - מכיל הרבה טאבים או פסיקים
    if ((text.match(/\t/g) || []).length > 3 || (text.match(/\|/g) || []).length > 3) {
      return "table"
    }

    return "paragraph"
  }

  // ספירת מילים
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }
}

// פונקציית עזר לעיבוד קובץ
export async function processFile(file: File): Promise<ProcessedFile> {
  const processor = new FileProcessor(file)
  return await processor.processFile()
}

// פונקציית עזר לבדיקה אם קובץ נתמך
export function isSupportedFile(file: File): boolean {
  const processor = new FileProcessor(file)
  return processor.isSupported()
}
