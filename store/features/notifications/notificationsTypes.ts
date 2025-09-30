export enum NotificationType {
	TASK_ASSIGNED = 'task_assigned',
	TASK_EVIDENCE_REQUESTED = 'task_evidence_requested',
}

export enum NotificationObjectType {
	TASK = 'task',
}

export type NotificationDto = {
	id: string // если решите перейти на bigint PK, заменить на number
	userId: string
	actorId: string
	type: NotificationType
	objectType: NotificationObjectType // всегда 'task' для текущих сценариев
	objectId: string // taskId
	payload: {
		taskTitle?: string
		dueDate?: string // ISO (при evidence-requested)
		[k: string]: any
	}
	isRead: boolean
	readAt?: string | null
	created: string // ISO
}

export type NotificationListResponse = {
	items: NotificationDto[]
	nextCursor: string | null
}

export type UnreadCountResponse = { count: number }
