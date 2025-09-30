import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import {
	NotificationDto,
	NotificationListResponse,
	UnreadCountResponse,
} from './notificationsTypes'

export const notificationsApi = createApi({
	reducerPath: 'notificationsApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers) => {
			headers.set('Content-Type', 'application/json')
			return headers
		},
	}),
	tagTypes: ['Notifications', 'Unread'],
	endpoints: (builder) => ({
		getNotifications: builder.query<
			NotificationListResponse,
			{ limit?: number; before?: string } | void
		>({
			query: (params) => ({ url: 'notifications', method: 'GET', params }),
			providesTags: (res) =>
				res?.items
					? [
							...res.items.map((i) => ({ type: 'Notifications' as const, id: i.id })),
							{ type: 'Notifications' as const, id: 'LIST' },
						]
					: [{ type: 'Notifications' as const, id: 'LIST' }],
			keepUnusedDataFor: 30,
		}),

		getUnreadCount: builder.query<UnreadCountResponse, void>({
			query: () => ({ url: 'notifications/unread-count', method: 'GET' }),
			providesTags: [{ type: 'Unread', id: 'COUNT' }],
		}),

		// если перейдёте на bigint PK — поменяйте generic второго параметра на number
		markNotificationRead: builder.mutation<{ ok: true }, string>({
			query: (id) => ({ url: `notifications/${id}/read`, method: 'PATCH' }),
			async onQueryStarted(id, { dispatch, queryFulfilled }) {
				const patchA = dispatch(
					notificationsApi.util.updateQueryData(
						'getNotifications',
						undefined,
						(draft) => {
							const n = draft.items.find((x) => x.id === id)
							if (n) {
								n.isRead = true
								n.readAt = new Date().toISOString()
							}
						}
					)
				)
				const patchB = dispatch(
					notificationsApi.util.updateQueryData('getUnreadCount', undefined, (d) => {
						if (d.count > 0) d.count--
					})
				)
				try {
					await queryFulfilled
				} catch {
					patchA.undo()
					patchB.undo()
				}
			},
			invalidatesTags: (r, e, id) => [{ type: 'Notifications', id }],
		}),

		markAllNotificationsRead: builder.mutation<{ ok: true }, void>({
			query: () => ({ url: 'notifications/read-all', method: 'PATCH' }),
			async onQueryStarted(_, { dispatch, queryFulfilled }) {
				const patchA = dispatch(
					notificationsApi.util.updateQueryData(
						'getNotifications',
						undefined,
						(draft) => {
							const now = new Date().toISOString()
							draft.items.forEach((n) => {
								n.isRead = true
								n.readAt = now
							})
						}
					)
				)
				const patchB = dispatch(
					notificationsApi.util.updateQueryData('getUnreadCount', undefined, (d) => {
						d.count = 0
					})
				)
				try {
					await queryFulfilled
				} catch {
					patchA.undo()
					patchB.undo()
				}
			},
			invalidatesTags: [
				{ type: 'Notifications', id: 'LIST' },
				{ type: 'Unread', id: 'COUNT' },
			],
		}),
	}),
})

export const {
	useGetNotificationsQuery,
	useGetUnreadCountQuery,
	useMarkNotificationReadMutation,
	useMarkAllNotificationsReadMutation,
} = notificationsApi
