import { LayoutGrid, Users, FileText, MessageSquare, Bell, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export enum TabKey {
	Contracts = 'contracts',
	Tasks = 'tasks',
	Clients = 'clients',
	Meetings = 'meetings',
	Notifications = 'notifications',
	Settings = 'settings',
}

type NavItem = {
	key: TabKey
	name: string
	icon: LucideIcon
	href: string
}

export const TAB_ROUTE: Record<TabKey, string> = {
	[TabKey.Contracts]: '/contracts',
	[TabKey.Tasks]: '/tasks',
	[TabKey.Clients]: '/clients',
	[TabKey.Meetings]: '/meetings',
	[TabKey.Notifications]: '/notifications',
	[TabKey.Settings]: '/settings',
}

export const NAV_ITEMS: NavItem[] = [
	{
		name: 'לוח חוזים',
		icon: LayoutGrid,
		key: TabKey.Contracts,
		href: TAB_ROUTE[TabKey.Contracts],
	},
	{ name: 'משימות', icon: FileText, key: TabKey.Tasks, href: TAB_ROUTE[TabKey.Tasks] },
	{ name: 'לקוחות', icon: Users, key: TabKey.Clients, href: TAB_ROUTE[TabKey.Clients] },
	{
		name: 'סיכומי פגישות',
		icon: MessageSquare,
		key: TabKey.Meetings,
		href: TAB_ROUTE[TabKey.Meetings],
	},
	{
		name: 'התראות',
		icon: Bell,
		key: TabKey.Notifications,
		href: TAB_ROUTE[TabKey.Notifications],
	},
	{ name: 'הגדרות', icon: Settings, key: TabKey.Settings, href: TAB_ROUTE[TabKey.Settings] },
]
