// מנגנון זיהוי התחייבויות מתקדם עם דפוסי טקסט

export interface DetectedObligation {
  id: string
  description: string
  type: "positive" | "negative" | "financial" | "operational" | "legal"
  responsibleParty: string
  dueDate?: string
  priority: "גבוהה" | "בינונית" | "נמוכה"
  category: string
  requiresProof: boolean
  amount?: string
  confidence: number
  sourceText: string
  keywords: string[]
}

export interface ObligationPattern {
  keywords: string[]
  type: "positive" | "negative" | "financial" | "operational" | "legal"
  category: string
  priority: "גבוהה" | "בינונית" | "נמוכה"
  requiresProof: boolean
}

// דפוסי זיהוי התחייבויות
export const OBLIGATION_PATTERNS: ObligationPattern[] = [
  // התחייבויות חיוביות (לעשות)
  {
    keywords: ["יחויב", "מתחייב", "יבצע", "יספק", "על הצד לבצע", "באחריות הצד"],
    type: "positive",
    category: "ביצוע",
    priority: "גבוהה",
    requiresProof: true,
  },
  {
    keywords: ["shall", "must", "will", "is required to", "undertakes to"],
    type: "positive",
    category: "ביצוע",
    priority: "גבוהה",
    requiresProof: true,
  },
  {
    keywords: ["לא יאוחר מ", "עד תאריך", "תוך", "ימים", "עד ל"],
    type: "positive",
    category: "זמנים",
    priority: "גבוהה",
    requiresProof: true,
  },

  // התחייבויות שליליות (לא לעשות)
  {
    keywords: ["לא יהיה רשאי", "אסור", "נאסר עליו", "יימנע מ", "לא יבצע"],
    type: "negative",
    category: "איסורים",
    priority: "בינונית",
    requiresProof: false,
  },
  {
    keywords: ["shall not", "must not", "is prohibited", "may not", "forbidden"],
    type: "negative",
    category: "איסורים",
    priority: "בינונית",
    requiresProof: false,
  },

  // התחייבויות כספיות
  {
    keywords: ["תשלום", "ישלם", "סכום", "₪", "שקל", "דולר", "$", "פיצוי", "קנס"],
    type: "financial",
    category: "כספי",
    priority: "גבוהה",
    requiresProof: true,
  },
  {
    keywords: ["ערבות", "פקדון", "בטחון", "ביטוח", "coverage", "guarantee"],
    type: "financial",
    category: "ביטחונות",
    priority: "גבוהה",
    requiresProof: true,
  },

  // התחייבויות תפעוליות
  {
    keywords: ["מסירה", "אספקה", "שירות", "תחזוקה", "תמיכה", "דיווח"],
    type: "operational",
    category: "תפעול",
    priority: "בינונית",
    requiresProof: true,
  },
  {
    keywords: ["delivery", "supply", "service", "maintenance", "support", "report"],
    type: "operational",
    category: "תפעול",
    priority: "בינונית",
    requiresProof: true,
  },

  // התחייבויות משפטיות
  {
    keywords: ["סודיות", "חיסיון", "תחרות", "רישיון", "היתר", "אישור"],
    type: "legal",
    category: "משפטי",
    priority: "גבוהה",
    requiresProof: false,
  },
  {
    keywords: ["confidentiality", "non-compete", "license", "permit", "approval"],
    type: "legal",
    category: "משפטי",
    priority: "גבוהה",
    requiresProof: false,
  },
]

// דפוסי זמן
export const TIME_PATTERNS = [
  { pattern: /תוך\s+(\d+)\s+ימים/g, type: "days" },
  { pattern: /לא\s+יאוחר\s+מ[־\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/g, type: "date" },
  { pattern: /עד\s+תאריך\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/g, type: "date" },
  { pattern: /עד\s+ל[־\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/g, type: "date" },
  { pattern: /מיידי|בהקדם|עם\s+חתימת\s+החוזה/g, type: "immediate" },
  { pattern: /within\s+(\d+)\s+days/gi, type: "days" },
  { pattern: /no\s+later\s+than\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/gi, type: "date" },
]

// דפוסי סכומים
export const AMOUNT_PATTERNS = [
  { pattern: /(\d{1,3}(?:,\d{3})*)\s*₪/g, currency: "ILS" },
  { pattern: /(\d{1,3}(?:,\d{3})*)\s*שקל/g, currency: "ILS" },
  { pattern: /\$\s*(\d{1,3}(?:,\d{3})*)/g, currency: "USD" },
  { pattern: /(\d{1,3}(?:,\d{3})*)\s*דולר/g, currency: "USD" },
]

// דפוסי צדדים אחראיים
export const PARTY_PATTERNS = [
  { pattern: /הקבלן|הספק|נותן\s+השירות|המבצע/g, party: "קבלן/ספק" },
  { pattern: /המזמין|הלקוח|מקבל\s+השירות|החברה/g, party: "מזמין/לקוח" },
  { pattern: /contractor|supplier|service\s+provider/gi, party: "קבלן/ספק" },
  { pattern: /client|customer|company/gi, party: "מזמין/לקוח" },
]

export class ObligationDetector {
  private contractText: string
  private detectedObligations: DetectedObligation[] = []

  constructor(contractText: string) {
    this.contractText = contractText
  }

  // זיהוי אוטומטי של התחייבויות
  public detectObligations(): DetectedObligation[] {
    this.detectedObligations = []

    // חלוקת הטקסט למשפטים
    const sentences = this.splitIntoSentences(this.contractText)

    sentences.forEach((sentence, index) => {
      const obligations = this.analyzeSentence(sentence, index)
      this.detectedObligations.push(...obligations)
    })

    // מיון לפי רמת ביטחון
    this.detectedObligations.sort((a, b) => b.confidence - a.confidence)

    return this.detectedObligations
  }

  private splitIntoSentences(text: string): string[] {
    // חלוקה למשפטים עם התחשבות בעברית ואנגלית
    return text
      .split(/[.!?;]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10) // סינון משפטים קצרים מדי
  }

  private analyzeSentence(sentence: string, index: number): DetectedObligation[] {
    const obligations: DetectedObligation[] = []

    // בדיקה מול כל דפוס
    OBLIGATION_PATTERNS.forEach((pattern) => {
      const matchedKeywords = pattern.keywords.filter((keyword) =>
        sentence.toLowerCase().includes(keyword.toLowerCase()),
      )

      if (matchedKeywords.length > 0) {
        const obligation = this.createObligation(sentence, pattern, matchedKeywords, index)
        if (obligation) {
          obligations.push(obligation)
        }
      }
    })

    return obligations
  }

  private createObligation(
    sentence: string,
    pattern: ObligationPattern,
    matchedKeywords: string[],
    index: number,
  ): DetectedObligation | null {
    // חישוב רמת ביטחון
    const confidence = this.calculateConfidence(sentence, matchedKeywords)

    if (confidence < 0.3) return null // סף מינימלי

    // זיהוי צד אחראי
    const responsibleParty = this.extractResponsibleParty(sentence)

    // זיהוי תאריך יעד
    const dueDate = this.extractDueDate(sentence)

    // זיהוי סכום
    const amount = this.extractAmount(sentence)

    // יצירת תיאור נקי
    const description = this.cleanDescription(sentence)

    return {
      id: `auto-${index}-${Date.now()}`,
      description,
      type: pattern.type,
      responsibleParty,
      dueDate,
      priority: pattern.priority,
      category: pattern.category,
      requiresProof: pattern.requiresProof,
      amount,
      confidence,
      sourceText: sentence,
      keywords: matchedKeywords,
    }
  }

  private calculateConfidence(sentence: string, matchedKeywords: string[]): number {
    let confidence = 0

    // ביטחון בסיסי לפי מספר מילות מפתח
    confidence += matchedKeywords.length * 0.2

    // בונוס לדפוסי זמן
    TIME_PATTERNS.forEach((timePattern) => {
      if (timePattern.pattern.test(sentence)) {
        confidence += 0.3
      }
    })

    // בונוס לסכומים
    AMOUNT_PATTERNS.forEach((amountPattern) => {
      if (amountPattern.pattern.test(sentence)) {
        confidence += 0.2
      }
    })

    // בונוס לצדדים מוגדרים
    PARTY_PATTERNS.forEach((partyPattern) => {
      if (partyPattern.pattern.test(sentence)) {
        confidence += 0.1
      }
    })

    // בונוס לאורך משפט מתאים
    if (sentence.length > 50 && sentence.length < 300) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  private extractResponsibleParty(sentence: string): string {
    for (const partyPattern of PARTY_PATTERNS) {
      const match = sentence.match(partyPattern.pattern)
      if (match) {
        return partyPattern.party
      }
    }
    return "לא צוין"
  }

  private extractDueDate(sentence: string): string | undefined {
    for (const timePattern of TIME_PATTERNS) {
      const match = sentence.match(timePattern.pattern)
      if (match) {
        if (timePattern.type === "days" && match[1]) {
          // חישוב תאריך עתידי
          const days = Number.parseInt(match[1])
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + days)
          return futureDate.toISOString().split("T")[0]
        } else if (timePattern.type === "date" && match[1]) {
          // המרת תאריך לפורמט ISO
          return this.parseDate(match[1])
        } else if (timePattern.type === "immediate") {
          // תאריך מיידי - היום
          return new Date().toISOString().split("T")[0]
        }
      }
    }
    return undefined
  }

  private extractAmount(sentence: string): string | undefined {
    for (const amountPattern of AMOUNT_PATTERNS) {
      const match = sentence.match(amountPattern.pattern)
      if (match && match[1]) {
        return `${match[1]} ${amountPattern.currency}`
      }
    }
    return undefined
  }

  private parseDate(dateStr: string): string {
    try {
      // ניסיון להמיר תאריך בפורמטים שונים
      const formats = [/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/, /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})/]

      for (const format of formats) {
        const match = dateStr.match(format)
        if (match) {
          const day = Number.parseInt(match[1])
          const month = Number.parseInt(match[2]) - 1 // JavaScript months are 0-based
          let year = Number.parseInt(match[3])

          if (year < 100) {
            year += 2000 // המרת שנתיים לארבע ספרות
          }

          const date = new Date(year, month, day)
          return date.toISOString().split("T")[0]
        }
      }
    } catch (error) {
      console.error("Error parsing date:", error)
    }
    return undefined
  }

  private cleanDescription(sentence: string): string {
    // ניקוי התיאור מתווים מיותרים
    return sentence
      .replace(/\s+/g, " ") // החלפת רווחים מרובים ברווח יחיד
      .replace(/[^\u0590-\u05FF\u0020-\u007F\d]/g, "") // שמירה על עברית, אנגלית ומספרים
      .trim()
      .substring(0, 200) // הגבלת אורך
  }

  // קבלת סטטיסטיקות
  public getDetectionStats() {
    const stats = {
      total: this.detectedObligations.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      averageConfidence: 0,
    }

    this.detectedObligations.forEach((obligation) => {
      stats.byType[obligation.type] = (stats.byType[obligation.type] || 0) + 1
      stats.byPriority[obligation.priority] = (stats.byPriority[obligation.priority] || 0) + 1
      stats.byCategory[obligation.category] = (stats.byCategory[obligation.category] || 0) + 1
    })

    if (this.detectedObligations.length > 0) {
      stats.averageConfidence =
        this.detectedObligations.reduce((sum, o) => sum + o.confidence, 0) / this.detectedObligations.length
    }

    return stats
  }
}

// פונקציית עזר לזיהוי התחייבויות מטקסט
export function detectObligationsFromText(contractText: string): DetectedObligation[] {
  const detector = new ObligationDetector(contractText)
  return detector.detectObligations()
}

// פונקציית עזר לקבלת המלצות להתחייבויות נוספות
export function suggestAdditionalObligations(contractType: string): DetectedObligation[] {
  const suggestions: Record<string, DetectedObligation[]> = {
    שירותים: [
      {
        id: "suggest-1",
        description: "מסירת דוח התקדמות חודשי",
        type: "operational",
        responsibleParty: "נותן השירות",
        priority: "בינונית",
        category: "דיווח",
        requiresProof: true,
        confidence: 0.8,
        sourceText: "המלצה אוטומטית",
        keywords: ["דיווח", "חודשי"],
      },
      {
        id: "suggest-2",
        description: "שמירת סודיות מידע הלקוח",
        type: "legal",
        responsibleParty: "נותן השירות",
        priority: "גבוהה",
        category: "משפטי",
        requiresProof: false,
        confidence: 0.9,
        sourceText: "המלצה אוטומטית",
        keywords: ["סודיות"],
      },
    ],
    אספקה: [
      {
        id: "suggest-3",
        description: "בדיקת איכות המוצרים לפני מסירה",
        type: "operational",
        responsibleParty: "ספק",
        priority: "גבוהה",
        category: "איכות",
        requiresProof: true,
        confidence: 0.8,
        sourceText: "המלצה אוטומטית",
        keywords: ["איכות", "בדיקה"],
      },
    ],
    נדלן: [
      {
        id: "suggest-4",
        description: "קבלת היתרי בנייה נדרשים",
        type: "legal",
        responsibleParty: "קבלן",
        priority: "גבוהה",
        category: "רישויים",
        requiresProof: true,
        confidence: 0.9,
        sourceText: "המלצה אוטומטית",
        keywords: ["היתר", "בנייה"],
      },
    ],
  }

  return suggestions[contractType] || []
}
