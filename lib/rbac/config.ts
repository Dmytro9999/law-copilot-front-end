import { TabKey } from '@/lib/nav'
import { RoleSlug } from '@/store/features/auth/authTypes'

export const NAV_ACCESS: Record<TabKey, RoleSlug[]> = {
	[TabKey.Contracts]: ['admin', 'lawyer', 'client'],
	[TabKey.Tasks]: ['admin', 'lawyer', 'client'],
	[TabKey.Clients]: ['admin', 'lawyer'],
	[TabKey.Meetings]: ['admin', 'lawyer', 'client'],
	[TabKey.Notifications]: ['admin', 'lawyer', 'client'],
	[TabKey.Settings]: ['admin', 'lawyer', 'client'],
}

export const PERMISSIONS: Record<string, RoleSlug[]> = {
	'contracts.create': ['admin', 'lawyer'],
	'clients.invite': ['admin', 'lawyer'],
	'documents.upload': ['admin', 'lawyer'],
	'tasks.assign': ['admin', 'lawyer'],
	'risks.create': ['admin', 'lawyer'],
}
