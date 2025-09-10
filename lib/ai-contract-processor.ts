export interface AIContractAnalysis {
  contractType: string
  riskLevel: "גבוה" | "בינוני" | "נמוך"
  summary: string
  parties: Array<{
    name: string
    idNumber: string
    role: string
    email: string
    phone: string
  }>
  obligations: Array<{
    description: string
    responsibleParty: string
    dueDate: string
    priority: "גבוהה" | "בינונית" | "נמוכה"
    category: string
    requiresProof: boolean
    amount: string | null
  }>
  criticalDates: string[]
  riskFactors: string[]
  keyTerms: Array<{
    term: string
    description: string
    importance: "high" | "medium" | "low"
  }>
  recommendations: string[]
  signingDate?: string
}

export async function processContractWithAI(
  file: File,
  contractName: string,
  clientName: string,
): Promise<AIContractAnalysis> {
  try {
    // In a real implementation, you would:
    // 1. Upload file to Vercel Blob or similar
    // 2. Extract text using OCR/PDF parser
    // 3. Send to Google Gemini for analysis

    const response = await fetch("/api/ai/extract-obligations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contractName,
        clientName,
        fileName: file.name,
        contractText: `[קובץ: ${file.name}] - טקסט החוזה יחולץ מהקובץ`,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to process contract")
    }

    const result = await response.json()
    return result.analysis
  } catch (error) {
    console.error("Error processing contract:", error)
    throw error
  }
}

export async function sendContractToN8N(contractData: any, fileUrl: string) {
  try {
    // Mock n8n webhook call
    console.log("Sending to n8n webhook:", { contractData, fileUrl })

    // In a real implementation:
    // const response = await fetch(process.env.N8N_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ contractData, fileUrl })
    // })

    return { success: true }
  } catch (error) {
    console.error("Error sending to n8n:", error)
    throw error
  }
}
