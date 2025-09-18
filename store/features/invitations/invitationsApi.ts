import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'

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
		verifyInvitation: builder.query<any, string>({
			query: (token) => ({
				url: `invitations/verify?token=${encodeURIComponent(token)}`,
				method: 'GET',
			}),
		}),
		acceptInvitation: builder.mutation<
			any,
			{ token: string; password: string; profileOverride?: any }
		>({
			query: (body) => ({ url: 'invitations/accept-signup', method: 'POST', body }),
		}),
	}),
})

export const { useVerifyInvitationQuery, useAcceptInvitationMutation } = invitationsApi
