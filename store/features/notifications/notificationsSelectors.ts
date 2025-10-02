import { notificationsApi } from './notificationsApi'
import { RootState } from '@/store/store'

export const selectUnreadQueryState = (state: RootState) =>
	notificationsApi.endpoints.getUnreadCount.select(undefined)(state)

export const selectUnreadCount = (state: RootState) =>
	notificationsApi.endpoints.getUnreadCount.select(undefined)(state)?.data?.count ?? 0
