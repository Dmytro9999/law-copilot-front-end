'use client'

import { useState } from 'react'
import Sidebar from '@/components/Layouts/AuthLayout/Sidebar'
import Header from '@/components/Layouts/AuthLayout/Header'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
	const [isCollapsed, setIsCollapsed] = useState(false)

	const [stats, setStats] = useState({
		activeContracts: 0,
		pendingObligations: 0,
		overdueObligations: 0,
		completedThisWeek: 0,
	})

	// useEffect(() => {
	// 	(async () => {
	// 		try { setStats(await getContractStats()) } catch {}
	// 	})()
	// }, [])

	return (
		<div className='flex h-screen bg-gradient-to-bl from-slate-50 via-blue-50 to-indigo-50'>
			<Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
			<div className='flex flex-col flex-1 overflow-hidden'>
				<Header stats={stats} />
				<main className='flex-1 p-10'>{children}</main>
			</div>
		</div>
	)
}
