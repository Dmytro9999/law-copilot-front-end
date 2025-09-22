import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import { RootState } from '@/store/store'
import { CreateTaskRequest, ITask, TaskStatus } from './tasksTypes'

export const tasksApi = createApi({
	reducerPath: 'tasksApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers, { getState }) => {
			const token = (getState() as RootState).auth.accessToken
			if (token) headers.set('Authorization', `Bearer ${token}`)
			headers.set('Content-Type', 'application/json')
			return headers
		},
	}),
	tagTypes: ['Tasks'],
	endpoints: (b) => ({
		// GET /tasks?status=&contractId=&search=
		getTasks: b.query<
			ITask[],
			{ status?: TaskStatus; contractId?: number; search?: string } | void
		>({
			query: (params) => {
				const qs = new URLSearchParams()
				if (params?.status) qs.set('status', params.status)
				if (params?.contractId) qs.set('contractId', String(params.contractId))
				if (params?.search) qs.set('search', params.search)
				return { url: `tasks${qs.toString() ? `?${qs}` : ''}` }
			},
			providesTags: ['Tasks'],
		}),

		// POST /tasks
		createTask: b.mutation<ITask, CreateTaskRequest>({
			query: (body) => ({ url: 'tasks', method: 'POST', body }),
			invalidatesTags: ['Tasks'],
		}),

		// PATCH /tasks/:id
		updateTask: b.mutation<ITask, { id: number; patch: Partial<ITask> }>({
			query: ({ id, patch }) => ({ url: `tasks/${id}`, method: 'PATCH', body: patch }),
			invalidatesTags: ['Tasks'],
		}),

		// DELETE /tasks/:id
		deleteTask: b.mutation<{ success: true }, number>({
			query: (id) => ({ url: `tasks/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Tasks'],
		}),

		// POST /tasks/:id/subtasks
		addSubtask: b.mutation<ITask, { taskId: number; description: string }>({
			query: ({ taskId, description }) => ({
				url: `tasks/${taskId}/subtasks`,
				method: 'POST',
				body: { description },
			}),
			invalidatesTags: ['Tasks'],
		}),

		// PATCH /tasks/:id/subtasks/:subId
		toggleSubtask: b.mutation<ITask, { taskId: number; subtaskId: number; completed: boolean }>(
			{
				query: ({ taskId, subtaskId, completed }) => ({
					url: `tasks/${taskId}/subtasks/${subtaskId}`,
					method: 'PATCH',
					body: { completed },
				}),
				invalidatesTags: ['Tasks'],
			}
		),

		// DELETE /tasks/:id/subtasks/:subId
		deleteSubtask: b.mutation<ITask, { taskId: number; subtaskId: number }>({
			query: ({ taskId, subtaskId }) => ({
				url: `tasks/${taskId}/subtasks/${subtaskId}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Tasks'],
		}),
	}),
})

export const {
	useGetTasksQuery,
	useCreateTaskMutation,
	useUpdateTaskMutation,
	useDeleteTaskMutation,
	useAddSubtaskMutation,
	useToggleSubtaskMutation,
	useDeleteSubtaskMutation,
} = tasksApi
