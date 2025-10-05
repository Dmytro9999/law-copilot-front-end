import { TabKey } from '@/lib/nav'
import { RolesEnum } from '@/store/features/auth/authTypes'

export const NAV_ACCESS: Record<TabKey, RolesEnum[]> = {
	[TabKey.Contracts]: [RolesEnum.ADMIN, RolesEnum.LAWYER, RolesEnum.CLIENT],
	[TabKey.Tasks]: [RolesEnum.ADMIN, RolesEnum.LAWYER, RolesEnum.CLIENT],
	[TabKey.Clients]: [RolesEnum.ADMIN, RolesEnum.LAWYER],
	[TabKey.Meetings]: [RolesEnum.ADMIN, RolesEnum.LAWYER, RolesEnum.CLIENT],
	[TabKey.Notifications]: [RolesEnum.ADMIN, RolesEnum.LAWYER, RolesEnum.CLIENT],
	[TabKey.Settings]: [RolesEnum.ADMIN, RolesEnum.LAWYER, RolesEnum.CLIENT],
}

export const PERMISSIONS: Record<string, RolesEnum[]> = {
	'contracts.create': [RolesEnum.ADMIN, RolesEnum.LAWYER],
	'clients.invite': [RolesEnum.ADMIN, RolesEnum.LAWYER],
	'documents.upload': [RolesEnum.ADMIN, RolesEnum.LAWYER],
	'tasks.assign': [RolesEnum.ADMIN, RolesEnum.LAWYER],
	'risks.create': [RolesEnum.ADMIN, RolesEnum.LAWYER],
	'evidences.approve': [RolesEnum.ADMIN, RolesEnum.LAWYER],
}
