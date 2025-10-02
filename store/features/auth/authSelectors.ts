import { RootState } from '@/store/store'
const getAccessToken = (state: RootState) => state.auth.accessToken
const getRefreshToken = (state: RootState) => state.auth.refreshToken
const selectUser = (s: RootState) => s.auth.user
const selectAuthInitialized = (s: RootState) => s.auth.initialized

const authSelectors = {
	selectUser,
	selectAuthInitialized,
	getAccessToken,
	getRefreshToken,
}

export default authSelectors
