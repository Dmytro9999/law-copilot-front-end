import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './features/auth/authApi';
import authSlice from '@/store/features/auth/authSlice';

export const store = configureStore({
    reducer: {
        auth: authSlice,
        [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

