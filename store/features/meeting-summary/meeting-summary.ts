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

export const meetingSummaryApi = createApi({
	reducerPath: 'meetingSummaryApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers, { getState, endpoint }) => {
			const accessToken = (getState() as RootState).auth?.accessToken
			if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
			// ⚠️ multipart-эндпоинтам НЕ ставим JSON Content-Type
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
					url: 'meeting-summary',
					method: 'POST',
					body: fd,
				}
			},
		}),
	}),
})

export const {
	// ...ваши уже экспортируемые хуки
	useMeetingAnalyzeMutation,
} = meetingSummaryApi
