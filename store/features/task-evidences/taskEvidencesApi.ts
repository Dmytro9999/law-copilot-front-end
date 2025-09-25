// src/store/features/tasks/taskEvidencesApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import { RootState } from '@/store/store'

// ↓ под ваши типы, можно сузить позже
export type SubmitEvidenceResponse = any
export interface SubmitEvidenceBody {
	taskId: number
	message: string
	fileId: number // бек ожидает file_id
}

export const taskEvidencesApi = createApi({
	reducerPath: 'taskEvidencesApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers, { getState }) => {
			const accessToken = (getState() as RootState).auth?.accessToken
			if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
			headers.set('Content-Type', 'application/json')
			return headers
		},
	}),
	endpoints: (builder) => ({
		submitTaskEvidence: builder.mutation<
			SubmitEvidenceResponse,
			{ taskId: number; message: string; fileId: number }
		>({
			query: ({ taskId, message, fileId }) => ({
				url: `task-evidences/${taskId}/create`,
				method: 'POST',
				body: { message, file_id: fileId },
			}),
		}),
		approveEvidence: builder.mutation<any, { evidenceId: number; taskId: number }>({
			query: ({ evidenceId, taskId }) => ({
				url: `task-evidences/${taskId}/evidence/${evidenceId}/approve`,
				method: 'POST',
			}),
		}),
		rejectEvidence: builder.mutation<any, { evidenceId: number; taskId: number }>({
			query: ({ evidenceId, taskId }) => ({
				url: `task-evidences/${taskId}/evidence/${evidenceId}/reject`,
				method: 'POST',
			}),
		}),
	}),
})

export const {
	useSubmitTaskEvidenceMutation,
	useApproveEvidenceMutation,
	useRejectEvidenceMutation,
} = taskEvidencesApi
