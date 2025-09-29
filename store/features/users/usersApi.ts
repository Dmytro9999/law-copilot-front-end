import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import environment from '@/config'
import type { RootState } from '@/store/store'

export type SimpleUser = { id: number; name: string; email: string }

export interface PaginationUserDto {
	total: number
	pageNumber: number
	countPerPage: number
	pages: number
	list: SimpleUser[]
}

export const usersApi = createApi({
	reducerPath: 'usersApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${environment.BASE_URL}/`,
		credentials: 'include',
		prepareHeaders: (headers, { getState }) => {
			const accessToken = (getState() as RootState).auth?.accessToken
			if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
			return headers
		},
	}),
	endpoints: (builder) => ({
		getUsers: builder.query<
			PaginationUserDto,
			{ search?: string; pageNumber?: number; countPerPage?: number }
		>({
			query: ({ search = '', pageNumber = 1, countPerPage = 10 } = {}) => ({
				url: 'users',
				params: { search, pageNumber, countPerPage },
			}),
		}),

		quickSearchUsers: builder.query<SimpleUser[], { q: string; limit?: number }>({
			query: ({ q, limit = 8 }) => ({
				url: 'users/search',
				params: { q, limit },
			}),
			// для пустого q можно возвращать []
			transformResponse: (res: any) => (Array.isArray(res) ? res : []),
		}),
	}),
})

export const { useGetUsersQuery, useLazyQuickSearchUsersQuery } = usersApi
