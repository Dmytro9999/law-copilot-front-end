import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '@/store/store';
import authSelectors from '@/store/features/auth/authSelectors';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = (): boolean => {
  const refreshToken = useAppSelector(authSelectors.getRefreshToken);
  const accessToken = useAppSelector(authSelectors.getAccessToken);
  const isAuthenticated = !!(refreshToken && accessToken);

  return isAuthenticated;
};
