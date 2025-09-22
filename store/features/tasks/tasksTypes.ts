export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface ISubtask {
	id?: number
	description: string
	completed: boolean
}

export interface ITask {
	id: number
	contractId: number
	contractTitle?: string
	title: string
	description?: string | null
	priority: TaskPriority
	status: TaskStatus
	dueDate?: string | null
	estimatedHours?: number | null
	tags?: string[]
	subtasks?: ISubtask[]
	createdAt: string
}

export interface CreateTaskRequest {
	contractId: number
	title: string
	description?: string | null
	priority?: TaskPriority
	dueDate?: string | null
	estimatedHours?: number | null
	tags?: string[]
	subtasks?: { description: string }[]
}
