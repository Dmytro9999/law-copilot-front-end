// Types
import { RootState } from '@/store/store';

const getAccessToken = (state: RootState) => state.auth.accessToken;
const getRefreshToken = (state: RootState) => state.auth.refreshToken;

 const selectUser = (s: RootState) => s.auth.user
 const selectAuthInitialized = (s: RootState) => s.auth.initialized

const authSelectors = {
  getAccessToken,
  getRefreshToken,
    selectUser,
    selectAuthInitialized
};

export default authSelectors;
