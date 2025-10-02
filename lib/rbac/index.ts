import { NAV_ACCESS, PERMISSIONS } from './config'
import { TabKey } from '@/lib/nav'
import { RoleSlug } from '@/store/features/auth/authTypes'

export function tabsForRoles(roles: RoleSlug[]): TabKey[] {
	const keys = Object.keys(NAV_ACCESS) as TabKey[]
	return keys.filter((tab) => NAV_ACCESS[tab].some((r) => roles.includes(r)))
}

export function can(action: string, roles: RoleSlug[]): boolean {
	const allowed = PERMISSIONS[action]
	if (!allowed) return false
	return allowed.some((r) => roles.includes(r))
}
