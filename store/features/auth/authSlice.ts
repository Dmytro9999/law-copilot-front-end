import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
	ILoginResponse,
	IRefreshResponse,
	ITwoFaChallenge,
	IUser,
} from '@/store/features/auth/authTypes'

type AuthState = {
	accessToken: string
	refreshToken: string
	user: any
	initialized: boolean
}

const initialState = {
	accessToken: '',
	refreshToken: '',
	user: null,
	initialized: false,
} as AuthState

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setLoginData: (state, action: PayloadAction<IUser>) => {
			state.accessToken = action.payload.data.tokens.accessToken
			state.refreshToken = action.payload.data.tokens.refreshToken
		},
		logout: (state) => {
			Object.assign(state, initialState)
		},
		setRefreshData: (state, action: PayloadAction<IRefreshResponse>) => {
			state.accessToken = action.payload.data.accessToken
			state.refreshToken = action.payload.data.refreshToken
		},

		setUser(state, action: PayloadAction<any>) {
			state.user = action.payload
			state.initialized = true
		},
		clearUser(state) {
			state.user = null
			state.initialized = true
		},
		resetAuth(state) {
			state.user = null
			state.initialized = false
		},
		setTwoFactorEnabled(state, action: PayloadAction<boolean>) {
			state.user = {
				...state.user,
				two_factor_enabled: action.payload,
			}
		},
	},
})

export const {
	setLoginData,
	logout,
	setRefreshData,
	setUser,
	clearUser,
	resetAuth,
	setTwoFactorEnabled,
} = authSlice.actions

export default authSlice.reducer
