import 'server-only'
import { cookies } from 'next/headers'
import { RoleSlug, UserMinimal } from '@/store/features/auth/authTypes'
import environment from '@/config'

const API_BASE = environment.BASE_URL

const ME_PATH = '/me'

export async function getServerUser(): Promise<UserMinimal> {
	try {
		const cookie = cookies().toString()

		const res = await fetch(`${API_BASE}${ME_PATH}`, {
			headers: { cookie },
			cache: 'no-store',
			credentials: 'include',
		})

		if (!res.ok) return null

		const data = await res.json()
		const roles: RoleSlug[] = Array.isArray(data?.roles)
			? data.roles.map((r: any) => r?.slug).filter(Boolean)
			: []

		return { id: data.id, roles }
	} catch {
		return null
	}
}
