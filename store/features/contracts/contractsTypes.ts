export type ContractsScope = 'all' | 'created' | 'participating'
export type SortOrder = 'ASC' | 'DESC'

export interface QueryContractsParams {
	pageNumber?: number
	countPerPage?: number
	search?: string
	sortField?: string
	sortOrder?: SortOrder
	scope?: ContractsScope
	status?: string // 'draft' | 'active' | 'archived' | ...
}

export interface ContractUserRef {
	id: number
	name?: string
	email?: string
}

export interface ContractListItem {
	id: number
	title: string
	description?: string | null
	status: string
	effectiveDate?: string | null
	dueDate?: string | null
	createdBy?: ContractUserRef | null
	client?: ContractUserRef | null
	myRole?: 'owner' | string | null
	created?: string
	updated?: string
}

export interface ContractsIndexResponse {
	count: number // количество страниц
	list: ContractListItem[]
}
