'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/nav'
import { Brain, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
//
// export default function Sidebar({
// 	isCollapsed,
// 	setIsCollapsed,
// }: {
// 	isCollapsed: boolean
// 	setIsCollapsed: (v: boolean) => void
// }) {
// 	const pathname = usePathname()
//
// 	return (
// 		<div
// 			className={cn(
// 				'relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out shadow-2xl border-l border-slate-700/50',
// 				isCollapsed ? 'w-20' : 'w-80'
// 			)}
// 		>
// 			{/* Logo/Header */}
// 			<div className='flex items-center justify-center h-24 border-b border-slate-700/50 bg-gradient-to-l from-blue-900/20 to-purple-900/20'>
// 				<div className={cn('flex items-center gap-4', isCollapsed && 'hidden')}>
// 					<div className='relative'>
// 						<Brain className='h-12 w-12 text-blue-400' />
// 						<Sparkles className='h-5 w-5 text-yellow-400 absolute -top-1 -left-1 animate-pulse' />
// 					</div>
// 					<div>
// 						<h1 className='text-3xl font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent'>
// 							LAWCOPILOT
// 						</h1>
// 						<p className='text-sm text-slate-400 font-medium'>AI Legal Assistant</p>
// 					</div>
// 				</div>
// 				<Brain className={cn('h-12 w-12 text-blue-400', !isCollapsed && 'hidden')} />
// 			</div>
//
// 			{/* Collapse */}
// 			<Button
// 				variant='ghost'
// 				size='icon'
// 				className='absolute top-10 -right-5 z-10 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg border-2 border-white/20 h-10 w-10'
// 				onClick={() => setIsCollapsed(!isCollapsed)}
// 				aria-label={isCollapsed ? 'Expand' : 'Collapse'}
// 			>
// 				{isCollapsed ? <span>›</span> : <span>‹</span>}
// 			</Button>
//
// 			{/* Nav */}
// 			<nav className='mt-10 px-6'>
// 				<ul className='space-y-3'>
// 					{NAV_ITEMS.map((item) => {
// 						const active = pathname?.startsWith(item.href)
// 						return (
// 							<li key={item.key}>
// 								<Link
// 									href={item.href}
// 									className={cn(
// 										'w-full flex items-center p-4 rounded-xl transition-all duration-200 group text-lg',
// 										active
// 											? 'bg-gradient-to-l from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg'
// 											: 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
// 										isCollapsed && 'justify-center px-3'
// 									)}
// 								>
// 									<item.icon
// 										className={cn('h-6 w-6', active && 'text-blue-400')}
// 									/>
// 									{!isCollapsed && (
// 										<span className='ml-4 font-medium'>{item.name}</span>
// 									)}
// 									{!isCollapsed && active && (
// 										<Zap className='h-5 w-5 text-yellow-400 ml-auto animate-pulse' />
// 									)}
// 								</Link>
// 							</li>
// 						)
// 					})}
// 				</ul>
// 			</nav>
//
// 			{/* AI status */}
// 			{!isCollapsed && (
// 				<div className='absolute bottom-8 right-6 left-6'>
// 					<div className='bg-gradient-to-l from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-5'>
// 						<div className='flex items-center gap-3 mb-3'>
// 							<div className='h-3 w-3 bg-green-400 rounded-full animate-pulse' />
// 							<span className='text-lg font-medium text-green-400'>
// 								Google Gemini מחובר
// 							</span>
// 						</div>
// 						<p className='text-sm text-slate-400'>מערכת פעילה ומנתחת חוזים</p>
// 						<p className='text-xs text-slate-500 mt-2'>Gemini + n8n + Supabase</p>
// 					</div>
// 				</div>
// 			)}
// 		</div>
// 	)
// }

import React from 'react'

interface IPropsSidebar {
	isCollapsed: boolean
	setIsCollapsed: (v: boolean) => void
}
const Sidebar: React.FC<IPropsSidebar> = ({ isCollapsed, setIsCollapsed }) => {
	const pathname = usePathname()
	return (
		<div
			className={cn(
				'relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out shadow-2xl border-l border-slate-700/50',
				isCollapsed ? 'w-20' : 'w-80'
			)}
		>
			{/* Logo/Header */}
			<div className='flex items-center justify-center h-24 border-b border-slate-700/50 bg-gradient-to-l from-blue-900/20 to-purple-900/20'>
				<div className={cn('flex items-center gap-4', isCollapsed && 'hidden')}>
					<div className='relative'>
						<Brain className='h-12 w-12 text-blue-400' />
						<Sparkles className='h-5 w-5 text-yellow-400 absolute -top-1 -left-1 animate-pulse' />
					</div>
					<div>
						<h1 className='text-3xl font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent'>
							LAWCOPILOT
						</h1>
						<p className='text-sm text-slate-400 font-medium'>AI Legal Assistant</p>
					</div>
				</div>
				<Brain className={cn('h-12 w-12 text-blue-400', !isCollapsed && 'hidden')} />
			</div>

			{/* Collapse */}
			<Button
				variant='ghost'
				size='icon'
				className='absolute top-10 -right-5 z-10 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg border-2 border-white/20 h-10 w-10'
				onClick={() => setIsCollapsed(!isCollapsed)}
				aria-label={isCollapsed ? 'Expand' : 'Collapse'}
			>
				{isCollapsed ? <span>›</span> : <span>‹</span>}
			</Button>

			{/* Nav */}
			<nav className='mt-10 px-6'>
				<ul className='space-y-3'>
					{NAV_ITEMS.map((item) => {
						const active = pathname?.startsWith(item.href)
						return (
							<li key={item.key}>
								<Link
									href={item.href}
									className={cn(
										'w-full flex items-center p-4 rounded-xl transition-all duration-200 group text-lg',
										active
											? 'bg-gradient-to-l from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg'
											: 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
										isCollapsed && 'justify-center px-3'
									)}
								>
									<item.icon
										className={cn('h-6 w-6', active && 'text-blue-400')}
									/>
									{!isCollapsed && (
										<span className='ml-4 font-medium'>{item.name}</span>
									)}
									{!isCollapsed && active && (
										<Zap className='h-5 w-5 text-yellow-400 ml-auto animate-pulse' />
									)}
								</Link>
							</li>
						)
					})}
				</ul>
			</nav>

			{/* AI status */}
			{!isCollapsed && (
				<div className='absolute bottom-8 right-6 left-6'>
					<div className='bg-gradient-to-l from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-5'>
						<div className='flex items-center gap-3 mb-3'>
							<div className='h-3 w-3 bg-green-400 rounded-full animate-pulse' />
							<span className='text-lg font-medium text-green-400'>
								Google Gemini מחובר
							</span>
						</div>
						<p className='text-sm text-slate-400'>מערכת פעילה ומנתחת חוזים</p>
						<p className='text-xs text-slate-500 mt-2'>Gemini + n8n + Supabase</p>
					</div>
				</div>
			)}
		</div>
	)
}

export default Sidebar
