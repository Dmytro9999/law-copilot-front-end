import { ReactNode } from 'react'
import { getServerUser } from '@/lib/auth/server/getServerUser'
import { tabsForRoles } from '@/lib/rbac'
import { AuthSessionProvider } from '@/providers/AuthSessionProvider'
import SidebarShell from '@/components/Layouts/AuthLayout/SidebarShell'
import Header from '@/components/Layouts/AuthLayout/Header'

import { TabKey } from '@/lib/nav'

export default async function HomeLayout({ children }: { children: ReactNode }) {
	const user = await getServerUser()
	const roles = user?.roles ?? []
	const allowedTabs: TabKey[] = roles.length ? tabsForRoles(roles) : []

	return (
		<AuthSessionProvider value={user}>
			<div className='flex h-screen bg-gradient-to-bl from-slate-50 via-blue-50 to-indigo-50'>
				<SidebarShell allowedTabs={allowedTabs} />
				<div className='flex flex-col flex-1 overflow-hidden'>
					<Header />
					<main className='flex-1 p-10 overflow-auto'>{children}</main>
				</div>
			</div>
		</AuthSessionProvider>
	)
}
