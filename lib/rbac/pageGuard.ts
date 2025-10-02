import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server/getServerUser'
import { can } from '@/lib/rbac'

export async function guard(action: string) {
	const user = await getServerUser()
	if (!user || !can(action, user.roles)) {
		redirect('/')
	}
	return user
}
