export interface ContractRisk {
	id: number
	contractId: number
	title: string
}

export interface CreateRiskRequest {
	contractId: number
	title: string
}

export interface UpdateRiskRequest {
	id: number
	title?: string
	description?: string | null
}

export interface BulkAiPayload {
	contractId: number
	risks: Array<{
		title: string
	}>
}
