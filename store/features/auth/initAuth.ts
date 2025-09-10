import { createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { setUser, clearUser } from './authSlice'

export const initAuth = createAsyncThunk('auth/init', async (_, { dispatch }) => {
    try {
        const user = await dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true })).unwrap()
        dispatch(setUser(user))
        return user
    } catch {
        dispatch(clearUser())
        return null
    }
})
