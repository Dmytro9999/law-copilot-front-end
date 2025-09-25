export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface ISubtask {
	id?: number
	description: string
	completed: boolean
}

export interface ITask {
	id: number
	contractId: number | null
	contractTitle?: string
	title: string
	description?: string | null
	priority: TaskPriority
	status: TaskStatus
	due_at?: string | null
	createdAt: string
}

export interface CreateTaskRequest {
	contractId: number | null
	title: string
	description?: string | null
	priority?: TaskPriority
	dueDate?: string | null
	estimatedHours?: number | null
	tags?: string[]
	subtasks?: { description: string }[]
}

export type EvidenceStatus = 'submitted' | 'approved' | 'rejected'

export interface TaskUser {
	id: number
	name: string
	email: string
	avatar: string | null
}

export interface TaskEvidence {
	id: number
	created: string
	updated: string
	message: string | null
	status: EvidenceStatus
	submittedBy?: TaskUser
	document?: {
		id: number
		title?: string
		externalUrl?: string
		extension?: string | null
	} | null
}

export interface TaskView {
	id: number
	created: string
	updated: string
	title: string
	description: string | null
	status: string
	priority: number
	due_at: string | null
	approval_required: boolean
	parentTaskId: number | null
	contract?: { id: number; title: string; dueDate?: string | null } | null
	createdBy: TaskUser
	assignees: Array<{ id: number; user: TaskUser }>
	documents: any[]
	progressPct?: number
	evidences?: TaskEvidence[]
	children?: Array<
		Omit<TaskView, 'children' | 'evidences' | 'contract' | 'parentTaskId' | 'approval_required'>
	>
}

export type CreateSubtaskPayload = {
	title: string
	description?: string | null
	priority?: string
	due_at?: string | null // 'YYYY-MM-DD'
	assigneeIds?: number[]
	approval_required?: boolean
}
