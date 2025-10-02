import { NAV_ACCESS, PERMISSIONS } from './config'
import { TabKey } from '@/lib/nav'
import { RolesEnum } from '@/store/features/auth/authTypes'

export function tabsForRoles(roles: RolesEnum[]): TabKey[] {
	const keys = Object.keys(NAV_ACCESS) as TabKey[]
	return keys.filter((tab) => NAV_ACCESS[tab].some((r) => roles.includes(r)))
}

export function can(action: string, roles: RolesEnum[]): boolean {
	const allowed = PERMISSIONS[action]
	if (!allowed) return false
	return allowed.some((r) => roles.includes(r))
}
