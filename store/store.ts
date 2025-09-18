import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './features/auth/authApi'
import authSlice from '@/store/features/auth/authSlice'
import { contractsApi } from '@/store/features/contracts/contractsApi'
import { invitationsApi } from '@/store/features/invitations/invitationsApi'

export const store = configureStore({
	reducer: {
		auth: authSlice,
		[authApi.reducerPath]: authApi.reducer,
		[contractsApi.reducerPath]: contractsApi.reducer,
		[invitationsApi.reducerPath]: invitationsApi.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			authApi.middleware,
			contractsApi.middleware,
			invitationsApi.middleware
		),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
