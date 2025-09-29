import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import type { RootState } from '@/store/store'

const MULTIPART_ENDPOINTS = new Set(['uploadDocument', 'meetingAnalyze'])

export interface MeetingAnalyzeResponse {
	document: {
		name: string
		size: number
		mime: string
		signedUrl?: string
		storageKey?: string
	}
	ai: {
		summary: string
		keyPoints?: string[]
	}
}

export interface MeetingAnalyzeRequest {
	file: File
	title: string
	meetingDate: string // YYYY-MM-DD
	notes?: string
	contractId?: number | string | null
}

export interface CreateMeetingSummaryRequest {
	contractId?: number | string | null
	documentId?: number | string | null
	title: string
	meetingDate: string // YYYY-MM-DD
	notes?: string | null
	summary: string
	keyPoints?: string[]
}

export interface CreateMeetingSummaryResponse {
	id: string
	title: string
	meetingDate: string
	notes?: string | null
	summary: string
	keyPoints?: string[]
	// document/contract могут прийти, если вы вернёте relations
}

export interface MeetingSummaryItem {
	id: number | string
	title: string
	meetingDate: string // YYYY-MM-DD
	notes?: string | null
	summary: string
	keyPoints?: string[]
	document?: { id: number; title?: string; extension?: string; size?: number } | null
	contract?: { id: number; title?: string; name?: string } | null
	created_at?: string
	updated_at?: string
}

export interface ListMeetingSummariesParams {
	search?: string
	contractId?: number | string
	page?: number
	perPage?: number
}

export interface ListMeetingSummariesResponse {
	items: MeetingSummaryItem[]
	meta: { page: number; perPage: number; total: number; totalPages: number }
}

export const meetingSummaryApi = createApi({
	reducerPath: 'meetingSummaryApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers, { getState, endpoint }) => {
			const accessToken = (getState() as RootState).auth?.accessToken
			if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
			if (!MULTIPART_ENDPOINTS.has(endpoint)) {
				headers.set('Content-Type', 'application/json')
			}
			return headers
		},
	}),
	endpoints: (builder) => ({
		// ...ваши существующие endpoints

		/** ⬇️ Анализ встречи (multipart, файл + поля) */
		meetingAnalyze: builder.mutation<MeetingAnalyzeResponse, MeetingAnalyzeRequest>({
			query: ({ file, title, meetingDate, notes, contractId }) => {
				const fd = new FormData()
				fd.append('file', file) // ключ "file" должен совпадать с FileInterceptor('file')
				fd.append('title', title)
				fd.append('meetingDate', meetingDate)
				if (notes) fd.append('notes', notes)
				if (contractId !== undefined && contractId !== null && String(contractId) !== '') {
					fd.append('contractId', String(contractId))
				}
				return {
					url: 'meeting-summary/analyze',
					method: 'POST',
					body: fd,
				}
			},
		}),

		getMeetingSummaries: builder.query<
			ListMeetingSummariesResponse,
			ListMeetingSummariesParams | void
		>({
			query: (params) => ({
				url: 'meeting-summary',
				method: 'GET',
				params: {
					search: params?.search ?? undefined,
					contractId: params?.contractId ?? undefined,
					page: params?.page ?? 1,
					perPage: params?.perPage ?? 12, // по умолчанию 12 на страницу
				},
			}),
		}),

		createMeetingSummary: builder.mutation<
			CreateMeetingSummaryResponse,
			CreateMeetingSummaryRequest
		>({
			query: (body) => ({
				url: 'meeting-summary',
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/json' },
			}),
		}),
	}),
})

export const {
	useMeetingAnalyzeMutation,
	useCreateMeetingSummaryMutation,
	useGetMeetingSummariesQuery,
} = meetingSummaryApi
