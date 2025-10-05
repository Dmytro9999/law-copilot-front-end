// Redux
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Environment
import environment from '@/config'

// Types
import { RootState } from '@/store/store'
import {
	IConfirmEmailData,
	IConfirmEmailResponse,
	ILoginData,
	ILoginResponse,
	ILogoutData,
	ILogoutResponse,
	IRefreshData,
	IRefreshResponse,
	IResendConfirmEmailData,
	IResendConfirmEmailResponse,
	IResetPasswordSendEmailData,
	IResetPasswordSendEmailResponse,
	IResetPasswordUpdatePasswordData,
	IResetPasswordUpdatePasswordResponse,
	ISignUpData,
	ISignUpResponse,
} from '@/store/features/auth/authTypes'
import { setTwoFactorEnabled } from '@/store/features/auth/authSlice'

export const authApi = createApi({
	reducerPath: 'authApi',

	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers, { getState }) => {
			const accessToken = (getState() as RootState).auth.accessToken

			if (accessToken) {
				headers.set('Authorization', `Bearer ${accessToken}`)
			}

			headers.set('Content-Type', 'application/json')

			return headers
		},
	}),

	endpoints: (builder) => ({
		signUp: builder.mutation<ISignUpResponse, ISignUpData>({
			query: (credentials) => ({
				url: 'sign-up',
				method: 'POST',
				body: credentials,
			}),
		}),

		login: builder.mutation<ILoginResponse, ILoginData>({
			query: (credentials) => ({
				url: 'sign-in',
				method: 'POST',
				body: credentials,
			}),
		}),

		me: builder.query<any, void>({ query: () => ({ url: 'me', method: 'GET' }) }),

		resetPasswordSendEmail: builder.mutation({
			query: (payload) => ({
				url: 'reset-password',
				method: 'POST',
				body: payload,
			}),
		}),

		verifyResetToken: builder.query<
			{ token: string; email?: string; expired_at?: string; activate_at?: string },
			{ token: string }
		>({
			query: ({ token }) => ({
				url: `reset-password/${encodeURIComponent(token)}/is-expired`,
				method: 'GET',
			}),
		}),

		confirmResetPassword: builder.mutation<
			{ message: string },
			{ email: string; password: string; token: string }
		>({
			query: (body) => ({ url: 'users/password', method: 'PUT', body }),
		}),

		verify2fa: builder.mutation<
			{ id: number; email: string; two_factor_enabled: boolean },
			{ twoFaToken: string; code: string }
		>({
			query: (body) => ({ url: '2fa/verify', method: 'POST', body }),
		}),

		resend2fa: builder.mutation<void, { twoFaToken: string }>({
			query: (body) => ({ url: '2fa/resend', method: 'POST', body }),
		}),

		enable2fa: builder.mutation<{ two_factor_enabled: boolean }, void>({
			query: () => ({
				url: '2fa/enable',
				method: 'POST',
				body: {},
			}),
			async onQueryStarted(_, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled
					dispatch(setTwoFactorEnabled(true))
					dispatch(
						authApi.util.updateQueryData('me', undefined, (draft: any) => {
							if (draft) draft.two_factor_enabled = true
						})
					)
				} catch {}
			},
		}),

		disable2fa: builder.mutation<{ two_factor_enabled: boolean }, { password: string }>({
			query: ({ password }) => ({
				url: '2fa/disable',
				method: 'POST',
				body: { password },
			}),
			async onQueryStarted(_, { dispatch, queryFulfilled }) {
				try {
					const { data } = await queryFulfilled
					dispatch(setTwoFactorEnabled(false))
					dispatch(
						authApi.util.updateQueryData('me', undefined, (draft: any) => {
							if (draft) draft.two_factor_enabled = false
						})
					)
				} catch {}
			},
		}),
		///////////////

		refresh: builder.mutation<IRefreshResponse, IRefreshData>({
			query: (credentials) => ({
				url: 'refresh',
				method: 'POST',
				body: credentials,
			}),
		}),

		logout: builder.mutation<{ message: string }, void>({
			query: () => ({
				url: 'logout',
				method: 'POST',
			}),
		}),

		resetPasswordUpdatePassword: builder.mutation<
			IResetPasswordUpdatePasswordResponse,
			IResetPasswordUpdatePasswordData
		>({
			query: ({ password, confirmPassword, token }) => ({
				url: `reset/${token}`,
				method: 'POST',
				body: { password, confirmPassword },
			}),
		}),
	}),
})

export const {
	useSignUpMutation,
	useLoginMutation,
	useRefreshMutation,
	useLogoutMutation,

	useVerifyResetTokenQuery,
	useConfirmResetPasswordMutation,
	useVerify2faMutation,
	useResend2faMutation,
	useEnable2faMutation,
	useDisable2faMutation,

	useResetPasswordSendEmailMutation,
	useResetPasswordUpdatePasswordMutation,
} = authApi
