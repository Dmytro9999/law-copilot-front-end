import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import {
	CreateInvitationRequest,
	InvitationDto,
	InvitationListResponse,
	InvitationStats,
} from '@/store/features/invitations/invitationsTypes'

export const invitationsApi = createApi({
	reducerPath: 'invitationsApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers) => {
			headers.set('Content-Type', 'application/json')
			return headers
		},
	}),
	endpoints: (builder) => ({
		getMyInvitations: builder.query<
			InvitationListResponse,
			{
				pageNumber?: number
				countPerPage?: number
				search?: string
				status?: string
				clientType?: string
			}
		>({
			query: (params) => ({ url: 'invitations', method: 'GET', params }),
		}),
		getInvitationStats: builder.query<InvitationStats, void>({
			query: () => ({ url: 'invitations/stats', method: 'GET' }),
		}),

		createInvitation: builder.mutation<InvitationDto, CreateInvitationRequest>({
			query: (body) => ({ url: 'invitations', method: 'POST', body }),
		}),

		verifyInvitation: builder.query<any, string>({
			query: (token) => ({
				url: `invitations/verify/${encodeURIComponent(token)}`,
				method: 'GET',
			}),
		}),
		acceptInvitation: builder.mutation<
			any,
			{ token: string; password: string; profileOverride?: any }
		>({
			query: (body) => ({ url: 'invitations/accept-signup', method: 'POST', body }),
		}),

		resendInvitation: builder.mutation<{ success: true }, number>({
			query: (id) => ({ url: `invitations/${id}/resend`, method: 'POST' }),
		}),
		cancelInvitation: builder.mutation<{ success: true }, number>({
			query: (id) => ({ url: `invitations/${id}/cancel`, method: 'POST' }),
		}),
	}),
})

export const {
	useVerifyInvitationQuery,
	useAcceptInvitationMutation,
	useCreateInvitationMutation,
	useGetMyInvitationsQuery,
	useGetInvitationStatsQuery,
	useResendInvitationMutation,
	useCancelInvitationMutation,
} = invitationsApi
