import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import type { RootState } from '@/store/store'
import {
	ContractsIndexResponse,
	QueryContractsParams,
} from '@/store/features/contracts/contractsTypes'

const MULTIPART_ENDPOINTS = new Set(['uploadDocument'])

export interface UploadDocumentResponse {
	id: number
	title: string
	originalName: string
	ext: string
	mimeType: string
	size: number
	bucket: string
	objectKey: string
	externalUrl: string
}

export interface AnalyzeContractResponse {
	success: boolean
	analysis: any
}

export type TaskFromAnalysisDto = {
	title: string
	description?: string | null
	priority?: 'high' | 'medium' | 'low' | null
	dueDate?: string | null
	clientKey?: string
	parentClientKey?: string
}

export interface MaterializeContractRequest {
	title: string
	description?: string | null
	status?: 'active' | 'draft' | 'archived'
	clientId?: number | string | null
	effectiveDate?: string | null
	dueDate?: string | null
	tasks?: TaskFromAnalysisDto[]
	documentId: string
}

export interface MaterializeContractResponse {
	success: boolean
	contractId: number
	title: string
}

export const contractsApi = createApi({
	reducerPath: 'contractsApi',

	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers, { getState, endpoint }) => {
			const accessToken = (getState() as RootState).auth?.accessToken
			if (accessToken) {
				headers.set('Authorization', `Bearer ${accessToken}`)
			}
			// multipart эндпоинтам НЕ ставим JSON Content-Type
			if (!MULTIPART_ENDPOINTS.has(endpoint)) {
				headers.set('Content-Type', 'application/json')
			}
			return headers
		},
	}),

	endpoints: (builder) => ({
		/** 1) Загрузка документа (multipart) */
		uploadDocument: builder.mutation<
			UploadDocumentResponse,
			{ file: File; originalName?: string }
		>({
			query: ({ file, originalName }) => {
				const fd = new FormData()
				fd.append('file', file) // поле должно называться "file"
				fd.append('originalName', originalName ?? file.name) // отдельным полем — решает UTF-8

				return {
					url: 'documents/upload',
					method: 'POST',
					body: fd,
					// заголовки тут не ставим: fetch сам проставит boundary
				}
			},
		}),

		/** 2) AI анализ (JSON) */
		analyzeContract: builder.mutation<
			AnalyzeContractResponse,
			{ contractText: string; contractName?: string; clientName?: string; fileName?: string }
		>({
			query: (body) => ({
				url: 'ai/extract-obligations',
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/json' },
			}),
		}),

		/** 3) Создать контракт + задачи + прикрепить документ (JSON) */
		materializeContract: builder.mutation<
			MaterializeContractResponse,
			MaterializeContractRequest
		>({
			query: (body) => ({
				url: 'contracts/from-analysis',
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/json' },
			}),
		}),

		/** (опционально) Получить подписанную ссылку на документ */
		getDocumentSignedUrl: builder.query<{ url: string }, { id: number; ttl?: number }>({
			query: ({ id, ttl = 900 }) => ({
				url: `documents/${id}/url?ttl=${ttl}`,
				method: 'GET',
			}),
		}),

		getContracts: builder.query<ContractsIndexResponse, QueryContractsParams | void>({
			query: (params) => ({
				url: 'contracts',
				method: 'GET',
				params: {
					pageNumber: params?.pageNumber ?? 1,
					countPerPage: params?.countPerPage ?? 6,
					search: params?.search ?? '',
					sortField: params?.sortField ?? 'id',
					sortOrder: params?.sortOrder ?? 'DESC',
					scope: params?.scope ?? 'all',
					status: params?.status ?? undefined,
				},
			}),
		}),
	}),
})

export const {
	useUploadDocumentMutation,
	useAnalyzeContractMutation,
	useMaterializeContractMutation,
	useGetDocumentSignedUrlQuery,
	useGetContractsQuery,
} = contractsApi
