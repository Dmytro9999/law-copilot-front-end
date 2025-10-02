'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { TabKey } from '@/lib/nav'

export default function SidebarShell({ allowedTabs }: { allowedTabs: TabKey[] }) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	return (
		<Sidebar
			isCollapsed={isCollapsed}
			setIsCollapsed={setIsCollapsed}
			allowedTabs={allowedTabs}
		/>
	)
}
