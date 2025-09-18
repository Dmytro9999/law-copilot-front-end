import {
	LayoutGrid,
	Users,
	FileText,
	MessageSquare,
	Bell,
	Settings,
	type LucideIcon,
} from 'lucide-react'

export enum TabKey {
	Contracts = 'contracts',
	Tasks = 'tasks',
	Clients = 'clients',
	Meetings = 'meetings',
	Notifications = 'notifications',
	Settings = 'settings',
}

export const BASE_ROUTES: Record<TabKey, string> = {
	[TabKey.Contracts]: '/',
	[TabKey.Tasks]: '/tasks',
	[TabKey.Clients]: '/clients',
	[TabKey.Meetings]: '/meetings',
	[TabKey.Notifications]: '/notifications',
	[TabKey.Settings]: '/settings',
}

export const ICONS: Record<TabKey, LucideIcon> = {
	[TabKey.Contracts]: LayoutGrid,
	[TabKey.Tasks]: FileText,
	[TabKey.Clients]: Users,
	[TabKey.Meetings]: MessageSquare,
	[TabKey.Notifications]: Bell,
	[TabKey.Settings]: Settings,
}

export const I18N_KEYS: Record<TabKey, string> = {
	[TabKey.Contracts]: 'nav.contracts',
	[TabKey.Tasks]: 'nav.tasks',
	[TabKey.Clients]: 'nav.clients',
	[TabKey.Meetings]: 'nav.meetings',
	[TabKey.Notifications]: 'nav.notifications',
	[TabKey.Settings]: 'nav.settings',
}
