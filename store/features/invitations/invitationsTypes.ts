export type ClientType = 'individual' | 'company'

export interface CreateInvitationRequest {
	email: string
	clientType: ClientType
	fullName?: string | null
	phone?: string | null
	companyName?: string | null
	position?: string | null
	address?: string | null
	identificationCode?: string | null
	businessNumber?: string | null
	notes?: string | null
	// не обяз., если на бэке есть дефолт (например 168ч)
	expiresInHours?: number
}

export interface InvitationDto {
	id: number
	email: string
	token: string
	expiresAt: string
	activatedAt: string | null
	clientType: ClientType
	fullName: string | null
	phone: string | null
	companyName: string | null
	position: string | null
	address: string | null
	identificationCode: string | null
	businessNumber: string | null
	notes: string | null
	created: string
	updated: string
}

export interface VerifyInvitationResponse {
	email: string
	invitedByName?: string
	clientType: ClientType
	fullName?: string | null
	phone?: string | null
	companyName?: string | null
	position?: string | null
	address?: string | null
	identificationCode?: string | null
	businessNumber?: string | null
	notes?: string | null
	expiresAt: string
	activatedAt: string | null
}

export interface AcceptInvitationRequest {
	token: string
	password: string
	profileOverride?: Partial<{
		name: string
		phone: string | null
		company: string | null
		position: string | null
		address: string | null
		clientType: ClientType
		identificationCode: string | null
		businessNumber: string | null
		notes: string | null
	}>
}

export interface InvitationListItem {
	id: number
	email: string
	clientType: 'individual' | 'company'
	fullName?: string | null
	phone?: string | null
	companyName?: string | null
	position?: string | null
	address?: string | null
	identificationCode?: string | null
	businessNumber?: string | null
	notes?: string | null
	expiresAt: string
	activatedAt?: string | null
	created: string
	status: 'Pending' | 'Activated' | 'Expired'
}

export interface InvitationListResponse {
	count: number
	list: InvitationListItem[]
}
export interface InvitationStats {
	activated: number
	pending: number
	expired: number
	total: number
}
