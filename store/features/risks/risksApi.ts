import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import type { RootState } from '@/store/store'
import type { ContractRisk, CreateRiskRequest, UpdateRiskRequest } from './risksTypes'

export const risksApi = createApi({
	reducerPath: 'risksApi',
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
	tagTypes: ['Risks'],
	endpoints: (builder) => ({
		getRisksByContract: builder.query<ContractRisk[], number>({
			query: (contractId) => `contracts/${contractId}/risks`,
			providesTags: (res, err, contractId) =>
				res
					? [
							...res.map((r) => ({ type: 'Risks' as const, id: r.id })),
							{ type: 'Risks' as const, id: `LIST-${contractId}` },
						]
					: [{ type: 'Risks' as const, id: `LIST-${contractId}` }],
		}),

		createRisk: builder.mutation<ContractRisk, CreateRiskRequest>({
			query: (body) => ({ url: `risks`, method: 'POST', body }),
			invalidatesTags: (res) =>
				res ? [{ type: 'Risks', id: `LIST-${res.contractId}` }] : [],
		}),

		createRiskArray: builder.mutation<ContractRisk, CreateRiskRequest>({
			query: (body) => ({ url: `risks-array`, method: 'POST', body }),
			invalidatesTags: (res) =>
				res ? [{ type: 'Risks', id: `LIST-${res.contractId}` }] : [],
		}),

		updateRisk: builder.mutation<ContractRisk, UpdateRiskRequest>({
			query: ({ id, ...patch }) => ({ url: `risks/${id}`, method: 'PATCH', body: patch }),
			invalidatesTags: (res) =>
				res
					? [
							{ type: 'Risks', id: res.id },
							{ type: 'Risks', id: `LIST-${res.contractId}` },
						]
					: [],
		}),

		deleteRisk: builder.mutation<{ affected: number }, { id: number; contractId: number }>({
			query: ({ id }) => ({ url: `risks/${id}`, method: 'DELETE' }),
			invalidatesTags: (res, err, arg) => [{ type: 'Risks', id: `LIST-${arg.contractId}` }],
		}),
	}),
})

export const {
	useGetRisksByContractQuery,
	useCreateRiskMutation,
	useCreateRiskArrayMutation,
	useUpdateRiskMutation,
	useDeleteRiskMutation,
} = risksApi
